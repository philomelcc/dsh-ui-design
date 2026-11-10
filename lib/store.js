/**
 * UI 设计知识库的持久化 store（v2 分片存储）。
 *
 * 目录结构（`$DSH_HOME/storages/ui-design/`）：
 *   index.json          —— 元数据索引（id/name/tags/summary/usage/caution/hint/时间戳），常驻内存
 *   designs/<id>.json   —— 单条设计的完整内容（prompt + demoHtml），按需读
 *   designs.json        —— v1 旧版单文件，迁移后改名 `.bak-v1-<ts>` 保留
 *
 * 为什么分片：2000+ 项设计时单个 JSON 会有几十 MB，全量加载不可行；
 * 索引保持几百 KB 可一次加载，完整内容只在需要时读一个文件。
 *
 * 所有写入走 tmp + rename，避免半截 JSON。
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { SEED_DESIGNS } from "./seeds.js";
import { searchDesigns } from "./search.js";

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const DATA_DIR = path.join(DSH_HOME, "storages", "ui-design");
const INDEX_FILE = path.join(DATA_DIR, "index.json");
const OLD_FILE = path.join(DATA_DIR, "designs.json");
const DESIGNS_DIR = path.join(DATA_DIR, "designs");
/** 随包发布的全量初始设计库（`<package>/data/`）。 */
const PACKAGE_DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");

const MAX_NAME = 60;
const MAX_TAGS = 8;
const MAX_SUMMARY = 300;
const MAX_SCENARIO = 120;
const MAX_HINT = 80;
const MAX_DEMO = 400 * 1024;

/** 内存里的元数据索引：{ version, updatedAt, designs: meta[] } */
let index = null;

function now() {
  return Date.now();
}

function trim(value, max) {
  const text = String(value == null ? "" : value).trim();
  return max ? text.slice(0, max) : text;
}

function normalizeTags(tags) {
  const list = Array.isArray(tags)
    ? tags
    : String(tags || "")
        .split(/[,，、\s]+/)
        .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const tag = trim(raw, 20);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

function normalizeDesign(input, fallback) {
  const base = fallback || {};
  const name = trim(input && input.name, MAX_NAME) || trim(base.name, MAX_NAME);
  const summary = trim(input && input.summary, MAX_SUMMARY) || trim(base.summary, MAX_SUMMARY);
  const usage = trim(input && input.usage, MAX_SCENARIO) || trim(base.usage, MAX_SCENARIO);
  const caution = trim(input && input.caution, MAX_SCENARIO) || trim(base.caution, MAX_SCENARIO);
  const hint = trim(input && input.hint, MAX_HINT) || trim(base.hint, MAX_HINT);
  const prompt = trim(input && input.prompt) || trim(base.prompt);
  const demoHtml = String((input && input.demoHtml) || base.demoHtml || "");
  return {
    id: trim((input && input.id) || base.id),
    name,
    tags: normalizeTags((input && input.tags) || base.tags),
    aliases: normalizeTags((input && input.aliases) || base.aliases),
    summary,
    usage,
    caution,
    hint,
    prompt,
    demoHtml,
    createdAt: base.createdAt || now(),
    updatedAt: now(),
  };
}

/** 单条设计的元数据：索引里只存这些。 */
function toMeta(design) {
  return {
    id: design.id,
    name: design.name,
    tags: design.tags,
    aliases: design.aliases || [],
    summary: design.summary,
    usage: design.usage,
    caution: design.caution,
    hint: design.hint,
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
  };
}

function fromMeta(meta) {
  return {
    ...meta,
    prompt: "",
    demoHtml: "",
  };
}

function freshId() {
  return "d" + now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function uniqueId(preferred, metas, ownId) {
  const taken = new Set(metas.map((d) => d.id).filter((id) => id && id !== ownId));
  let id = trim(preferred) || freshId();
  while (taken.has(id)) id = freshId();
  return id;
}

function ensureDirs() {
  fs.mkdirSync(DESIGNS_DIR, { recursive: true });
}

function writeFileAtomic(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp-" + process.pid;
  fs.writeFileSync(tmp, text, "utf8");
  fs.renameSync(tmp, file);
}

function designFile(id) {
  return path.join(DESIGNS_DIR, id + ".json");
}

function readDesignFile(id) {
  try {
    const raw = fs.readFileSync(designFile(id), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return normalizeDesign(parsed, parsed);
  } catch (_error) {
    /* 缺文件：返回 null */
  }
  return null;
}

function writeDesignFile(design) {
  writeFileAtomic(designFile(design.id), JSON.stringify(design, null, 2));
}

function persistIndex() {
  writeFileAtomic(
    INDEX_FILE,
    JSON.stringify({ version: 2, updatedAt: index.updatedAt, designs: index.designs }, null, 2),
  );
}

/** v1 单文件 → v2 分片。旧文件改名保留。 */
function migrateFromV1(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.designs)) return null;
  const metas = [];
  for (const item of parsed.designs) {
    const design = normalizeDesign(item, item);
    if (!design.name) continue;
    design.id = trim(design.id) || freshId();
    writeDesignFile(design);
    metas.push(toMeta(design));
  }
  return { version: 2, updatedAt: parsed.updatedAt || now(), designs: metas };
}

/** 从包内 `data/` 写入初始库（全量内置设计）；返回 null 表示包内没有数据。 */
function seedFromPackageData() {
  try {
    const srcIndex = path.join(PACKAGE_DATA_DIR, "index.json");
    if (!fs.existsSync(srcIndex)) return null;
    const parsed = JSON.parse(fs.readFileSync(srcIndex, "utf8"));
    if (!parsed || !Array.isArray(parsed.designs)) return null;
    const metas = [];
    for (const meta of parsed.designs) {
      const srcFile = path.join(PACKAGE_DATA_DIR, "designs", String(meta.id) + ".json");
      if (!fs.existsSync(srcFile)) continue;
      const design = normalizeDesign(JSON.parse(fs.readFileSync(srcFile, "utf8")), {});
      if (!design.name) continue;
      design.id = trim(design.id) || trim(meta.id) || freshId();
      writeDesignFile(design);
      metas.push(toMeta(design));
    }
    return metas.length ? { version: 2, updatedAt: now(), designs: metas } : null;
  } catch (_error) {
    return null;
  }
}

function seedIndex() {
  const metas = [];
  for (const item of SEED_DESIGNS) {
    const design = normalizeDesign(item, { createdAt: now() });
    if (!design.id) design.id = freshId();
    writeDesignFile(design);
    metas.push(toMeta(design));
  }
  return { version: 2, updatedAt: now(), designs: metas };
}

/** 懒加载索引；v1 自动迁移，空库写入内置种子。 */
export function load() {
  if (index) return index;
  ensureDirs();

  if (fs.existsSync(INDEX_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
      if (parsed && Array.isArray(parsed.designs)) {
        index = {
          version: 2,
          updatedAt: parsed.updatedAt || now(),
          designs: parsed.designs.map((m) => fromMeta(m)),
        };
        return index;
      }
    } catch (_error) {
      /* 索引损坏：继续走迁移/种子 */
    }
  }

  if (fs.existsSync(OLD_FILE)) {
    try {
      const migrated = migrateFromV1(fs.readFileSync(OLD_FILE, "utf8"));
      if (migrated) {
        index = migrated;
        persistIndex();
        fs.renameSync(OLD_FILE, OLD_FILE + ".bak-v1-" + now());
        return index;
      }
    } catch (_error) {
      /* 迁移失败：留旧文件，走种子兜底 */
    }
  }

  index = seedFromPackageData() || seedIndex();
  persistIndex();
  return index;
}

/** 只读元数据列表（不读 demo/prompt）。 */
export function listMetas() {
  return load().designs;
}

/**
 * 分页 + 搜索。检索逻辑在 `search.js`：同义词展开 + 分层打分 + 字面兜底。
 * 这里只负责把内存索引喂过去。
 */
export function listDesigns(options) {
  return searchDesigns(load().designs, options);
}

export function listTags() {
  const counts = new Map();
  for (const design of load().designs) {
    for (const tag of design.tags) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "zh"),
  );
}

function findMeta(key) {
  const target = trim(key);
  if (!target) return null;
  const metas = load().designs;
  return (
    metas.find((d) => d.id === target) ||
    metas.find((d) => d.name === target) ||
    metas.find((d) => d.name.toLowerCase() === target.toLowerCase()) ||
    null
  );
}

/** 按 id 或名字取完整设计（读分片文件）。 */
export function getDesign(key) {
  const meta = findMeta(key);
  if (!meta) return null;
  return readDesignFile(meta.id) || fromMeta(meta);
}

function assertNameFree(name, ownId) {
  const clash = load().designs.find((d) => d.id !== ownId && d.name === name);
  if (clash) {
    const error = new Error(`已经有一个叫「${name}」的设计了`);
    error.code = "duplicate_name";
    throw error;
  }
}

function assertShape(design) {
  if (!design.name) {
    const error = new Error("设计名不能为空");
    error.code = "invalid_name";
    throw error;
  }
  if (!design.prompt) {
    const error = new Error("提示词（prompt）不能为空——它是这个知识库真正被 AI 使用的内容");
    error.code = "invalid_prompt";
    throw error;
  }
  if (!design.demoHtml.trim()) {
    const error = new Error("demoHtml 不能为空——卡片需要可交互的演示");
    error.code = "invalid_demo";
    throw error;
  }
  if (Buffer.byteLength(design.demoHtml, "utf8") > MAX_DEMO) {
    const error = new Error("demoHtml 太大了（上限 400 KB）");
    error.code = "demo_too_large";
    throw error;
  }
}

function replaceMeta(meta) {
  const metas = load().designs;
  const at = metas.findIndex((m) => m.id === meta.id);
  if (at >= 0) metas[at] = meta;
  else metas.unshift(meta);
}

export function createDesign(input) {
  const design = normalizeDesign(input || {}, {});
  assertShape(design);
  const data = load();
  assertNameFree(design.name, "");
  design.id = uniqueId(design.id, data.designs);
  writeDesignFile(design);
  const meta = toMeta(design);
  data.designs.unshift(meta);
  data.updatedAt = now();
  persistIndex();
  return design;
}

export function updateDesign(key, patch) {
  const current = getDesign(key);
  if (!current) {
    const error = new Error(`没找到设计「${trim(key)}」`);
    error.code = "not_found";
    throw error;
  }
  const merged = normalizeDesign({ ...current, ...(patch || {}) }, current);
  assertShape(merged);
  if (merged.name !== current.name) assertNameFree(merged.name, current.id);
  merged.id = current.id;
  merged.createdAt = current.createdAt;
  writeDesignFile(merged);
  replaceMeta(toMeta(merged));
  load().updatedAt = now();
  persistIndex();
  return merged;
}

export function deleteDesign(key) {
  const current = getDesign(key);
  if (!current) {
    const error = new Error(`没找到设计「${trim(key)}」`);
    error.code = "not_found";
    throw error;
  }
  try {
    fs.unlinkSync(designFile(current.id));
  } catch (_error) {
    /* 文件已不存在 */
  }
  const data = load();
  data.designs = data.designs.filter((d) => d.id !== current.id);
  data.updatedAt = now();
  persistIndex();
  return current;
}

/** 诊断信息：给模块页脚/日志用。 */
export function dataFile() {
  return INDEX_FILE;
}
