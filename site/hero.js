/**
 * Hero 融合动画：「设计台网格背景」+「描线填色入场」，**完全由滚动位置驱动**。
 *
 * 只有一个驱动量 pS（hero 滚出视口的进度 0→1，带平滑），所有动画都是它的函数：
 *   - 网格：每条线按位置波纹错开地从边缘收起 / 织回（可逆）；
 *   - 文字：整句一个 mask，前沿从左往右扫 → 文字被擦掉；往上滚回来 mask 反向，文字重新擦入；
 *   - CTA：填充从左往回缩 → 边框沿轮廓描回去（描线填色的反向），滚回来时正着播一遍。
 *
 * 所以「入场」= 从下面滚回来，pS 变小；「退场」= 往下滚，pS 变大。两者同一套映射，天然可逆、
 * 也和网格的收起节奏天然对齐（同一个 pS）。
 *
 * 参数来自库里两项设计的 prompt：网格间距 34、位移波纹 sin 双频、pS 平滑 0.08、两端 fade 0.15、
 * 擦入过渡带半宽 0.1；文字各块的 pS 区间按 DOM 顺序错开。
 */
(function () {
  'use strict';

  var board = document.getElementById('hero');
  var weave = document.getElementById('weave');
  var cta = document.getElementById('hero-cta');
  var content = document.getElementById('hero-content');
  if (!board || !weave) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var GAP = 34;
  var WIPE_MARGIN = 0.28; // pS 到这个值才开始擦
  var WIPE_STEP = 0.045; // 每个元素错开多少
  var WIPE_SPAN = 0.16; // 单个元素的擦除跨度
  var STATE = {
    pS: 0,
    lines: [],
    wipes: [],
    cta: null,
    raf: 0,
    lastT: 0,
  };

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /** 位置波纹：两个正弦叠加造大起伏 + 细碎；纯随机像噪点、幅度太小像方格。 */
  function wave(pos) {
    return (Math.sin(pos * 0.017 + 1.3) * 0.5 + Math.sin(pos * 0.043 + 4.1) * 0.5) * 0.16 + (Math.random() - 0.5) * 0.04;
  }

  function buildLines() {
    var w = board.clientWidth;
    var h = board.clientHeight;
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

  /** 擦入：p=1 完整、p=0 完全擦掉；前沿从左往右（滚下去）或反向（滚回来）。 */
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
    var g = 'linear-gradient(98deg, #000 0 ' + lo.toFixed(2) + '%, transparent ' + hi.toFixed(2) + '%)';
    el.style.webkitMaskImage = g;
    el.style.maskImage = g;
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
      var scale = 1 - lp;
      ln.el.style.transform =
        ln.axis === 'X' ? 'scaleX(' + scale.toFixed(4) + ')' : 'scaleY(' + scale.toFixed(4) + ')';
    }

    // 文字：每块按自己的 pS 区间擦除（滚回来就是擦入）
    for (var j = 0; j < STATE.wipes.length; j += 1) {
      var wp = STATE.wipes[j];
      var local = 1 - clamp((pS - wp.start) / (wp.end - wp.start), 0, 1);
      applyWipe(wp.el, local);
    }

    // CTA：填充先缩回（0.30→0.45），边框再描回去（0.50→0.68）
    var c = STATE.cta;
    if (c) {
      var fillP = 1 - clamp((pS - 0.3) / 0.15, 0, 1);
      var strokeP = 1 - clamp((pS - 0.5) / 0.18, 0, 1);
      c.rect.style.strokeDashoffset = (c.len * (1 - strokeP)).toFixed(2);
      c.rect.style.opacity = strokeP > 0.001 ? 1 : 0;
      if (c.fill) c.fill.style.transform = 'scaleX(' + fillP.toFixed(4) + ')';
      cta.classList.toggle('filled', fillP > 0.88);
    }
  }

  /** pRaw：hero 底部滚出视口顶部时 = 1。 */
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
    collectWipes();
    STATE.cta = setupCta();
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
    if (typeof ResizeObserver === 'function') {
      var lastW = board.clientWidth;
      var lastH = board.clientHeight;
      var ro = new ResizeObserver(function () {
        if (board.clientWidth === lastW && board.clientHeight === lastH) return;
        lastW = board.clientWidth;
        lastH = board.clientHeight;
        buildLines();
        STATE.cta = setupCta();
        render();
        kick();
      });
      ro.observe(board);
    }

    kick();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
