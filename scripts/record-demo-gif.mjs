#!/usr/bin/env node
/**
 * record-demo-gif —— 录展示版的交互 GIF（README 用）。
 *
 * 做法：无头 Edge + 独立临时 user-data-dir（不碰用户浏览器），CDP 抓帧，
 * 再用 ffmpeg 合成 GIF。帧时长按真实时间戳写进 concat list，播放速度和录制时一致。
 *
 * 用法：
 *   node scripts/record-demo-gif.mjs [--out docs/screenshots/demo.gif]
 *                                    [--url http://127.0.0.1:3090]
 *                                    [--ffmpeg "C:\Program Files\Shotcut\ffmpeg.exe"]
 *                                    [--width 1200] [--height 760] [--keep-frames]
 *
 * 前置：先 `node site/serve.mjs`（或 npm run site）把展示版起在本地。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const out = {
    url: 'http://127.0.0.1:3090/',
    out: 'docs/screenshots/demo.gif',
    ffmpeg: '',
    width: 1200,
    height: 760,
    port: 9411,
    frameMs: 100,
    keepFrames: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    const value = () => {
      i += 1;
      if (i >= argv.length) throw new Error(`参数 ${raw} 缺少值`);
      return argv[i];
    };
    switch (raw) {
      case '--url': out.url = value(); break;
      case '--out': out.out = value(); break;
      case '--ffmpeg': out.ffmpeg = value(); break;
      case '--width': out.width = Number(value()); break;
      case '--height': out.height = Number(value()); break;
      case '--port': out.port = Number(value()); break;
      case '--frame-ms': out.frameMs = Number(value()); break;
      case '--keep-frames': out.keepFrames = true; break;
      default: throw new Error(`未知参数 ${raw}`);
    }
  }
  return out;
}

/** 找 Edge/Chrome 和 ffmpeg；找不到就明确报错，不猜。 */
function findBrowser() {
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const local = process.env.LOCALAPPDATA || '';
  const candidates = [
    path.join(pf86, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(pf, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(local, 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(pf, 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(pf86, 'Google\\Chrome\\Application\\chrome.exe'),
  ];
  const hit = candidates.find((p) => p && fs.existsSync(p));
  if (!hit) throw new Error('找不到 Edge/Chrome 可执行文件');
  return hit;
}

function findFfmpeg(explicit) {
  if (explicit) {
    if (!fs.existsSync(explicit)) throw new Error(`--ffmpeg 指向的文件不存在：${explicit}`);
    return explicit;
  }
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const candidates = [
    path.join(pf, 'Shotcut', 'ffmpeg.exe'),
    path.join(pf, 'ffmpeg', 'bin', 'ffmpeg.exe'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    const found = execFileSync('where.exe', ['ffmpeg'], { encoding: 'utf8' }).split(/\r?\n/)[0].trim();
    if (found) return found;
  } catch { /* 不在 PATH */ }
  throw new Error('找不到 ffmpeg，用 --ffmpeg 指定路径');
}

function getJson(url, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (error) { reject(error); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function waitForTarget(port, deadline) {
  let lastError;
  while (Date.now() < deadline) {
    try {
      const targets = await getJson(`http://127.0.0.1:${port}/json`);
      const page = targets.find((t) => t.type === 'page' && /^https?:/i.test(t.url || ''));
      if (page) return page;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`等待无头浏览器就绪超时：${lastError ? lastError.message : 'no page target'}`);
}

function connect(wsUrl) {
  if (typeof WebSocket === 'undefined') throw new Error('当前 Node 没有内置 WebSocket（需要 Node 22+）');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error('WebSocket 连接超时')), 10000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(ws); }, { once: true });
    ws.addEventListener('error', (event) => {
      clearTimeout(timer);
      reject(new Error(`WebSocket 错误：${event.message || 'unknown'}`));
    }, { once: true });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const browser = findBrowser();
  const ffmpeg = findFfmpeg(args.ffmpeg);
  const outPath = path.resolve(args.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const tempProfile = path.join(os.tmpdir(), `dsh-record-gif-${process.pid}-${Date.now()}`);
  const framesDir = path.join(os.tmpdir(), `dsh-record-gif-frames-${process.pid}-${Date.now()}`);
  fs.mkdirSync(tempProfile, { recursive: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const deadline = Date.now() + 60000;
  const child = spawn(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-sync',
    '--disable-background-networking',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${tempProfile}`,
    `--remote-debugging-port=${args.port}`,
    `--window-size=${args.width},${args.height}`,
    args.url,
  ], { stdio: 'ignore', windowsHide: true });

  let ws;
  let send = null;
  const frames = [];
  try {
    const target = await waitForTarget(args.port, deadline);
    ws = await connect(target.webSocketDebuggerUrl);

    let seqId = 0;
    const pending = new Map();
    ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message);
        pending.delete(message.id);
      }
    });
    send = (method, params = {}) => new Promise((resolve) => {
      const id = (seqId += 1);
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      const result = response.result || {};
      if (result.exceptionDetails) {
        const details = result.exceptionDetails;
        const description = (details.exception && details.exception.description) || details.text || 'unknown';
        throw new Error(`页面脚本抛错：${String(description).split('\n')[0]}`);
      }
      return result.result ? result.result.value : undefined;
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setDeviceMetricsOverride', {
      width: args.width,
      height: args.height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 等页面 load
    let ready = false;
    while (Date.now() < deadline) {
      try {
        if ((await evaluate('document.readyState')) === 'complete') { ready = true; break; }
      } catch { /* 导航中 */ }
      await sleep(250);
    }
    if (!ready) throw new Error('等待页面 load 超时');
    await sleep(2200); // 等卡片预览 iframe 加载

    // 统一用浅色主题：主题选择器存 localStorage，先点下拉再点「浅色」
    await evaluate('document.getElementById("theme-trigger") && document.getElementById("theme-trigger").click()');
    await sleep(400);
    await evaluate(`(() => {
      const opts = [...document.querySelectorAll(".theme-opt")];
      const t = opts.find((x) => (x.textContent || "").includes("浅色"));
      if (!t) throw new Error("找不到浅色主题");
      t.click();
      return true;
    })()`);
    await sleep(1800); // 等卡片 iframe 重建

    // 注入一个录制光标：headless 截图不含系统光标，不画一个观众就看不到是谁在点
    await evaluate(`(() => {
      if (document.getElementById("__recCursor")) return true;
      const c = document.createElement("div");
      c.id = "__recCursor";
      c.style.cssText = [
        "position:fixed", "left:-40px", "top:-40px", "width:14px", "height:14px",
        "border-radius:50%", "background:rgba(17,17,17,.55)", "border:2px solid #fff",
        "box-shadow:0 2px 10px rgba(0,0,0,.35)", "pointer-events:none",
        "z-index:2147483647", "transform:translate(-50%,-50%)",
        "transition:opacity .12s", "opacity:0",
      ].join(";");
      document.body.appendChild(c);
      window.__recCursorMove = (x, y) => {
        c.style.left = x + "px";
        c.style.top = y + "px";
        c.style.opacity = "1";
      };
      return true;
    })()`);

    const mouseMove = async (x, y) => {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await evaluate(`window.__recCursorMove && window.__recCursorMove(${Number(x) || 0}, ${Number(y) || 0})`);
    };
    const clickAt = async (x, y) => {
      await mouseMove(x, y);
      await sleep(60);
      await evaluate('(() => { const c = document.getElementById("__recCursor"); if (c) c.style.transform = "translate(-50%,-50%) scale(.78)"; })()');
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await sleep(70);
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      await evaluate('(() => { const c = document.getElementById("__recCursor"); if (c) c.style.transform = "translate(-50%,-50%)"; })()');
    };
    const rectOf = async (selector) => {
      const rect = await evaluate(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
      })()`);
      if (!rect) throw new Error(`找不到元素：${selector}`);
      return rect;
    };
    const insertText = async (text) => {
      await send('Input.insertText', { text });
    };
    const pressEscape = async () => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    };

    // 录制时间轴（毫秒，相对录制开始）
    const timeline = [
      {
        t: 500,
        name: '移到搜索框',
        run: async () => {
          const r = await rectOf('#search');
          await mouseMove(r.x - 60, r.y);
        },
      },
      {
        t: 1100,
        name: '点搜索框',
        run: async () => {
          const r = await rectOf('#search');
          await clickAt(r.x - 60, r.y);
        },
      },
      { t: 1500, name: '输入「代」', run: async () => { await insertText('代'); } },
      { t: 1700, name: '输入「码」', run: async () => { await insertText('码'); } },
      {
        t: 3000,
        name: '打开第一张卡',
        run: async () => {
          const r = await rectOf('.card');
          await clickAt(r.x, r.y);
        },
      },
      {
        t: 4400,
        name: '鼠标移到 demo 上',
        run: async () => {
          const r = await rectOf('#m-demo');
          await mouseMove(r.x, r.y - r.h * 0.15);
        },
      },
      { t: 6100, name: 'Esc 关闭弹窗', run: async () => { await pressEscape(); } },
    ];
    const totalMs = 7200;

    const startedAt = Date.now();
    let frameIndex = 0;
    while (Date.now() - startedAt < totalMs) {
      const elapsed = Date.now() - startedAt;
      for (const step of timeline) {
        if (!step.done && elapsed >= step.t) {
          step.done = true;
          await step.run();
        }
      }
      const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const data = shot.result && shot.result.data;
      if (data) {
        const file = path.join(framesDir, `${String(frameIndex).padStart(4, '0')}.png`);
        fs.writeFileSync(file, Buffer.from(data, 'base64'));
        frames.push({ file, time: Date.now() - startedAt });
        frameIndex += 1;
      }
      const spent = Date.now() - startedAt - elapsed;
      await sleep(Math.max(0, args.frameMs - spent));
    }

    console.log(`抓了 ${frames.length} 帧，时长约 ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
    if (frames.length < 2) throw new Error('抓到 0–1 帧，录制失败');

    // concat list：每帧 duration = 到下一帧的真实间隔
    const listFile = path.join(framesDir, 'list.txt');
    const lines = [];
    for (let i = 0; i < frames.length; i += 1) {
      const next = i + 1 < frames.length ? frames[i + 1].time : frames[i].time + args.frameMs;
      const duration = Math.max(0.03, (next - frames[i].time) / 1000);
      lines.push(`file '${frames[i].file.replace(/\\/g, '/')}'`);
      lines.push(`duration ${duration.toFixed(3)}`);
    }
    // concat demuxer 要求最后再重复一帧，否则末帧会被吞
    lines.push(`file '${frames[frames.length - 1].file.replace(/\\/g, '/')}'`);
    fs.writeFileSync(listFile, lines.join('\n'), 'utf8');

    const paletteFile = path.join(framesDir, 'palette.png');
    execFileSync(ffmpeg, [
      '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-vf', 'scale=1000:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff',
      paletteFile,
    ], { stdio: 'ignore' });
    execFileSync(ffmpeg, [
      '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
      '-i', paletteFile,
      '-lavfi', 'scale=1000:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle',
      '-loop', '0',
      outPath,
    ], { stdio: 'ignore' });

    const size = fs.statSync(outPath).size;
    console.log(`GIF 已生成：${outPath}（${(size / 1024 / 1024).toFixed(2)} MB）`);
    if (!args.keepFrames) fs.rmSync(framesDir, { recursive: true, force: true });
    else console.log(`帧目录保留在：${framesDir}`);
  } finally {
    try { await send?.('Browser.close'); } catch { /* ignore */ }
    await sleep(300);
    try { child.kill('SIGKILL'); } catch { /* ignore */ }
    try { execFileSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' }); } catch { /* ignore */ }
    fs.rmSync(tempProfile, { recursive: true, force: true });
    try { ws && ws.close(); } catch { /* ignore */ }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
