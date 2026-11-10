/**
 * 一次性：把 demo 里的 hint 元素提取到设计的 hint 字段，并从 demoHtml 删掉。
 * （演示区域与提示文字不再同块——页面统一渲染在 demo 外面。）
 * 跑完即删。
 */
import fs from "node:fs";

const file = "C:/Users/Philomel/.dsh/storages/ui-design/designs.json";
fs.copyFileSync(file, file + ".bak-before-hint-extract-" + Date.now());
const data = JSON.parse(fs.readFileSync(file, "utf8"));

const HINT_RE = /<div class="hint"[^>]*>([\s\S]*?)<\/div>/;
const CSS_RE = /\.hint\{[^}]*\}/g;

let changed = 0;
for (const design of data.designs) {
  const match = design.demoHtml.match(HINT_RE);
  if (!match) continue;
  const hintText = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  let html = design.demoHtml.replace(match[0], "");
  html = html.replace(CSS_RE, "");
  html = html.replace(/@media \(max-height:420px\)\{\s*\}/g, "");
  const res = await fetch("http://127.0.0.1:3080/wb/ui-design/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: design.id, hint: hintText, demoHtml: html }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(design.name + ": " + json.error);
  console.log(design.name, "->", hintText.slice(0, 50));
  changed++;
}
console.log("done", changed);
