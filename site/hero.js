/**
 * Hero：设计台网格背景 + 描线填色入场（按 2026-11-16 第三版 prompt 实现）。
 *
 * 两套驱动：
 *   - **入场**：时间驱动，一条总进度 T（0→1，3.2 秒）——标题描线/填色、段落逐行擦入、按钮描边/填充/文字、
 *     网格按位置错开织起（0→0.45，与标题描线同区间对齐）。
 *   - **退场**：只有网格，滚动驱动（pS = hero 滚出视口的比例）。
 *
 * 第三版 prompt 的关键参数（和上一版的差异）：
 *   - 填色 **0.25→0.74**，和描线**重叠**（第一字描完 0.216 后就开始涂，像边勾勒边涂）；
 *   - 按钮**早起步**：主 0.40 起、次 +0.07、第三个 +0.14（描边 0.40→0.60 / 填充 0.60→0.80 / 文字 0.54→0.80）；
 *   - 按钮**形态决定填充**：透明底（ghost）跳过填充，实心/半透明底必须填充；`--fill` 用 -1%→101%；
 *   - 实心按钮填充后要藏掉描线层，否则留一圈 32% 品牌线残影。
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var board = document.getElementById('hero');
  var weave = document.getElementById('weave');
  var titleSvg = document.getElementById('hero-title');
  if (!board || !weave) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GAP = 34;
  var DURATION = 2200; // 总时长（prompt 标准是 3.2s，展示站用 2.2s 更利落）
  var TITLE_STEP = 0.18;
  var TITLE_DRAW = [0, 0.45]; // 描线
  var TITLE_FILL = [0.25, 0.74]; // 填色（和描线重叠）
  var PARA_START = 0.15;
  var PARA_SPAN = 0.47;
  var BTN_STEP = 0.07;
  var STATE = {
    hold: null, // 验收：把 T 冻结在某个值
    T: 0,
    pS: 0,
    lines: [],
    title: null,
    blocks: [],
    buttons: [],
    raf: 0,
    lastTime: 0,
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function seg(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }
  function easeOutCubic(t) {
    var u = 1 - t;
    return 1 - u * u * u;
  }
  function wave(pos) {
    return (Math.sin(pos * 0.017 + 1.3) * 0.5 + Math.sin(pos * 0.043 + 4.1) * 0.5) * 0.16 + (Math.random() - 0.5) * 0.04;
  }

  /** 网格层 fixed 铺满视口；滚动时网格不动，只有线长变。 */
  function buildLines() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (!w || !h) return;
    var frag = document.createDocumentFragment();
    var lines = [];
    for (var y = GAP; y < h; y += GAP) {
      var eh = document.createElement('i');
      eh.className = 'ln h';
      eh.style.top = y + 'px';
      eh.style.transformOrigin = y % (GAP * 2) < GAP ? 'left center' : 'right center';
      frag.appendChild(eh);
      var offH = wave(y);
      lines.push({ el: eh, axis: 'X', off: offH, offN: (offH + 0.18) / 0.36 });
    }
    for (var x = GAP; x < w; x += GAP) {
      var ev = document.createElement('i');
      ev.className = 'ln v';
      ev.style.left = x + 'px';
      ev.style.transformOrigin = x % (GAP * 2) < GAP ? 'center top' : 'center bottom';
      frag.appendChild(ev);
      var offV = wave(x);
      lines.push({ el: ev, axis: 'Y', off: offV, offN: (offV + 0.18) / 0.36 });
    }
    weave.innerHTML = '';
    weave.appendChild(frag);
    STATE.lines = lines;
  }

  /** 主标题：填色层 use[clip-path] 在下、描线层 path 在上。 */
  function buildTitle() {
    var data = window.__HERO_TITLE;
    if (!data || !titleSvg || !data.glyphs || !data.glyphs.length) return null;
    titleSvg.setAttribute('viewBox', '0 0 ' + data.width + ' ' + data.height);
    titleSvg.setAttribute('aria-label', data.text);
    titleSvg.setAttribute('data-text', data.text);
    while (titleSvg.firstChild) titleSvg.removeChild(titleSvg.firstChild);

    var defs = document.createElementNS(NS, 'defs');
    var i;
    var rects = [];
    for (i = 0; i < data.glyphs.length; i += 1) {
      var g = data.glyphs[i];
      var cp = document.createElementNS(NS, 'clipPath');
      cp.setAttribute('id', 'tc' + i);
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('class', 'fr');
      r.setAttribute('x', g.x - 2);
      r.setAttribute('y', g.y - 2);
      r.setAttribute('height', Math.max(1, g.h + 4));
      r.setAttribute('width', 0);
      cp.appendChild(r);
      defs.appendChild(cp);
      rects.push(r);
    }
    titleSvg.appendChild(defs);

    for (i = 0; i < data.glyphs.length; i += 1) {
      var use = document.createElementNS(NS, 'use');
      use.setAttribute('class', 'fl');
      use.setAttribute('href', '#tg' + i);
      use.setAttribute('clip-path', 'url(#tc' + i + ')');
      titleSvg.appendChild(use);
    }

    var paths = [];
    var lens = [];
    for (i = 0; i < data.glyphs.length; i += 1) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('id', 'tg' + i);
      p.setAttribute('d', data.glyphs[i].d);
      titleSvg.appendChild(p);
      paths.push(p);
    }
    for (i = 0; i < paths.length; i += 1) {
      var L = 0;
      try {
        L = paths[i].getTotalLength();
      } catch (err) {
        L = 300;
      }
      lens.push(L);
      paths[i].setAttribute('stroke-dasharray', String(L));
      paths[i].setAttribute('stroke-dashoffset', String(L));
    }
    return { paths: paths, rects: rects, lens: lens, glyphs: data.glyphs };
  }

  function applyWipe(el, p, chars) {
    if (p >= 0.999) {
      if (el.__wiped !== true) {
        el.style.webkitMaskImage = 'none';
        el.style.maskImage = 'none';
        el.__wiped = true;
      }
      return;
    }
    el.__wiped = false;
    var h = clamp(0.75 / Math.max(1, chars || 8), 0.04, 0.3);
    var pe = p * (1 + 2 * h) - h;
    var lo = Math.max(0, (pe - h) * 100);
    var hi = Math.min(100, (pe + h) * 100);
    var grad = 'linear-gradient(98deg, #000 0 ' + lo.toFixed(2) + '%, transparent ' + hi.toFixed(2) + '%)';
    el.style.webkitMaskImage = grad;
    el.style.maskImage = grad;
  }

  /** 按钮组：每个 .btn-wrap 一个 SVG 描边层；形态（data-fill）决定要不要填充。 */
  function setupButtons() {
    var wraps = board.querySelectorAll('.btn-wrap[data-btn]');
    var list = [];
    for (var i = 0; i < wraps.length; i += 1) {
      var wrap = wraps[i];
      var btn = wrap.querySelector('.btn-main, .btn-sub, .btn-ghost');
      var rect = wrap.querySelector('.btn-stroke rect');
      var svg = wrap.querySelector('.btn-stroke');
      var label = wrap.querySelector('.btn-label');
      if (!btn || !rect || !svg) continue;
      var w = btn.offsetWidth;
      var h = btn.offsetHeight;
      if (!w || !h) continue;
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      rect.setAttribute('x', 0.5);
      rect.setAttribute('y', 0.5);
      rect.setAttribute('width', Math.max(1, w - 1));
      rect.setAttribute('height', Math.max(1, h - 1));
      var len = 0;
      try {
        len = rect.getTotalLength();
      } catch (err) {
        len = (w + h) * 2;
      }
      rect.style.strokeDasharray = len;
      list.push({
        btn: btn,
        rect: rect,
        label: label,
        len: len,
        delay: i * BTN_STEP,
        fill: wrap.getAttribute('data-fill') === 'true',
        hideStroke: wrap.getAttribute('data-hide-stroke') === 'true',
      });
    }
    STATE.buttons = list;
  }

  /** 段落组：除标题和按钮外的文字块，0.15→0.62 组内串行。 */
  function collectBlocks() {
    var nodes = board.querySelectorAll('[data-wipe]');
    var list = [];
    var per = PARA_SPAN / Math.max(1, nodes.length);
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      var start = PARA_START + i * per;
      list.push({
        el: el,
        start: start,
        end: start + per * 0.85,
        chars: (el.textContent || '').length,
      });
    }
    STATE.blocks = list;
  }

  function render() {
    var T = STATE.T;
    var pS = STATE.pS;
    window.__heroT = T;
    window.__heroP = pS;
    var fade = Math.min(1, pS / 0.15, (1 - pS) / 0.15);

    // 网格入场：全程 T 0→1（慢、连续、不停住），用 span 拉伸做波纹错开——
    // 这样 T=0 时全部是 0、T=1 时全部精确到 1（之前把 off 直接加到进度上，
    // 前段会卡在 0.16 不动、末端负 off 的线永远到不了 1）。
    var GRID_ST = 0.25; // 相邻线之间的错开量
    for (var i = 0; i < STATE.lines.length; i += 1) {
      var ln = STATE.lines[i];
      var wv = clamp(T * (1 + GRID_ST) - ln.offN * GRID_ST, 0, 1);
      var lp = clamp(pS + ln.off * fade, 0, 1);
      var scale = wv * (1 - lp);
      ln.el.style.transform =
        ln.axis === 'X' ? 'scaleX(' + scale.toFixed(4) + ')' : 'scaleY(' + scale.toFixed(4) + ')';
    }

    // 主标题：描线 0→0.45、填色 0.25→0.74（重叠）
    var t = STATE.title;
    if (t) {
      var n = t.glyphs.length;
      var span = 1 + (n - 1) * TITLE_STEP;
      var tDraw = seg(T, TITLE_DRAW[0], TITLE_DRAW[1]) * span;
      var tFill = seg(T, TITLE_FILL[0], TITLE_FILL[1]) * span;
      for (var j = 0; j < n; j += 1) {
        var qi = clamp(tDraw - j * TITLE_STEP, 0, 1);
        t.paths[j].setAttribute('stroke-dashoffset', (t.lens[j] * (1 - qi)).toFixed(1));
        t.paths[j].style.opacity = qi <= 0.0005 ? '0' : '1';
        var qf = clamp(tFill - j * TITLE_STEP, 0, 1);
        // 兜底：填色不能早于同字的描线完成
        qf = Math.min(qf, qi);
        t.rects[j].setAttribute('width', (qf * (t.glyphs[j].w + 4)).toFixed(2));
      }
    }

    // 段落块
    for (var k = 0; k < STATE.blocks.length; k += 1) {
      var b = STATE.blocks[k];
      applyWipe(b.el, seg(T, b.start, b.end), b.chars);
    }

    // 按钮：描边 0.40→0.60、填充 0.60→0.80、文字 0.54→0.80（各自 +delay）
    for (var bi = 0; bi < STATE.buttons.length; bi += 1) {
      var bu = STATE.buttons[bi];
      var d = bu.delay;
      var borderP = seg(T, 0.4 + d, 0.6 + d);
      var fillP = bu.fill ? seg(T, 0.6 + d, 0.8 + d) : 1;
      var labelP = seg(T, 0.54 + d, 0.8 + d);
      bu.rect.style.strokeDashoffset = (bu.len * (1 - borderP)).toFixed(2);
      // 实心按钮填充开始后藏描线，否则留一圈品牌色残影
      bu.rect.style.opacity = bu.hideStroke && fillP > 0.001 ? '0' : borderP <= 0.0005 ? '0' : '1';
      if (bu.fill) bu.btn.style.setProperty('--fill', (-1 + fillP * 102).toFixed(2) + '%');
      if (bu.label) applyWipe(bu.label, labelP, (bu.label.textContent || '').length);
    }
  }

  function readScroll() {
    var rect = board.getBoundingClientRect();
    var bottomAbs = rect.bottom + window.scrollY;
    return bottomAbs > 0 ? clamp(window.scrollY / bottomAbs, 0, 1) : 0;
  }

  function tick(now) {
    var dt = STATE.lastTime ? Math.min(64, now - STATE.lastTime) : 16;
    STATE.lastTime = now;

    if (STATE.hold !== null) {
      STATE.T = STATE.hold;
    } else if (STATE.T < 1) {
      STATE.T = clamp(STATE.T + dt / DURATION, 0, 1);
    }

    var pRaw = reduceMotion ? 0 : readScroll();
    var diff = pRaw - STATE.pS;
    if (Math.abs(diff) < 0.01) STATE.pS = pRaw;
    else STATE.pS += diff * 0.08;
    if (STATE.pS > 0.99) STATE.pS = 1;
    if (STATE.pS < 0.01) STATE.pS = 0;

    render();

    if (STATE.T < 1 || STATE.hold !== null || Math.abs(pRaw - STATE.pS) > 0.002) {
      STATE.raf = requestAnimationFrame(tick);
    } else {
      STATE.raf = 0;
      STATE.lastTime = 0;
    }
  }

  function kick() {
    if (STATE.raf) return;
    STATE.lastTime = 0;
    STATE.raf = requestAnimationFrame(tick);
  }

  function boot() {
    buildLines();
    STATE.title = buildTitle();
    collectBlocks();
    setupButtons();

    if (reduceMotion) {
      STATE.T = 1;
      STATE.pS = 0;
      render();
      return;
    }

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', function () {
      buildLines();
      setupButtons();
      render();
      kick();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        setupButtons();
        kick();
      });
    }

    kick();
  }

  /** 验收/调试入口：冻结入场进度到某个 T（传 null 恢复自动播放）。 */
  window.__holdHeroT = function (v) {
    STATE.hold = v === null || v === undefined ? null : clamp(Number(v), 0, 1);
    if (STATE.hold !== null) {
      STATE.T = STATE.hold;
      render();
    }
    kick();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
