/**
 * Hero：设计台网格背景 + 描线填色入场，全部由滚动位置驱动。
 *
 * 依据是库里两项设计的 **demo**（不是只看 prompt，prompt 与 demo 有出入，已反馈）：
 *   - 「描线填色入场」demo：主标题是字形 <path>，0→0.45 逐字 stroke-dashoffset 描线，
 *     0.45→0.75 逐字用 clipPath rect 宽度做「马克笔填色」；小字才用 mask 擦入；按钮边框描线+填充。
 *   - 「设计台网格背景」demo：网格层是 position:fixed（铺满视口、滚动时不动），
 *     线长随滚动进度从边缘收起；内容在网格之上滚动。
 *
 * 驱动量只有一个 pS（hero 底部滚出视口的比例，0.08 平滑），所有动画都是它的函数，
 * 所以入退场可逆、和网格同拍。pS=0 时标题是「描线完成 + 填色完成」的实心字。
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
  var TITLE_STEP = 0.18; // 逐字错开（和 demo 的 ST 一致）
  var WIPE_MARGIN = 0.28;
  var WIPE_STEP = 0.045;
  var WIPE_SPAN = 0.16;
  var STATE = {
    pS: 0,
    lines: [],
    title: null,
    wipes: [],
    cta: null,
    raf: 0,
    lastT: 0,
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function seg(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }

  /** 位置波纹：两个正弦叠加造大起伏 + 细碎；纯随机像噪点、幅度太小像方格。 */
  function wave(pos) {
    return (Math.sin(pos * 0.017 + 1.3) * 0.5 + Math.sin(pos * 0.043 + 4.1) * 0.5) * 0.16 + (Math.random() - 0.5) * 0.04;
  }

  /** 网格铺满视口（fixed），滚动时网格本身不动，只有线长变化。 */
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

  /** 从 title-paths.js 的字形数据拼出「描线层 + 填色层」的 SVG（结构同 demo）。 */
  function buildTitle() {
    var data = window.__HERO_TITLE;
    if (!data || !titleSvg || !data.glyphs || !data.glyphs.length) return null;
    titleSvg.setAttribute('viewBox', '0 0 ' + data.width + ' ' + data.height);
    titleSvg.setAttribute('aria-label', data.text);
    while (titleSvg.firstChild) titleSvg.removeChild(titleSvg.firstChild);

    var defs = document.createElementNS(NS, 'defs');
    var paths = [];
    var rects = [];
    var lens = [];
    for (var i = 0; i < data.glyphs.length; i += 1) {
      var g = data.glyphs[i];
      var cp = document.createElementNS(NS, 'clipPath');
      cp.setAttribute('id', 'tc' + i);
      var rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('class', 'fr');
      rect.setAttribute('x', g.x);
      rect.setAttribute('y', g.y);
      rect.setAttribute('height', Math.max(1, g.h));
      rect.setAttribute('width', 0);
      cp.appendChild(rect);
      defs.appendChild(cp);
      rects.push(rect);
    }
    titleSvg.appendChild(defs);

    for (var j = 0; j < data.glyphs.length; j += 1) {
      var gl = data.glyphs[j];
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('id', 'tg' + j);
      p.setAttribute('d', gl.d);
      titleSvg.appendChild(p);
      paths.push(p);

      var use = document.createElementNS(NS, 'use');
      use.setAttribute('class', 'fl');
      use.setAttribute('href', '#tg' + j);
      use.setAttribute('clip-path', 'url(#tc' + j + ')');
      titleSvg.appendChild(use);
    }

    // 量周长放在插入 DOM 之后（demo 的 measure 也是这时候量）
    for (var k = 0; k < paths.length; k += 1) {
      var L = 0;
      try {
        L = paths[k].getTotalLength();
      } catch (err) {
        L = 300;
      }
      lens.push(L);
      paths[k].setAttribute('stroke-dasharray', String(L));
      paths[k].setAttribute('stroke-dashoffset', String(L));
    }
    return { paths: paths, rects: rects, lens: lens, glyphs: data.glyphs };
  }

  function applyWipe(el, p) {
    if (p >= 0.999) {
      if (el.__wiped !== true) {
        el.style.webkitMaskImage = 'none';
        el.style.maskImage = 'none';
        el.__wiped = true;
      }
      return;
    }
    el.__wiped = false;
    var half = 0.1;
    var pe = p * (1 + 2 * half) - half;
    var lo = Math.max(0, (pe - half) * 100);
    var hi = Math.min(100, (pe + half) * 100);
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
    rect.setAttribute('x', 0.75);
    rect.setAttribute('y', 0.75);
    rect.setAttribute('width', Math.max(1, w - 1.5));
    rect.setAttribute('height', Math.max(1, h - 1.5));
    var len = 0;
    try {
      len = rect.getTotalLength();
    } catch (err) {
      len = (w + h) * 2;
    }
    rect.style.strokeDasharray = len;
    return { rect: rect, fill: cta.querySelector('.cta-fill'), len: len };
  }

  function collectWipes() {
    var nodes = board.querySelectorAll('[data-wipe]');
    var list = [];
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      var start = WIPE_MARGIN + i * WIPE_STEP;
      list.push({ el: el, start: start, end: start + WIPE_SPAN });
    }
    STATE.wipes = list;
  }

  function render() {
    var pS = STATE.pS;
    var fade = Math.min(1, pS / 0.15, (1 - pS) / 0.15);

    // 网格：pS=0 完整、pS=1 收完；两端 fade 防残留
    for (var i = 0; i < STATE.lines.length; i += 1) {
      var ln = STATE.lines[i];
      var lp = clamp(pS + ln.off * fade, 0, 1);
      ln.el.style.transform =
        ln.axis === 'X' ? 'scaleX(' + (1 - lp).toFixed(4) + ')' : 'scaleY(' + (1 - lp).toFixed(4) + ')';
    }

    // 主标题：先退填色（0.06→0.42），再退描线（0.42→0.72），逐字错开
    var t = STATE.title;
    if (t) {
      var fillP = 1 - seg(pS, 0.06, 0.42);
      var drawP = 1 - seg(pS, 0.42, 0.72);
      var n = t.glyphs.length;
      var span = 1 + (n - 1) * TITLE_STEP;
      var tDraw = drawP * span;
      var tFill = fillP * span;
      for (var j = 0; j < n; j += 1) {
        var qi = clamp(tDraw - j * TITLE_STEP, 0, 1);
        t.paths[j].setAttribute('stroke-dashoffset', (t.lens[j] * (1 - qi)).toFixed(1));
        t.paths[j].style.opacity = qi <= 0.0005 ? '0' : '1';
        var qf = clamp(tFill - j * TITLE_STEP, 0, 1);
        t.rects[j].setAttribute('width', (qf * t.glyphs[j].w).toFixed(2));
      }
    }

    // 小字：每块按自己的 pS 区间擦除（滚回来就是擦入）
    for (var k = 0; k < STATE.wipes.length; k += 1) {
      var wp = STATE.wipes[k];
      applyWipe(wp.el, 1 - seg(pS, wp.start, wp.end));
    }

    // CTA：填充缩回（0.30→0.45），边框描回（0.50→0.68）
    var c = STATE.cta;
    if (c) {
      var fillBtn = 1 - seg(pS, 0.3, 0.45);
      var strokeBtn = 1 - seg(pS, 0.5, 0.68);
      c.rect.style.strokeDashoffset = (c.len * (1 - strokeBtn)).toFixed(2);
      c.rect.style.opacity = strokeBtn > 0.001 ? 1 : 0;
      if (c.fill) c.fill.style.transform = 'scaleX(' + fillBtn.toFixed(4) + ')';
      cta.classList.toggle('filled', fillBtn > 0.88);
    }
  }

  function readScroll() {
    var rect = board.getBoundingClientRect();
    var bottomAbs = rect.bottom + window.scrollY;
    return bottomAbs > 0 ? clamp(window.scrollY / bottomAbs, 0, 1) : 0;
  }

  function tick(now) {
    var dt = STATE.lastT ? Math.min(64, now - STATE.lastT) : 16;
    STATE.lastT = now;
    var pRaw = reduceMotion ? 0 : readScroll();
    var diff = pRaw - STATE.pS;
    if (Math.abs(diff) < 0.01) STATE.pS = pRaw;
    else STATE.pS += diff * 0.08;
    if (STATE.pS > 0.99) STATE.pS = 1;
    if (STATE.pS < 0.01) STATE.pS = 0;
    render();
    if (Math.abs(pRaw - STATE.pS) > 0.002) {
      STATE.raf = requestAnimationFrame(tick);
    } else {
      STATE.raf = 0;
      STATE.lastT = 0;
    }
  }

  function kick() {
    if (STATE.raf) return;
    STATE.lastT = 0;
    STATE.raf = requestAnimationFrame(tick);
  }

  function boot() {
    buildLines();
    STATE.title = buildTitle();
    collectWipes();
    STATE.cta = setupCta();
    if (reduceMotion && STATE.title) {
      STATE.pS = 0;
    }
    render();

    if (reduceMotion) return;

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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
