/**
 * 把 DSH 里的设计库数据复制到展示版站点目录（site/data/）。
 * 用法：node scripts/build-site-data.mjs
 *
 * 生成版是纯静态的：index.json（元数据）+ designs/<id>.json（每项完整内容）。
 * 站点不需要 DSH 就能跑。
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.join(here, "..", "site", "data");
const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const storages = path.join(home, "storages", "ui-design");
const packageData = path.join(here, "..", "data");
/** 有 dsh 运行时用运行时数据，否则用仓库里的 data/（CI / 无 dsh 环境）。 */
const src = fs.existsSync(path.join(storages, "index.json")) ? storages : packageData;

/** 同步一次；返回 { copied, total }。抛错表示源头不可用。 */
export function syncSiteData() {
  const sourceIndex = path.join(src, "index.json");
  if (!fs.existsSync(sourceIndex)) {
    throw new Error("没找到 " + sourceIndex + "，先在 DSH 里打开一次 UI 设计页");
  }

  fs.rmSync(siteDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(siteDir, "designs"), { recursive: true });
  fs.copyFileSync(sourceIndex, path.join(siteDir, "index.json"));

  const designDir = path.join(src, "designs");
  let copied = 0;
  for (const file of fs.readdirSync(designDir)) {
    if (!file.endsWith(".json")) continue;
    fs.copyFileSync(path.join(designDir, file), path.join(siteDir, "designs", file));
    copied++;
  }

  const index = JSON.parse(fs.readFileSync(path.join(siteDir, "index.json"), "utf8"));
  return { copied, total: index.designs.length };
}

// 直接跑时打印结果
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = syncSiteData();
  console.log("已生成展示版数据：", result.copied, "项设计 ->", siteDir, "（索引", result.total, "条）");
}
