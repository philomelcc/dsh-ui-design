/**
 * 端点冒烟测试：验证 /wb/ui-design/* 的 list / update / create / delete。
 * 跑法：node test/http-smoke.mjs（需要 3080 在跑）
 */
const base = 'http://127.0.0.1:3080';
const post = async (path, body) => {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

const list1 = await (await fetch(base + '/wb/ui-design/list', { cache: 'no-store' })).json();
if (!list1.ok) throw new Error('list failed: ' + JSON.stringify(list1));
console.log('list:', list1.designs.length, 'designs,', list1.tags.length, 'tags');

const toast = list1.designs.find((d) => d.name === 'Toast 通知');
if (!toast) throw new Error('Toast 通知 not found');

const upd = await post('/wb/ui-design/update', { id: toast.id, summary: '（临时测试文案）' });
if (!upd.ok || upd.design.summary !== '（临时测试文案）') throw new Error('update failed: ' + JSON.stringify(upd));
console.log('update ok');

const created = await post('/wb/ui-design/create', {
  name: 'HTTP 冒烟测试设计',
  tags: ['测试'],
  summary: '临时',
  prompt: '临时提示词',
  demoHtml: '<!doctype html><html><body>tmp</body></html>',
});
if (!created.ok) throw new Error('create failed: ' + JSON.stringify(created));
console.log('create ok:', created.design.id);

const dup = await post('/wb/ui-design/create', {
  name: 'HTTP 冒烟测试设计',
  prompt: 'x',
  demoHtml: '<html></html>',
});
if (dup.ok || !/已经有一个/.test(dup.error || '')) throw new Error('duplicate name not rejected: ' + JSON.stringify(dup));
console.log('duplicate rejected ok');

const del = await post('/wb/ui-design/delete', { id: created.design.id });
if (!del.ok) throw new Error('delete failed: ' + JSON.stringify(del));
console.log('delete ok');

// 恢复 Toast 的 summary
const restore = await post('/wb/ui-design/update', {
  id: toast.id,
  summary: toast.summary,
});
if (!restore.ok) throw new Error('restore failed: ' + JSON.stringify(restore));
console.log('restore ok');
console.log('http smoke OK');
