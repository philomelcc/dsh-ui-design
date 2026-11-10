/* UI 设计知识库 · 展示版（纯静态，不需要 DSH） */
(function () {
  'use strict';

  var PAGE_SIZE = 24;
  var TOKEN_MAP = {
    bg: '--bg',
    surface: '--surface',
    'surface-2': '--surface-2',
    border: '--border',
    text: '--text',
    'text-dim': '--text-dim',
    brand: '--brand',
    success: '--ok',
    warn: '--warn',
    danger: '--danger',
  };

  var state = { index: null, designs: [], tags: [], query: '', tagWords: [], tag: 'all', page: 1, theme: 'light' };

  // ---------- 演示光标（与 DSH 插件里同一份逻辑：空闲 1.2 秒自动隐藏） ----------
  var CURSOR_JS =
    'window.__uiDemoCursor=function(){' +
    'var noop=function(){};' +
    'if(window.__uiInteractive){return {el:{classList:{add:noop,remove:noop}},moveTo:noop,at:noop,press:noop,release:noop,hide:noop};}' +
    'var el=document.createElement("div");el.className="demo-cursor";el.innerHTML="<span class=\\"ring\\"></span>";' +
    'el.style.left="50%";el.style.top="50%";document.body.appendChild(el);' +
    'var idle=null;function poke(){el.classList.add("show");if(idle)clearTimeout(idle);idle=setTimeout(function(){el.classList.remove("show");},1200);}' +
    'poke();' +
    'return {el:el,' +
    'moveTo:function(t){var r=t.getBoundingClientRect();el.style.left=(r.left+r.width/2)+"px";el.style.top=(r.top+r.height/2)+"px";poke();},' +
    'at:function(x,y){var w=window.innerWidth-12,h=window.innerHeight-12;el.style.left=Math.max(12,Math.min(x,w))+"px";el.style.top=Math.max(12,Math.min(y,h))+"px";poke();},' +
    'press:function(){el.classList.add("pressed");poke();},' +
    'release:function(){el.classList.remove("pressed");poke();},' +
    'hide:function(){el.classList.remove("show");if(idle){clearTimeout(idle);idle=null;}}' +
    '};};';

  var CURSOR_CSS =
    '.demo-cursor{position:fixed;left:0;top:0;width:13px;height:13px;border-radius:50%;background:var(--ui-brand);border:2px solid var(--ui-bg);box-shadow:0 2px 8px rgba(0,0,0,.3);transform:translate(-50%,-50%);transition:opacity .25s ease;pointer-events:none;z-index:9999;opacity:0}' +
    '.demo-cursor.show{opacity:.92}.demo-cursor.pressed{transform:translate(-50%,-50%) scale(.72)}' +
    '.demo-cursor.sweeping{transition:none}';

  function $(id) {
    return document.getElementById(id);
  }

  // ---------- 主题（配色方案来自设计库里的「配色方案」设计） ----------
  var THEME_KEY = 'uid-theme-v2';
  var SITE_VARS = ['--bg', '--surface', '--surface-2', '--border', '--text', '--text-dim', '--brand', '--on-brand', '--ok', '--warn', '--danger'];
  var themeVars = {};
  var themeList = [{ id: 'auto', name: '跟随系统' }];

  /** 从配色方案 demo 的 :root 里抽色板，映射到站点的 CSS 变量。 */
  function extractPalette(html) {
    var match = String(html || '').match(/:root\s*\{([\s\S]*?)\}/);
    if (!match) return null;
    var raw = {};
    var any = false;
    match[1].split(';').forEach(function (part) {
      var mm = part.match(/--([\w-]+)\s*:\s*([^;]+)/);
      if (!mm) return;
      var value = mm[2].trim();
      if (!/^(#|rgb|hsl)/i.test(value)) return;
      raw['--' + mm[1]] = value;
      any = true;
    });
    if (!any) return null;
    var out = {};
    if (raw['--bg']) out['--bg'] = raw['--bg'];
    if (raw['--surface']) out['--surface'] = raw['--surface'];
    if (raw['--mini-bg'] || raw['--surface']) out['--surface-2'] = raw['--mini-bg'] || raw['--surface'];
    if (raw['--line-strong'] || raw['--line']) out['--border'] = raw['--line-strong'] || raw['--line'];
    if (raw['--text']) out['--text'] = raw['--text'];
    if (raw['--dim']) out['--text-dim'] = raw['--dim'];
    if (raw['--brand']) out['--brand'] = raw['--brand'];
    if (raw['--on-brand']) out['--on-brand'] = raw['--on-brand'];
    if (raw['--ok']) out['--ok'] = raw['--ok'];
    if (raw['--warn']) out['--warn'] = raw['--warn'];
    if (raw['--bad']) out['--danger'] = raw['--bad'];
    return out;
  }

  function isDarkColor(hex) {
    var m = /^#([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return false;
    var n = parseInt(m[1], 16);
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    return 0.299 * r + 0.587 * g + 0.114 * b < 128;
  }

  function applyThemeById(id) {
    state.themeId = id;
    var root = document.documentElement;
    SITE_VARS.forEach(function (v) {
      root.style.removeProperty(v);
    });
    if (id === 'auto') {
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      var vars = themeVars[id] || {};
      root.setAttribute('data-theme', isDarkColor(vars['--bg']) ? 'dark' : 'light');
      Object.keys(vars).forEach(function (k) {
        if (vars[k]) root.style.setProperty(k, vars[k]);
      });
    }
    var label = $('theme-label');
    if (label) {
      var current = themeList.filter(function (t) {
        return t.id === id;
      })[0];
      label.textContent = current ? current.name : '跟随系统';
    }
    renderThemeOptions('');
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch (e) {}
  }

  function renderThemeOptions(filter) {
    var list = $('theme-panel');
    if (!list) return;
    var keyword = String(filter || '').trim().toLowerCase();
    var items = themeList.filter(function (t) {
      return !keyword || t.name.toLowerCase().indexOf(keyword) >= 0;
    });
    list.innerHTML = '';
    if (!items.length) {
      var empty = document.createElement('div');
      empty.className = 'theme-empty';
      empty.textContent = '没有匹配项';
      list.appendChild(empty);
      return;
    }
    items.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'theme-opt' + (t.id === state.themeId ? ' on' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', t.id === state.themeId ? 'true' : 'false');
      btn.textContent = t.name;
      var tick = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      tick.setAttribute('viewBox', '0 0 24 24');
      tick.setAttribute('width', '12');
      tick.setAttribute('height', '12');
      tick.setAttribute('class', 'tick');
      tick.innerHTML = '<path d="M5.5 12.5l4.2 4.1 8.8-9.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
      btn.appendChild(tick);
      btn.addEventListener('click', function () {
        applyThemeById(t.id);
        closeThemePicker();
      });
      list.appendChild(btn);
    });
  }

  function openThemePicker() {
    $('theme-picker').classList.add('open');
    $('theme-trigger').setAttribute('aria-expanded', 'true');
    $('theme-panel').hidden = false;
    renderThemeOptions('');
    var input = $('theme-search');
    setTimeout(function () {
      input.value = '';
      input.focus({ preventScroll: true });
    }, 50);
  }

  function closeThemePicker() {
    $('theme-picker').classList.remove('open');
    $('theme-trigger').setAttribute('aria-expanded', 'false');
    $('theme-panel').hidden = true;
  }

  /** 把设计库里的配色方案变成可选主题（可搜索下拉）。 */
  function initThemePicker() {
    var palettes = state.designs.filter(function (d) {
      return (d.tags || []).indexOf('配色方案') >= 0;
    });
    var jobs = palettes.map(function (d) {
      return detail(d.id)
        .then(function (design) {
          var vars = extractPalette(design.demoHtml);
          if (!vars || !vars['--bg']) return;
          var id = 'palette:' + d.id;
          themeVars[id] = vars;
          themeList.push({ id: id, name: d.name });
        })
        .catch(function () {});
    });
    return Promise.all(jobs).then(function () {
      var saved = null;
      try {
        saved = localStorage.getItem(THEME_KEY);
      } catch (e) {}
      applyThemeById(saved && (saved === 'auto' || themeVars[saved]) ? saved : 'auto');

      $('theme-trigger').addEventListener('click', function () {
        if ($('theme-picker').classList.contains('open')) closeThemePicker();
        else openThemePicker();
      });
      $('theme-search').addEventListener('input', function (e) {
        renderThemeOptions(e.target.value);
      });
      $('theme-search').addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeThemePicker();
        } else if (e.key === 'Enter') {
          var first = $('theme-list').querySelector('.theme-opt');
          if (first) {
            first.click();
          }
        }
      });
      document.addEventListener('click', function (e) {
        if (!$('theme-picker').contains(e.target)) closeThemePicker();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeThemePicker();
      });
    });
  }

  // ---------- demo 注入 ----------
  function readTokens() {
    var cs = getComputedStyle(document.documentElement);
    var out = {};
    for (var key in TOKEN_MAP) out[key] = cs.getPropertyValue(TOKEN_MAP[key]).trim();
    return out;
  }

  function buildSrcDoc(html, tokens, interactive) {
    var vars = [];
    for (var key in tokens) vars.push('--ui-' + key + ':' + tokens[key]);
    var style = '<style>:root{' + vars.join(';') + '}' + CURSOR_CSS + '</style>';
    // 和 DSH 插件同一层保护：iframe 里的自动演示不能抢父页面焦点、不能滚外层页面。
    // inert：预览里程序化 click 仍会触发事件，但元素不再能获得焦点（click 聚焦不走 JS focus，
    // 光拦 Element.prototype.focus 不够——筛选「交互」时会失焦就是这个原因）。
    var guard =
      'Element.prototype.scrollIntoView=function(){};' +
      '(function(){var origFocus=Element.prototype.focus;Element.prototype.focus=function(){if(window.__uiInteractive){origFocus.call(this,{preventScroll:true});}};if(!window.__uiInteractive){window.focus=function(){};document.addEventListener("DOMContentLoaded",function(){if(document.body)document.body.setAttribute("inert","");});}})();';
    var script = '<script>window.__uiInteractive=' + Boolean(interactive) + ';' + guard + CURSOR_JS + '<' + '/script>';
    var out = String(html || '');
    if (/<\/head>/i.test(out)) return out.replace(/<\/head>/i, style + script + '</head>');
    if (/<html[^>]*>/i.test(out)) {
      return out.replace(/<html[^>]*>/i, function (m) {
        return m + style + script;
      });
    }
    return style + script + out;
  }

  // ---------- 数据 ----------
  function loadIndex() {
    return fetch('data/index.json', { cache: 'no-store' })
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        state.index = json;
        state.designs = (json.designs || []).slice();
        state.designs.sort(function (a, b) {
          return b.createdAt - a.createdAt;
        });
        var counts = new Map();
        state.designs.forEach(function (d) {
          (d.tags || []).forEach(function (t) {
            counts.set(t, (counts.get(t) || 0) + 1);
          });
        });
        state.tags = Array.from(counts, function (e) {
          return { tag: e[0], count: e[1] };
        }).sort(function (a, b) {
          return b.count - a.count;
        });
      });
  }

  function detail(id) {
    return fetch('data/designs/' + encodeURIComponent(id) + '.json', { cache: 'no-store' }).then(function (r) {
      return r.json();
    });
  }

  // ---------- 过滤 + 分页 ----------
  var STOP = { 的: 1, 了: 1, 在: 1, 是: 1, 和: 1, 与: 1, 用: 1, 个: 1, 这: 1, 那: 1, 做: 1, 一个: 1, 一下: 1, the: 1, a: 1, an: 1, of: 1, to: 1, for: 1 };

  function filtered() {
    var terms = state.tagWords
      .map(function (w) {
        return String(w).toLowerCase();
      })
      .concat(
        (state.query || '')
          .toLowerCase()
          .split(/[\s,，、;；]+/)
          .filter(function (t) {
            return t && !STOP[t];
          })
      );
    var items = state.designs.filter(function (d) {
      return state.tag === 'all' || (d.tags || []).indexOf(state.tag) >= 0;
    });
    if (!terms.length) return items;
    var scored = [];
    items.forEach(function (d) {
      var name = (d.name || '').toLowerCase();
      var tagsText = (d.tags || []).join(' ').toLowerCase();
      var rest = [d.summary, d.usage, d.caution, d.hint].join(' ').toLowerCase();
      var hit = 0;
      var score = 0;
      terms.forEach(function (term) {
        if (name.indexOf(term) >= 0) {
          hit += 1;
          score += 3;
        } else if (tagsText.indexOf(term) >= 0) {
          hit += 1;
          score += 2;
        } else if (rest.indexOf(term) >= 0) {
          hit += 1;
          score += 1;
        }
      });
      if (hit > 0) scored.push({ d: d, hit: hit, score: score });
    });
    scored.sort(function (a, b) {
      return b.hit - a.hit || b.score - a.score || b.d.createdAt - a.d.createdAt;
    });
    return scored.map(function (s) {
      return s.d;
    });
  }

  function pagerPages(cur, total) {
    if (total <= 7) {
      var all = [];
      for (var i = 1; i <= total; i++) all.push(i);
      return all;
    }
    if (cur <= 4) return [1, 2, 3, 4, 5, 'gap', total];
    if (cur >= total - 3) return [1, 'gap', total - 4, total - 3, total - 2, total - 1, total];
    return [1, 'gap', cur - 1, cur, cur + 1, 'gap', total];
  }

  // ---------- 渲染 ----------
  function renderSearchTags() {
    var wrap = $('search-tags');
    var input = $('search');
    if (!wrap || !input) return;
    Array.prototype.slice.call(wrap.querySelectorAll('.tag-chip')).forEach(function (chip) {
      chip.remove();
    });
    state.tagWords.forEach(function (word) {
      var chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = word;
      var x = document.createElement('button');
      x.className = 'x';
      x.setAttribute('aria-label', '移除 ' + word);
      x.innerHTML =
        '<svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
      x.addEventListener('click', function (event) {
        event.stopPropagation();
        var at = state.tagWords.indexOf(word);
        if (at >= 0) state.tagWords.splice(at, 1);
        renderSearchTags();
        state.page = 1;
        render();
      });
      chip.appendChild(x);
      wrap.insertBefore(chip, input);
    });
  }

  function addSearchTag(raw) {
    var word = String(raw || '').trim().replace(/[,，]$/, '');
    if (!word) return;
    var box = $('search-tags');
    if (state.tagWords.indexOf(word) >= 0) {
      // 和 demo 一致：重复忽略 + 轻抖 + 边框闪一下
      if (box && box.animate) {
        box.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-3px)' },
            { transform: 'translateX(3px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 220, easing: 'ease-out' }
        );
      }
      if (box) {
        box.classList.add('dup');
        setTimeout(function () {
          box.classList.remove('dup');
        }, 600);
      }
      // 和 demo 一致：短暂提示一句「已经有「X」这个标签了」
      var input = $('search');
      if (input) {
        input.placeholder = '已经有「' + word + '」这个标签了';
        setTimeout(function () {
          input.placeholder = state.tagWords.length ? '继续添加…' : '搜索设计名 / tag / 场景… 回车固定标签';
        }, 1600);
      }
      $('search').value = '';
      state.query = '';
      return;
    }
    state.tagWords.push(word);
    $('search').value = '';
    state.query = '';
    renderSearchTags();
    state.page = 1;
    render();
  }

  function renderChips() {
    var wrap = $('chips');
    wrap.innerHTML = '';
    var chips = [{ tag: 'all', count: state.designs.length }].concat(state.tags);
    chips.forEach(function (item) {
      var btn = document.createElement('button');
      btn.className = 'chip' + (state.tag === item.tag ? ' active' : '');
      btn.innerHTML = '';
      btn.appendChild(document.createTextNode(item.tag === 'all' ? '全部' : item.tag));
      var n = document.createElement('span');
      n.className = 'n';
      n.textContent = item.count;
      btn.appendChild(n);
      btn.addEventListener('click', function () {
        state.tag = item.tag;
        state.page = 1;
        render();
      });
      wrap.appendChild(btn);
    });
  }

  function renderCards() {
    var grid = $('grid');
    grid.innerHTML = '';
    var items = filtered();
    var totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    var slice = items.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    $('empty').hidden = slice.length > 0;
    if (!slice.length) {
      $('empty').textContent =
        state.query || state.tagWords.length || state.tag !== 'all' ? '没有匹配的设计。' : '还没有设计。';
    }

    slice.forEach(function (design) {
      grid.appendChild(makeCard(design));
    });
    renderPager(state.page, totalPages, items.length);
    $('sub').textContent =
      '前端知识库 · ' +
      state.designs.length +
      ' 项设计 · ' +
      state.tags.length +
      ' 个 tag' +
      (state.query || state.tagWords.length || state.tag !== 'all' ? ' · 筛选后 ' + items.length + ' 项' : '');
  }

  function makeCard(design) {
    var card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', '打开设计：' + design.name);

    var preview = document.createElement('div');
    preview.className = 'preview';
    var skel = document.createElement('div');
    skel.className = 'skel';
    preview.appendChild(skel);
    card.appendChild(preview);

    var body = document.createElement('div');
    body.className = 'card-body';
    var name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = design.name;
    body.appendChild(name);
    if (design.summary) {
      var sum = document.createElement('div');
      sum.className = 'card-summary';
      sum.textContent = design.summary;
      body.appendChild(sum);
    }
    var meta = document.createElement('div');
    meta.className = 'card-meta';
    (design.tags || []).forEach(function (tag) {
      var span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      meta.appendChild(span);
    });
    var cue = document.createElement('span');
    cue.className = 'cue';
    cue.textContent = '点击体验 →';
    meta.appendChild(cue);
    body.appendChild(meta);
    card.appendChild(body);

    // 懒加载预览：进入视口附近才取 demo
    if (typeof IntersectionObserver === 'function') {
      var io = new IntersectionObserver(
        function (entries) {
          if (entries.some(function (e) {
            return e.isIntersecting;
          })) {
            io.disconnect();
            loadPreview(design.id, preview);
          }
        },
        { rootMargin: '300px' }
      );
      io.observe(preview);
    } else {
      loadPreview(design.id, preview);
    }

    card.addEventListener('click', function () {
      openModal(design.id);
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(design.id);
      }
    });
    return card;
  }

  function loadPreview(id, preview) {
    detail(id)
      .then(function (design) {
        var iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('loading', 'lazy');
        iframe.title = design.name;
        iframe.srcdoc = buildSrcDoc(design.demoHtml, readTokens(), false);
        preview.innerHTML = '';
        preview.appendChild(iframe);
      })
      .catch(function () {});
  }

  var pagerEl = function () {
    return $('pager');
  };

  function renderPager(page, totalPages, total) {
    var wrap = pagerEl();
    wrap.innerHTML = '';
    if (total <= PAGE_SIZE) return;
    var nav = document.createElement('nav');
    nav.className = 'pager';
    nav.setAttribute('aria-label', '分页');

    function btn(label, cls, disabled, onClick, aria) {
      var b = document.createElement('button');
      b.className = 'pg ' + cls;
      b.textContent = label;
      if (aria) b.setAttribute('aria-label', aria);
      if (disabled) b.disabled = true;
      b.addEventListener('click', onClick);
      return b;
    }

    nav.appendChild(btn('‹', 'nav', page <= 1, function () { go(page - 1); }, '上一页'));
    pagerPages(page, totalPages).forEach(function (item) {
      if (item === 'gap') {
        var gap = document.createElement('span');
        gap.className = 'gap';
        gap.textContent = '…';
        nav.appendChild(gap);
      } else {
        var b = btn(String(item), item === page ? 'cur' : '', false, function () {
          go(item);
        });
        if (item === page) b.setAttribute('aria-current', 'page');
        nav.appendChild(b);
      }
    });
    nav.appendChild(btn('›', 'nav', page >= totalPages, function () { go(page + 1); }, '下一页'));
    wrap.appendChild(nav);
  }

  function go(next) {
    state.page = next;
    renderCards();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    renderChips();
    renderCards();
  }

  // ---------- 弹窗 ----------
  var current = null;

  function openModal(id) {
    detail(id)
      .then(function (design) {
        current = design;
        $('m-title').textContent = design.name;
        $('m-sub').textContent = (design.tags || []).join(' · ');
        $('m-summary').textContent = design.summary || '';
        $('m-usage-wrap').hidden = !design.usage;
        $('m-usage').textContent = design.usage || '';
        $('m-caution-wrap').hidden = !design.caution;
        $('m-caution').textContent = design.caution || '';
        $('m-inspiration-wrap').hidden = !design.inspiration;
        $('m-inspiration').textContent = design.inspiration || '';
        $('m-prompt').textContent = design.prompt || '';
        var hint = $('m-hint');
        if (design.hint) {
          hint.hidden = false;
          hint.innerHTML = '';
          var b = document.createElement('b');
          b.textContent = '操作提示';
          var s = document.createElement('span');
          s.textContent = design.hint;
          hint.appendChild(b);
          hint.appendChild(s);
        } else {
          hint.hidden = true;
        }
        var demo = $('m-demo');
        demo.innerHTML = '';
        var iframe = document.createElement('iframe');
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.title = design.name + ' 演示';
        iframe.srcdoc = buildSrcDoc(design.demoHtml, readTokens(), true);
        demo.appendChild(iframe);
        $('modal').hidden = false;
        document.body.style.overflow = 'hidden';
      })
      .catch(function (err) {
        alert((err && err.message) || '加载失败');
      });
  }

  function closeModal() {
    $('modal').hidden = true;
    document.body.style.overflow = '';
    current = null;
  }

  function copy(text, btn, doneText) {
    var ok = function () {
      var old = btn.textContent;
      btn.textContent = doneText || '已复制';
      setTimeout(function () {
        btn.textContent = old;
      }, 1200);
    };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        ok();
      } catch (e) {
        alert('复制失败，请手动选择');
      }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else {
      fallback();
    }
  }

  // ---------- 初始化 ----------
  function boot() {
    $('search').addEventListener('input', function (e) {
      state.query = e.target.value.trim();
      state.page = 1;
      render();
    });
    $('search').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',' || e.key === '，') {
        e.preventDefault();
        addSearchTag($('search').value);
      } else if (e.key === 'Backspace' && !$('search').value && state.tagWords.length) {
        state.tagWords.pop();
        renderSearchTags();
        state.page = 1;
        render();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('modal').hidden) closeModal();
    });

    $('modal').addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close') || e.target.classList.contains('modal-veil')) {
        closeModal();
      }
    });

    $('copy-prompt').addEventListener('click', function () {
      if (current) copy(current.prompt || '', this, '已复制提示词');
    });
    $('copy-json').addEventListener('click', function () {
      if (current) {
        copy(
          JSON.stringify(
            {
              name: current.name,
              tags: current.tags,
              summary: current.summary,
              usage: current.usage,
              caution: current.caution,
              hint: current.hint,
              prompt: current.prompt,
            },
            null,
            2
          ),
          this,
          '已复制 JSON'
        );
      }
    });

    loadIndex()
      .then(function () {
        render();
        $('empty').hidden = true;
        return initThemePicker();
      })
      .catch(function (err) {
        $('sub').textContent = '没加载到数据：' + ((err && err.message) || '未知错误');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
