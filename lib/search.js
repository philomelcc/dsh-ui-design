/**
 * 检索：同义词展开 + 分层打分 + 字面兜底。
 *
 * 目标：2000+ 项时也能按「场景描述」召回——用户说「弹个对话框」，库里叫「弹窗」，
 * 靠同义词表把词面拉齐；完全没命中时再用 bigram 重合度兜底，避免 0 结果。
 *
 * 这一层不依赖 embedding。向量检索留作可选增强（见 README 的「检索」一节）。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SYNONYMS_FILE = path.join(here, "..", "data", "synonyms.json");

const STOP_WORDS = new Set([
  "的", "了", "在", "是", "和", "与", "用", "个", "这", "那", "做", "一个", "一下",
  "the", "a", "an", "of", "to", "for", "and", "or",
]);

/** 字段权重：名字 > 别名 > 标签 > 说明 > 场景。 */
const FIELD_WEIGHTS = {
  name: 4,
  aliases: 3.5,
  tags: 3,
  summary: 2,
  usage: 1.5,
  caution: 1.5,
  hint: 1,
};

let synonymMap = null;

/** 同义词表：word -> Set(同组词)。文件缺失时退化为空表。 */
export function loadSynonyms() {
  if (synonymMap) return synonymMap;
  synonymMap = new Map();
  try {
    const groups = JSON.parse(fs.readFileSync(SYNONYMS_FILE, "utf8"));
    if (Array.isArray(groups)) {
      for (const group of groups) {
        const words = (Array.isArray(group) ? group : [group])
          .map((w) => String(w).toLowerCase().trim())
          .filter(Boolean);
        for (const word of words) {
          const set = synonymMap.get(word) || new Set();
          words.forEach((other) => set.add(other));
          synonymMap.set(word, set);
        }
      }
    }
  } catch (_error) {
    /* 没有同义词表就只做词面匹配 */
  }
  return synonymMap;
}

/**
 * 拆词：按空白/标点拆，再对中文长词做 2 字滑窗。
 * 中文没有空格，「列表转圈」整词匹配不到任何字段；滑窗拆成「列表 / 表转 / 转圈」后
 * 「转圈」能命中同义词组、「列表」能命中说明字段。长词本身保留，精确短语仍优先。
 * 注意：词本身在同义词表里有映射时**不滑窗**——「对话框」查表能展开成「弹窗」，
 * 拆成「对话/话框」反而会偏到聊天类。
 */
function splitTerms(q) {
  const raw = String(q || "")
    .toLowerCase()
    .split(/[\s,，、;；:：/|]+/)
    .filter((t) => t && !STOP_WORDS.has(t));
  const synonyms = loadSynonyms();
  const out = new Set();
  for (const term of raw) {
    out.add(term);
    if (synonyms.has(term)) continue;
    if (term.length > 2 && /^[\u4e00-\u9fa5]+$/.test(term)) {
      for (let i = 0; i + 2 <= term.length; i++) out.add(term.slice(i, i + 2));
    }
  }
  return Array.from(out);
}

/** 每个词展开成 [{ term, weight }]：原词 1.0，同义词 0.6。 */
function expandTerms(terms) {
  const map = new Map();
  const synonyms = loadSynonyms();
  for (const term of terms) {
    const prev = map.get(term);
    if (!prev || prev < 1) map.set(term, 1);
    const group = synonyms.get(term);
    if (!group) continue;
    for (const other of group) {
      if (other === term) continue;
      const w = map.get(other);
      if (!w || w < 0.6) map.set(other, 0.6);
    }
  }
  return Array.from(map, ([term, weight]) => ({ term, weight }));
}

function fieldText(meta, field) {
  if (field === "tags") return (meta.tags || []).join(" ").toLowerCase();
  if (field === "aliases") return (meta.aliases || []).join(" ").toLowerCase();
  return String(meta[field] || "").toLowerCase();
}

function scoreDesign(meta, expanded, ownSet) {
  let score = 0;
  let ownHits = 0;
  let expandedHits = 0;
  let hasStrongHit = false;
  for (const { term, weight } of expanded) {
    let best = 0;
    let bestField = "";
    for (const [field, fw] of Object.entries(FIELD_WEIGHTS)) {
      const text = fieldText(meta, field);
      if (text && text.includes(term)) {
        const value = fw * weight;
        if (value > best) {
          best = value;
          bestField = field;
        }
      }
    }
    if (best > 0) {
      score += best;
      if (ownSet.has(term)) ownHits += 1;
      else expandedHits += 1;
      if (bestField === "name" || bestField === "aliases" || bestField === "tags") hasStrongHit = true;
    }
  }
  return { score, ownHits, expandedHits, hasStrongHit };
}

function bigrams(text) {
  const s = String(text || "").toLowerCase().replace(/\s+/g, "");
  const out = new Set();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

function overlapRatio(query, text) {
  const q = bigrams(query);
  if (!q.size) return 0;
  const t = bigrams(text);
  if (!t.size) return 0;
  let hit = 0;
  for (const g of q) if (t.has(g)) hit += 1;
  return hit / q.size;
}

/**
 * 检索。
 * @param {Array} metas 元数据数组（含 name/tags/summary/usage/caution/aliases）
 * @param {{q?: string, tag?: string, offset?: number, limit?: number}} options
 * @returns {{items: Array, total: number, offset: number, limit: number, mode: 'keyword'|'fuzzy'|'all'}}
 */
export function searchDesigns(metas, options) {
  const { q = "", tag = "", offset = 0, limit = 0 } = options || {};
  const tagFilter = String(tag || "").trim();
  let items = metas.slice();
  if (tagFilter) items = items.filter((m) => (m.tags || []).includes(tagFilter));

  const terms = splitTerms(q);
  let mode = "all";
  let ordered = items;

  if (terms.length) {
    const expanded = expandTerms(terms);
    const ownSet = new Set(terms);
    const scored = [];
    for (const meta of items) {
      const hit = scoreDesign(meta, expanded, ownSet);
      if (hit.ownHits + hit.expandedHits > 0) scored.push({ meta, ...hit });
    }
    if (scored.length) {
      mode = "keyword";
      // 强字段（名字/别名/标签）命中优先于只命中场景说明的；同强度再比分数、原词命中
      scored.sort(
        (a, b) =>
          Number(b.hasStrongHit) - Number(a.hasStrongHit) ||
          b.score - a.score ||
          b.ownHits - a.ownHits ||
          b.meta.createdAt - a.meta.createdAt
      );
      ordered = scored.map((s) => s.meta);
    } else {
      // 词面完全没命中：用 bigram 重合度兜底，避免直接 0 结果
      mode = "fuzzy";
      const query = terms.join("");
      const fuzzy = [];
      for (const meta of items) {
        const text = [meta.name, meta.tags, meta.summary, meta.usage].join(" ");
        const ratio = overlapRatio(query, text);
        if (ratio > 0.2) fuzzy.push({ meta, ratio });
      }
      fuzzy.sort((a, b) => b.ratio - a.ratio || b.meta.createdAt - a.meta.createdAt);
      ordered = fuzzy.map((f) => f.meta);
    }
  } else {
    ordered = items.slice().sort((a, b) => b.createdAt - a.createdAt);
  }

  const total = ordered.length;
  const start = Math.max(0, Number(offset) || 0);
  const size = Number(limit) > 0 ? Math.min(Number(limit), 200) : 0;
  return {
    items: size ? ordered.slice(start, start + size) : ordered.slice(start),
    total,
    offset: start,
    limit: size || total,
    mode,
  };
}
