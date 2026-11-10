/**
 * 可选的向量增强（零依赖骨架）。
 *
 * 设计原则：**没配置就完全跳过。** 默认检索（关键词 + 同义词 + 滑窗）不需要任何外部服务；
 * 如果用户自己在 `~/.dsh/storages/ui-design/config.json` 里配了 OpenAI 兼容的 embedding 端点，
 * 就先用它给候选做语义重排。以后接本地 WASM embedding 时，复用这里的 `embedTexts` / 缓存格式即可。
 *
 * config.json 示例：
 * {
 *   "embedding": {
 *     "enabled": true,
 *     "endpoint": "http://127.0.0.1:1234/v1",
 *     "model": "text-embedding-nomic-embed-text-v1.5"
 *   }
 * }
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const DATA_DIR = path.join(DSH_HOME, "storages", "ui-design");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const VECTORS_FILE = path.join(DATA_DIR, "vectors.json");

/** 读配置；没配置或未启用返回 null。 */
export function loadEmbeddingConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const emb = raw && raw.embedding;
    if (!emb || !emb.enabled || !emb.endpoint) return null;
    return {
      endpoint: String(emb.endpoint).replace(/\/+$/, ""),
      model: emb.model ? String(emb.model) : undefined,
      timeoutMs: Number(emb.timeoutMs) > 0 ? Number(emb.timeoutMs) : 12000,
    };
  } catch (_error) {
    return null;
  }
}

function hashText(text) {
  return crypto.createHash("sha1").update(String(text)).digest("hex").slice(0, 16);
}

/** 一段设计文本：名字 + 别名 + tag + 说明 + 场景。 */
export function designText(meta) {
  return [
    meta.name,
    (meta.aliases || []).join(" "),
    (meta.tags || []).join(" "),
    meta.summary,
    meta.usage,
    meta.caution,
  ]
    .filter(Boolean)
    .join("\n");
}

/** 调 OpenAI 兼容的 /embeddings，返回向量数组；失败抛错，由调用方吞掉。 */
export async function embedTexts(config, texts) {
  const res = await fetch(config.endpoint + "/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.model, input: texts }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!res.ok) throw new Error("embedding HTTP " + res.status);
  const json = await res.json();
  const data = Array.isArray(json && json.data) ? json.data : [];
  return data.map((item) => item.embedding).filter(Array.isArray);
}

/** 读向量缓存：id -> { hash, vec }。 */
export function loadVectors() {
  try {
    const parsed = JSON.parse(fs.readFileSync(VECTORS_FILE, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function saveVectors(vectors) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = VECTORS_FILE + ".tmp-" + process.pid;
    fs.writeFileSync(tmp, JSON.stringify(vectors), "utf8");
    fs.renameSync(tmp, VECTORS_FILE);
  } catch (_error) {
    /* 缓存写不了不影响检索 */
  }
}

function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * 用向量给「关键词候选」做语义重排（不做全库召回，控制成本）。
 * 返回重排后的 metas；任何一步失败都返回原顺序。
 */
export async function rerankByVectors(config, metas, query) {
  if (!config || !query || metas.length < 2) return metas;
  const cache = loadVectors();
  const qVecs = await embedTexts(config, [String(query)]);
  const qVec = qVecs[0];
  if (!qVec) return metas;

  const scored = [];
  for (const meta of metas) {
    const text = designText(meta);
    const hash = hashText(text);
    let entry = cache[meta.id];
    if (!entry || entry.hash !== hash || !Array.isArray(entry.vec)) {
      try {
        const [vec] = await embedTexts(config, [text]);
        if (!vec) continue;
        entry = { hash, vec };
        cache[meta.id] = entry;
      } catch (_error) {
        continue;
      }
    }
    scored.push({ meta, sim: cosine(qVec, entry.vec) });
  }
  saveVectors(cache);
  if (!scored.length) return metas;

  // RRF 融合：关键词顺序 + 向量相似度顺序
  const keyRank = new Map(metas.map((m, i) => [m.id, i]));
  const vecRank = new Map(
    scored.slice().sort((a, b) => b.sim - a.sim).map((s, i) => [s.meta.id, i]),
  );
  const fused = metas
    .map((meta) => {
      const kr = keyRank.get(meta.id);
      const vr = vecRank.has(meta.id) ? vecRank.get(meta.id) : metas.length;
      return { meta, score: 1 / (50 + kr) + 1 / (50 + vr) };
    })
    .sort((a, b) => b.score - a.score);
  return fused.map((f) => f.meta);
}
