/**
 * 把运行中的设计库（~/.dsh/storages/ui-design）导出回仓库的 data/，用于提交。
 * 用法：node scripts/export-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(process.env.DSH_HOME || path.join(os.homedir(), ".dsh"), "storages", "ui-design");
const dst = path.join(here, "..", "data");

if (!fs.existsSync(path.join(src, "index.json"))) {
  throw new Error("没找到 " + path.join(src, "index.json") + "，先在 dsh 里打开一次 UI 设计页");
}

fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(path.join(dst, "designs"), { recursive: true });
fs.copyFileSync(path.join(src, "index.json"), path.join(dst, "index.json"));

let copied = 0;
for (const file of fs.readdirSync(path.join(src, "designs"))) {
  if (!file.endsWith(".json")) continue;
  fs.copyFileSync(path.join(src, "designs", file), path.join(dst, "designs", file));
  copied++;
}

const index = JSON.parse(fs.readFileSync(path.join(dst, "index.json"), "utf8"));
console.log("已导出：", copied, "项设计 ->", dst, "（索引", index.designs.length, "条）");
