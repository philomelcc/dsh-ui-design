/**
 * store 冒烟测试：用临时 DSH_HOME，不碰真实知识库。
 * 跑法：node test/smoke.mjs
 */
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import assert from "node:assert/strict";

const tmp = path.join(os.tmpdir(), "uid-smoke-" + Date.now());
process.env.DSH_HOME = tmp;

const store = await import("../lib/store.js");

// 1) 首次加载 = 种子
const seeded = store.listDesigns();
assert.equal(seeded.length, 8, "种子应为 8 项，实际 " + seeded.length);
assert.ok(seeded.every((d) => d.name && d.prompt && d.demoHtml), "每项都有名字/提示词/demo");
const tags = store.listTags();
assert.ok(tags.length >= 5, "tag 应有 5 个以上，实际 " + tags.length);

// 2) 创建
const created = store.createDesign({
  name: "测试设计",
  tags: ["测试", " 展开 ", "测试"],
  summary: "一句话",
  prompt: "提示词",
  demoHtml: "<!doctype html><html><body>hi</body></html>",
});
assert.equal(created.tags.length, 2, "tag 去重后应为 2 个");
assert.ok(store.listDesigns()[0].id === created.id, "新建设计排在最前");

// 3) 重名拒绝
assert.throws(() => store.createDesign({ name: "测试设计", prompt: "p", demoHtml: "<html>" }), /已经有一个/);

// 4) 按名字找 + 更新
const found = store.getDesign("测试设计");
assert.ok(found, "按名字能查到");
const updated = store.updateDesign("测试设计", { name: "测试设计2", tags: ["拖拽"] });
assert.equal(updated.name, "测试设计2");
assert.deepEqual(updated.tags, ["拖拽"]);

// 5) 删除
store.deleteDesign("测试设计2");
assert.equal(store.getDesign("测试设计2"), null);

// 6) 落盘可重读
const raw = JSON.parse(fs.readFileSync(path.join(tmp, "storages", "ui-design", "designs.json"), "utf8"));
assert.equal(raw.designs.length, 8);

fs.rmSync(tmp, { recursive: true, force: true });
console.log("store smoke OK");
