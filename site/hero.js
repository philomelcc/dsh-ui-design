/**
 * Hero：设计台网格背景 + 描线填色入场。
 *
 * 两套驱动，各管一段（2026-11-16 用户定的分工）：
 *   - **入场**：时间驱动，一条总进度 T（0→1，3.2 秒）。标题描线→填色、段落逐块擦入、CTA 描边→填充、
 *     网格按位置错开地织起来——全部用同一个 T，所以「网格织成」和「标题描线」天然对齐。
 *   - **退场**：只有网格，滚动驱动（pS = hero 滚出视口的比例）。文字不参与滚动退场，随页面滚出视口即可。
 *
 * 参数按库里「描线填色入场」的新版 prompt（2026-11-16 重写，10.4KB）：
 *   标题描线 0→0.45（ST=0.18 逐字）、填色 0.45→0.75、段落 0.15→0.62 逐块串行、
 *   CTA 边框 0.6→0.8、填充 0.8→1.0（--fill -1%→101%）、CTA 文字 0.72→1.0。
 * 网格按「设计台网格背景」的 prompt：层 fixed 铺满视口，线长随 pS 从边缘收起。
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var board = document.getElementById('hero');
  var weave = document.getElementById('weave');
  var titleSvg = document.getElementById('hero-title');
  var cta = document.getElementById('hero-cta');
  if (!board || !weave) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GAP = 34;
  var DURATION = 3200; // 入场总时长（prompt：3.2 秒）
  var TITLE_STEP = 0.18; // 标题逐字错开 ST
  var PARA_START = 0.15; // 段落组起点
  var PARA_SPAN = 0.47; // 段落组总跨度 0.15→0.62
  var STATE = {
    hold: null, // 调试/验收：把 T 冻结在某个值
    T: 0, // 入场（时间驱动）
    pS: 0, // 滚动（只驱动网格退场）
    lines: [],
    title: null,
    blocks: [],
    cta: null,
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
      lines.push({ el: eh, axis: 'X', off: wave(y) });
    }
    for (var x = GAP; x < w; x += GAP) {
      var ev = document.createElement('i');
      ev.className = 'ln v';
      ev.style.left = x + 'px';
      ev.style.transformOrigin = x % (GAP * 2) < GAP ? 'center top' : 'center bottom';
      frag.appendChild(ev);
      lines.push({ el: ev, axis: 'Y', off: wave(x) });
    }
    weave.innerHTML = '';
    weave.appendChild(frag);
    STATE.lines = lines;
  }

  /** 主标题：描线层 path + 填色层 use[clip-path]（顺序按 prompt：use 在下、path 在上）。 */
  function buildTitle() {
    var data = window.__HERO_TITLE;
    if (!data || !titleSvg || !data.glyphs || !data.glyphs.length) return null;
    titleSvg.setAttribute('viewBox', '0 0 ' + data.width + ' ' + data.height);
    titleSvg.setAttribute('aria-label', data.text);
    titleSvg.setAttribute('data-text', data.text);
    while (titleSvg.firstChild) titleSvg.removeChild(titleSvg.firstChild);

    var defs = document.createElementNS(NS, 'defs');
    var i;
    for (i = 0; i < data.glyphs.length; i += 1) {
      var g = data.glyphs[i];
      var cp = document.createElementNS(NS, 'clipPath');
      cp.setAttribute('id', 'tc' + i);
      var rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'fr');
      rect.setAttribute('x', g.x);
      rect.setAttribute('y', g.y - 2);
      rect.setAttribute('height', Math.max(1, g.h + 4));
      rect.setAttribute('width', 0);
      cp.appendChild(rect);
      defs.appendChild(cp);
    }
    titleSvg.appendChild(defs);

    // 填色层（下层）
    var rects = [];
    for (i = 0; i < data.glyphs.length; i += 1) {
      var use = document.createElementNS(NS, 'use');
      use.setAttribute('class', 'fl');
      use.setAttribute('href', '#tg' + i);
      use.setAttribute('clip-path', 'url(#tc' + i + ')');
      titleSvg.appendChild(use);
      rects.push(defs.querySelectorAll('rect')[i]);
    }

    // 描线层（上层）
    var paths = [];
    var lens = [];
    for (i = 0; i < data.glyphs.length; i += 1) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('id', 'tg' + i);
      p.setAttribute('d', data.glyphs[i].d);
      titleSvg.appendChild(p);
      paths.push(p);
    }
    // 必须在插入文档后量周长
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

  /** 整行 mask 擦入（段落/按钮文字）：pe = p*(1+2h)-h，p≥0.999 时去掉 mask。 */
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

  function setupCta() {
    if (!cta) return null;
    var rect = cta.querySelector('.cta-stroke rect');
    var svg = cta.querySelector('.cta-stroke');
    if (!rect || !svg) return null;
    var w = cta.offsetWidth;
    var h = cta.offsetHeight;
    if (!w || !h) return null;
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
    return { rect: rect, label: cta.querySelector('.cta-label'), len: len };
  }

  /** 段落组：除标题和 CTA 之外的文字块，按 prompt 的 0.15→0.62 组内串行。 */
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
    window.__heroT = T;
    window.__heroP = STATE.pS;
    var pS = STATE.pS;
    var fade = Math.min(1, pS / 0.15, (1 - pS) / 0.15);

    // 网格：入场织起（和标题描线同一个 0→0.45）* 滚动收起（只受 pS 影响）
    var inP = seg(T, 0, 0.45);
    for (var i = 0; i < STATE.lines.length; i += 1) {
      var ln = STATE.lines[i];
      var delay = clamp(0.18 + ln.off, 0, 0.46);
      var wv = easeOutCubic(clamp((inP - delay) / (1 - delay), 0, 1));
      var lp = clamp(pS + ln.off * fade, 0, 1);
      var scale = wv * (1 - lp);
      ln.el.style.transform =
        ln.axis === 'X' ? 'scaleX(' + scale.toFixed(4) + ')' : 'scaleY(' + scale.toFixed(4) + ')';
    }

    // 主标题：描线 0→0.45、填色 0.45→0.75，逐字错开 ST
    var t = STATE.title;
    if (t) {
      var n = t.glyphs.length;
      var span = 1 + (n - 1) * TITLE_STEP;
      var tDraw = seg(T, 0, 0.45) * span;
      var tFill = seg(T, 0.45, 0.75) * span;
      for (var j = 0; j < n; j += 1) {
        var qi = clamp(tDraw - j * TITLE_STEP, 0, 1);
        t.paths[j].setAttribute('stroke-dashoffset', (t.lens[j] * (1 - qi)).toFixed(1));
        t.paths[j].style.opacity = qi <= 0.0005 ? '0' : '1';
        var qf = clamp(tFill - j * TITLE_STEP, 0, 1);
        t.rects[j].setAttribute('width', (qf * t.glyphs[j].w).toFixed(2));
      }
    }

    // 段落块：mask 擦入，组内串行
    for (var k = 0; k < STATE.blocks.length; k += 1) {
      var b = STATE.blocks[k];
      applyWipe(b.el, seg(T, b.start, b.end), b.chars);
    }

    // CTA：边框 0.6→0.8、填充 0.8→1.0（--fill -1%→101%）、文字 0.72→1.0
    var c = STATE.cta;
    if (c) {
      var borderP = seg(T, 0.6, 0.8);
      c.rect.style.strokeDashoffset = (c.len * (1 - borderP)).toFixed(2);
      c.rect.style.opacity = borderP <= 0.0005 ? '0' : '1';
      var fillP = seg(T, 0.8, 1);
      cta.style.setProperty('--fill', (-1 + fillP * 102).toFixed(2) + '%');
      if (c.label) applyWipe(c.label, seg(T, 0.72, 1), 4);
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

    if (STATE.T < 1 || Math.abs(pRaw - STATE.pS) > 0.002) {
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
    STATE.cta = setupCta();

    if (reduceMotion) {
      STATE.T = 1;
      STATE.pS = 0;
      render();
      return;
    }

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', function () {
      buildLines();
      STATE.cta = setupCta();
      render();
      kick();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        STATE.cta = setupCta();
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
