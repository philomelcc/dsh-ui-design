/**
 * 把 lib/seeds.js 里内置设计的 demoHtml / prompt / tags / summary / name 同步到
 * 现有数据文件（走 HTTP update 端点，顺便让 3080 进程的 store 缓存刷新）。
 *
 * 只更新「能按 id 或名字匹配到种子」的设计；用户自己新建的设计会跳过。
 * 跑法：node scripts/sync-seeds.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SEED_DESIGNS } from '../lib/seeds.js';

const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
const file = path.join(home, 'storages', 'ui-design', 'designs.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

function findSeed(design) {
  return (
    SEED_DESIGNS.find((seed) => seed.id === design.id) ||
    SEED_DESIGNS.find((seed) => seed.name === design.name) ||
    null
  );
}

let updated = 0;
let skipped = 0;
for (const design of data.designs) {
  const seed = findSeed(design);
  if (!seed) {
    console.log('skip (user-made):', design.name);
    skipped++;
    continue;
  }
  const response = await fetch('http://127.0.0.1:3080/wb/ui-design/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: design.id,
      name: seed.name,
      tags: seed.tags,
      summary: seed.summary,
      usage: seed.usage,
      caution: seed.caution,
      hint: seed.hint,
      prompt: seed.prompt,
      demoHtml: seed.demoHtml,
    }),
  });
  const json = await response.json();
  if (!json.ok) throw new Error(design.name + ': ' + json.error);
  console.log('updated:', design.name, '->', seed.name);
  updated++;
}
console.log(`done: ${updated} updated, ${skipped} skipped`);
