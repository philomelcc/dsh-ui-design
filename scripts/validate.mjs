/**
 * 校验仓库 data/ 里的设计库。
 * 用法：node scripts/validate.mjs
 * 有错时退出码 1，CI 直接拿这个判断。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, "..", "data");
const indexFile = path.join(dataDir, "index.json");

const errors = [];
const warnings = [];

if (!fs.existsSync(indexFile)) {
  console.error("缺少 data/index.json");
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
if (!Array.isArray(index.designs)) {
  console.error("index.json 缺少 designs 数组");
  process.exit(1);
}

const names = new Map();
const MAX_SCENARIO = 120;
const MAX_HINT = 80;

for (const meta of index.designs) {
  const label = meta.name || meta.id;
  if (!meta.id) errors.push(`[${label}] 缺少 id`);
  if (!meta.name) errors.push(`[${label}] 缺少 name`);
  if (names.has(meta.name)) errors.push(`[${label}] 名字重复：${meta.name}`);
  names.set(meta.name, meta.id);

  if (!Array.isArray(meta.tags) || meta.tags.length === 0) warnings.push(`[${label}] 没有 tag`);
  if (meta.tags && meta.tags.length > 8) errors.push(`[${label}] tag 超过 8 个`);
  if (meta.usage && meta.usage.length > MAX_SCENARIO) errors.push(`[${label}] usage 超过 ${MAX_SCENARIO} 字`);
  if (meta.caution && meta.caution.length > MAX_SCENARIO) errors.push(`[${label}] caution 超过 ${MAX_SCENARIO} 字`);
  if (meta.hint && meta.hint.length > MAX_HINT) errors.push(`[${label}] hint 超过 ${MAX_HINT} 字`);
  if (meta.inspiration && meta.inspiration.length > 200) errors.push(`[${label}] inspiration 超过 200 字`);

  const file = path.join(dataDir, "designs", String(meta.id) + ".json");
  if (!fs.existsSync(file)) {
    errors.push(`[${label}] 缺少 designs/${meta.id}.json`);
    continue;
  }
  let design;
  try {
    design = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_error) {
    errors.push(`[${label}] designs/${meta.id}.json 不是合法 JSON`);
    continue;
  }
  if (!design.prompt || String(design.prompt).trim().length < 20) errors.push(`[${label}] prompt 缺失或过短`);
  const html = String(design.demoHtml || "");
  if (!html.includes("<!doctype") && !html.includes("<!DOCTYPE")) errors.push(`[${label}] demoHtml 不是完整 HTML 文档`);
  if (html.length > 400 * 1024) errors.push(`[${label}] demoHtml 超过 400KB`);
  if (html.includes("scrollIntoView(")) warnings.push(`[${label}] demo 里有 scrollIntoView（会把外层页面滚走）`);
  if (html.includes(".focus(") && !html.includes("preventScroll")) {
    warnings.push(`[${label}] demo 里有裸 focus（可能抢外层焦点）`);
  }
}

console.log(`检查 ${index.designs.length} 项设计`);
if (warnings.length) {
  console.log(`\n警告 ${warnings.length} 条：`);
  warnings.forEach((w) => console.log("  ! " + w));
}
if (errors.length) {
  console.log(`\n错误 ${errors.length} 条：`);
  errors.forEach((e) => console.log("  x " + e));
  process.exit(1);
}
console.log("\n通过：没有错误");
