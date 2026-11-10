/**
 * 展示版本地服务（零依赖）：
 *   node site/serve.mjs  → http://127.0.0.1:3090
 *
 * 启动时同步一次数据，之后监听 DSH 存储目录，新增/修改设计自动同步到 site/data/。
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { syncSiteData } from "../scripts/build-site-data.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3090);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

// ---------- 数据同步 ----------
function syncNow(reason) {
  try {
    const result = syncSiteData();
    console.log("[sync] " + reason + " → " + result.copied + " 项 / 索引 " + result.total + " 条");
  } catch (error) {
    console.warn("[sync] 失败：" + (error && error.message));
  }
}

syncNow("启动");

const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const watchTargets = [
  path.join(home, "storages", "ui-design"),
  path.join(home, "storages", "ui-design", "designs"),
];

let syncTimer = null;
function scheduleSync(reason) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncNow(reason), 800);
}

for (const target of watchTargets) {
  try {
    if (!fs.existsSync(target)) continue;
    fs.watch(target, { recursive: false }, () => scheduleSync("检测到数据变化"));
  } catch (error) {
    console.warn("[watch] 无法监听 " + target + "：" + (error && error.message));
  }
}

// ---------- 静态服务 ----------
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
  const file = path.join(root, pathname === "/" ? "index.html" : pathname);
  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log("UI 设计展示版: http://127.0.0.1:" + port);
});
