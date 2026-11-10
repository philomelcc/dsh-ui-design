window.__ModuleLoader__.load({
  id: '@local/dsh-ui-design',
  factory(require) {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const h = React.createElement;

    const VIEW_ID = 'ui-design';
    const LIST_URL = '/ui-design/list';
    const GET_URL = '/ui-design/get';
    const CREATE_URL = '/ui-design/create';
    const UPDATE_URL = '/ui-design/update';
    const DELETE_URL = '/ui-design/delete';
    const PAGE_SIZE = 24;

    // ---------- tokens ----------
    const C = {
      brand: 'var(--dsw-alias-brand-primary, #6366f1)',
      bgBase: 'var(--dsw-alias-bg-base, #0b0e14)',
      bg1: 'var(--dsw-alias-bg-layer-1, #111827)',
      bg2: 'var(--dsw-alias-bg-layer-2, #1a2238)',
      border1: 'var(--dsw-alias-border-l1, #2a3350)',
      border2: 'var(--dsw-alias-border-l2, #3a4466)',
      label: 'var(--dsw-alias-label-primary, #e8eefc)',
      label2: 'var(--dsw-alias-label-secondary, #7d8db3)',
      error: 'var(--dsw-alias-state-error-primary, #f87171)',
    };

    // ---------- styles ----------
    const CSS = `
.uid-page { height:100%; box-sizing:border-box; overflow-y:auto; padding:24px 28px 60px; max-width:none; margin:0; background:${C.bgBase}; color:${C.label}; }
.uid-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
.uid-title { margin:0; font-size:20px; font-weight:650; line-height:1.3; }
.uid-sub { margin-top:4px; font-size:12px; color:${C.label2}; }
.uid-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.uid-searchtags { display:flex; flex-wrap:wrap; align-items:center; gap:6px; min-height:36px; padding:4px 8px; border-radius:10px; border:1px solid ${C.border1}; background:${C.bg1}; width:320px; box-sizing:border-box; transition:border-color .16s,box-shadow .16s; }
.uid-searchtags:focus-within { border-color:${C.brand}; }
.uid-searchtags.dup { border-color:${C.warn}; box-shadow:0 0 0 3px color-mix(in srgb,${C.warn} 14%,transparent); }
.uid-search { flex:1 1 120px; min-width:110px; height:28px; padding:0 4px; border:0; background:transparent; color:${C.label}; font-size:13px; outline:none; }
.uid-tagchip { display:inline-flex; align-items:center; gap:4px; height:23px; padding:0 4px 0 9px; border-radius:999px; background:color-mix(in srgb,${C.brand} 13%,transparent); border:1px solid color-mix(in srgb,${C.brand} 24%,transparent); font-size:11px; font-weight:600; color:${C.label}; }
.uid-tagchip .x { border:0; background:transparent; color:${C.label2}; cursor:pointer; font-size:13px; line-height:1; padding:0 2px; }
.uid-tagchip .x:hover { color:${C.error}; }
.uid-btn { appearance:none; cursor:pointer; font-size:13px; padding:0 15px; height:36px; border-radius:10px; border:1px solid ${C.border2}; background:${C.bg1}; color:${C.label}; transition:background .16s, filter .16s, border-color .16s; font-family:inherit; }
.uid-btn:hover { background:${C.bg2}; }
.uid-btn.primary { background:${C.brand}; border-color:transparent; color:${C.bgBase}; }
.uid-btn.primary:hover { filter:brightness(1.08); }
.uid-btn.ghost { background:transparent; border-color:transparent; color:${C.label2}; }
.uid-btn.ghost:hover { color:${C.label}; background:${C.bg2}; }
.uid-btn.danger { color:${C.error}; border-color:rgba(248,113,113,.35); }
.uid-btn.danger:hover { background:rgba(248,113,113,.12); }
.uid-btn:disabled { opacity:.5; cursor:default; }
.uid-chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
.uid-chip { appearance:none; cursor:pointer; font-size:12px; padding:6px 12px; border-radius:999px; border:1px solid ${C.border1}; background:transparent; color:${C.label2}; transition:.16s; font-family:inherit; }
.uid-chip:hover { border-color:${C.brand}; color:${C.label}; }
.uid-chip.active { background:color-mix(in srgb,${C.brand} 16%,transparent); border-color:color-mix(in srgb,${C.brand} 55%,transparent); color:${C.label}; }
.uid-chip .n { opacity:.55; margin-left:4px; font-size:11px; }
.uid-note { font-size:12px; color:${C.label2}; margin:10px 0 18px; line-height:1.7; }
.uid-note code { font-size:11.5px; padding:1px 6px; border-radius:6px; background:${C.bg2}; color:${C.label}; }
.uid-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; }
.uid-card { position:relative; border-radius:16px; overflow:hidden; background:${C.bg1}; border:1px solid ${C.border1}; cursor:pointer; transition:transform .2s cubic-bezier(.2,.8,.25,1), box-shadow .2s, border-color .2s; outline:none; }
.uid-card:hover, .uid-card:focus-visible { transform:translateY(-4px); border-color:rgba(99,102,241,.5); box-shadow:0 20px 54px rgba(0,0,0,.35); }
.uid-preview { position:relative; height:176px; background:${C.bgBase}; overflow:hidden; border-bottom:1px solid ${C.border1}; }
.uid-preview iframe { display:block; width:100%; height:100%; border:0; pointer-events:none; }
.uid-skel { position:absolute; inset:0; background:linear-gradient(100deg, rgba(255,255,255,.03) 25%, rgba(255,255,255,.07) 37%, rgba(255,255,255,.03) 63%); background-size:400% 100%; animation:uid-shimmer 1.6s linear infinite; }
@keyframes uid-shimmer { 0% { background-position:100% 0; } 100% { background-position:0 0; } }
.uid-cardbody { padding:12px 14px 14px; }
.uid-name { font-size:14px; font-weight:650; letter-spacing:.1px; }
.uid-summary { margin-top:6px; font-size:12px; line-height:1.6; color:${C.label2}; }
.uid-cardmeta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:8px; }
.uid-tag { font-size:11px; padding:2px 8px; border-radius:999px; background:color-mix(in srgb,${C.brand} 13%,transparent); color:color-mix(in srgb,${C.brand} 72%,${C.label}); }
.uid-cue { margin-left:auto; font-size:11px; color:${C.label2}; opacity:0; transition:opacity .2s; }
.uid-card:hover .uid-cue, .uid-card:focus-visible .uid-cue { opacity:1; }
.uid-overlay { position:fixed; inset:0; z-index:600; background:rgba(0,0,0,0); transition:background .24s ease; }
.uid-overlay.open { background:rgba(0,0,0,.5); }
.uid-modal { position:fixed; display:flex; flex-direction:column; overflow:hidden; background:${C.bgBase}; border:1px solid ${C.border1}; box-shadow:0 40px 120px rgba(0,0,0,.55); transition:left .26s cubic-bezier(.2,.8,.25,1), top .26s cubic-bezier(.2,.8,.25,1), width .26s cubic-bezier(.2,.8,.25,1), height .26s cubic-bezier(.2,.8,.25,1), border-radius .26s ease; }
.uid-modal-head { display:flex; align-items:center; gap:12px; padding:14px 18px; border-bottom:1px solid ${C.border1}; flex:0 0 auto; }
.uid-modal-title { font-size:16px; font-weight:650; }
.uid-modal-sub { margin-top:2px; font-size:11px; color:${C.label2}; }
.uid-iconbtn { appearance:none; cursor:pointer; width:32px; height:32px; border-radius:9px; border:1px solid transparent; background:transparent; color:${C.label2}; font-size:15px; display:flex; align-items:center; justify-content:center; transition:.16s; flex:0 0 auto; font-family:inherit; }
.uid-iconbtn:hover { background:${C.bg2}; color:${C.label}; }
.uid-modal-body { flex:1 1 auto; min-height:0; display:flex; opacity:0; transition:opacity .18s ease; }
.uid-modal-body.open { opacity:1; }
.uid-demo-col { flex:1 1 auto; min-width:0; min-height:0; display:flex; flex-direction:column; background:#080c17; }
.uid-demo { flex:1 1 auto; min-height:0; background:#080c17; position:relative; }
.uid-demo iframe { display:block; width:100%; height:100%; border:0; }
.uid-hint-bar { flex:0 0 auto; display:flex; gap:10px; align-items:flex-start; padding:10px 16px; background:${C.bgBase}; border-top:1px solid ${C.border1}; font-size:12px; line-height:1.5; color:${C.label}; }
.uid-hint-bar b { flex:0 0 auto; color:${C.brand}; font-weight:600; white-space:nowrap; }
.uid-side { flex:0 0 380px; width:380px; border-left:1px solid ${C.border1}; padding:16px; display:flex; flex-direction:column; gap:10px; min-height:0; overflow:hidden; box-sizing:border-box; }
.uid-side-scroll { flex:1 1 auto; min-height:0; overflow-y:auto; display:flex; flex-direction:column; gap:12px; }
.uid-side h4 { margin:0 0 6px; font-size:12px; letter-spacing:.06em; color:${C.label2}; font-weight:600; }
.uid-side p { margin:0; font-size:12.5px; line-height:1.7; color:${C.label2}; }
.uid-prompt { margin:0; padding:12px; border-radius:10px; background:${C.bg1}; border:1px solid ${C.border1}; font-size:11.5px; line-height:1.65; color:${C.label}; white-space:pre-wrap; word-break:break-word; font-family:ui-monospace, Consolas, monospace; }
.uid-usage { color:${C.label}; font-size:12.5px; line-height:1.65; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.uid-caution { color:var(--dsw-alias-state-warn-primary, #fbbf24); font-size:12.5px; line-height:1.65; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.uid-side-actions { flex:0 0 auto; display:flex; flex-direction:column; gap:8px; }
.uid-side-actions .uid-btn { width:100%; }
.uid-editor { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:min(800px, calc(100vw - 48px)); max-height:min(880px, calc(100vh - 60px)); display:flex; flex-direction:column; background:${C.bgBase}; border:1px solid ${C.border1}; border-radius:18px; box-shadow:0 40px 120px rgba(0,0,0,.6); overflow:hidden; z-index:610; }
.uid-editor-head { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid ${C.border1}; flex:0 0 auto; }
.uid-editor-body { padding:16px 18px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; }
.uid-field { display:flex; flex-direction:column; gap:6px; }
.uid-field label { font-size:12px; color:${C.label2}; }
.uid-field input, .uid-field textarea { width:100%; box-sizing:border-box; padding:9px 12px; border-radius:9px; border:1px solid ${C.border1}; background:${C.bg1}; color:${C.label}; font-size:12.5px; outline:none; font-family:inherit; }
.uid-field input:focus, .uid-field textarea:focus { border-color:${C.brand}; }
.uid-field textarea { resize:vertical; line-height:1.6; }
.uid-field .mono { font-family:ui-monospace, Consolas, monospace; font-size:11.5px; }
.uid-editor-foot { display:flex; align-items:center; justify-content:flex-end; gap:10px; padding:14px 18px; border-top:1px solid ${C.border1}; flex:0 0 auto; }
.uid-error { font-size:12px; color:${C.error}; margin-right:auto; }
.uid-empty { padding:52px 0; text-align:center; color:${C.label2}; font-size:13px; }
.uid-empty button { margin-top:14px; }
.uid-pager { display:flex; align-items:center; justify-content:center; gap:4px; padding:22px 0 8px; }
.uid-pg { flex:0 0 auto; min-width:28px; height:28px; padding:0 6px; border-radius:7px; border:0; background:transparent; color:${C.label2}; font-size:12.5px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; }
.uid-pg:hover { background:${C.bg2}; color:${C.label}; }
.uid-pg.cur { background:${C.brand}; color:${C.bgBase}; font-weight:600; }
.uid-pg.nav { padding:0 4px; font-size:15px; }
.uid-pg.nav:disabled { opacity:.35; cursor:default; background:transparent; }
.uid-gap { min-width:28px; text-align:center; color:${C.label2}; font-size:12.5px; }
@media (max-width: 820px) {
  .uid-modal-body { flex-direction:column; }
  .uid-side { flex:0 0 auto; width:100%; max-height:38%; border-left:0; border-top:1px solid ${C.border1}; }
  .uid-demo { min-height:240px; }
  .uid-searchtags { width:200px; }
}
`;

    function useStyles() {
      React.useEffect(() => {
        const id = 'uid-styles';
        if (!document.getElementById(id)) {
          const style = document.createElement('style');
          style.id = id;
          style.textContent = CSS;
          document.head.appendChild(style);
        }
      }, []);
    }

    // ---------- icons ----------
    // Stacked layers: the design-library mark. Deliberately unlike the
    // workbench's "tabbed panel" and the native "More" grid.
    function UiDesignIcon(props) {
      const size = props.size || 20;
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        'aria-hidden': true,
        fill: 'none',
      },
        h('path', { d: 'M12 3.5 20.5 8 12 12.5 3.5 8z', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' }),
        h('path', { d: 'M3.5 11.5 12 16 20.5 11.5', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round', opacity: 0.55 }),
        h('path', { d: 'M3.5 15 12 19.5 20.5 15', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' }),
      );
    }

    // ---------- helpers ----------
    function copyText(value) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(value);
        }
      } catch (_error) {
        /* fall through */
      }
      return new Promise((resolve, reject) => {
        const area = document.createElement('textarea');
        area.value = value;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try {
          ok = document.execCommand('copy');
        } catch (_error) {
          ok = false;
        }
        document.body.removeChild(area);
        if (ok) resolve();
        else reject(new Error('copy failed'));
      });
    }

    function targetBox() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(1120, vw - 56);
      const height = Math.min(800, vh - 72);
      return { left: (vw - width) / 2, top: (vh - height) / 2, width, height, radius: 18 };
    }

    // ---------- theme bridge ----------
    // The demos live in sandboxed iframes, so they cannot inherit the shell's CSS
    // variables. We read the *resolved* values from <body> (the workbench's paper
    // theme is a token override layer on top of light, and future themes will do
    // the same) and inject them into every srcdoc as --ui-* variables. Demos that
    // use var(--ui-*) follow the theme; demos that hard-code colors stay as-is.
    const THEME_TOKEN_MAP = {
      bg: '--dsw-alias-bg-base',
      surface: '--dsw-alias-bg-layer-1',
      'surface-2': '--dsw-alias-bg-layer-2',
      border: '--dsw-alias-border-l1',
      text: '--dsw-alias-label-primary',
      'text-dim': '--dsw-alias-label-secondary',
      brand: '--dsw-alias-brand-primary',
      success: '--dsw-alias-state-success-primary',
      warn: '--dsw-alias-state-warn-primary',
      danger: '--dsw-alias-state-error-primary',
    };

    const THEME_FALLBACK = {
      bg: '#0b0e14',
      surface: '#111827',
      'surface-2': '#1a2238',
      border: '#2a3350',
      text: '#e8eefc',
      'text-dim': '#7d8db3',
      brand: '#6366f1',
      success: '#34d399',
      warn: '#fbbf24',
      danger: '#f87171',
    };

    function readThemeTokens() {
      const tokens = { ...THEME_FALLBACK };
      try {
        const computed = getComputedStyle(document.body);
        for (const key of Object.keys(THEME_TOKEN_MAP)) {
          const value = (computed.getPropertyValue(THEME_TOKEN_MAP[key]) || '').trim();
          if (value) tokens[key] = value;
        }
      } catch (_error) {
        /* keep fallbacks */
      }
      return tokens;
    }

    function themeSignature(tokens) {
      return Object.keys(tokens).map((key) => tokens[key]).join('|');
    }

    function buildSrcDoc(html, tokens, interactive) {
      if (!html) return '';
      const source = tokens || readThemeTokens();
      const css = Object.keys(source)
        .map((key) => '--ui-' + key + ':' + source[key] + ';')
        .join('');
      // Cards get the auto-playing version; the modal is interactive, so demos
      // must not keep cycling and overriding whatever the user is doing.
      const style =
        '<style>:root{' + css + '}' + CURSOR_CSS + '</style>' +
        '<script>window.__uiInteractive=' + (interactive === true ? 'true' : 'false') + ';' + IFRAME_GUARD + CURSOR_JS + '</script>';
      if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, '$&' + style);
      return style + html;
    }

    /**
     * iframe 里的 demo 自动播放时不能把外层页面带走：
     * - scrollIntoView 会把所有祖先框架滚进来 → 禁掉；
     * - focus() 会把焦点从父页面抢走（preventScroll 只防滚动不防失焦）→ 预览模式下 no-op。
     */
    /**
     * iframe 里的 demo 自动播放时不能把外层页面带走：
     * - scrollIntoView 会把所有祖先框架滚进来 → 禁掉；
     * - focus() 会把焦点从父页面抢走（preventScroll 只防滚动不防失焦）→ 预览模式下 no-op；
     * - 程序化 el.click() 点击 input/button 时浏览器会原生聚焦（不走 JS focus）→ 预览里给 body 加 inert，
     *   事件照常触发，但元素不能获得焦点。只拦 focus() 的话，筛选「交互」后几秒就会失焦。
     */
    const IFRAME_GUARD = `
Element.prototype.scrollIntoView=function(){};
(function(){
  var origFocus=Element.prototype.focus;
  Element.prototype.focus=function(){
    if(window.__uiInteractive){ origFocus.call(this,{preventScroll:true}); }
  };
  if(!window.__uiInteractive){
    window.focus=function(){};
    document.addEventListener('DOMContentLoaded',function(){
      if(document.body) document.body.setAttribute('inert','');
    });
  }
})();`;

    // A fake cursor for the auto-play demos: click demos move it, press it and
    // trigger the real click, so the preview shows *how* to interact instead of
    // just snapping between states. Injected into every srcdoc.
    const CURSOR_CSS = `
.demo-cursor{position:fixed;left:0;top:0;width:13px;height:13px;border-radius:50%;background:var(--ui-brand);border:2px solid var(--ui-bg);box-shadow:0 2px 8px rgba(0,0,0,.3);transform:translate(-50%,-50%);transition:left .5s cubic-bezier(.2,.8,.25,1),top .5s cubic-bezier(.2,.8,.25,1),opacity .25s ease;pointer-events:none;z-index:9999;opacity:0}
.demo-cursor.sweeping{transition:none}
.demo-cursor.show{opacity:.92}
.demo-cursor.pressed{transform:translate(-50%,-50%) scale(.72)}
.demo-cursor .ring{position:absolute;inset:-4px;border-radius:50%;border:2px solid var(--ui-brand);opacity:0}
.demo-cursor.pressed .ring{animation:ui-cursor-ring .5s ease-out}
@keyframes ui-cursor-ring{0%{opacity:.85;transform:scale(.5)}100%{opacity:0;transform:scale(1.9)}}
`;

    const CURSOR_JS = `
window.__uiDemoCursor=function(){
  var noop=function(){};
  if(window.__uiInteractive){
    return {el:{classList:{add:noop,remove:noop}},moveTo:noop,at:noop,press:noop,release:noop,hide:noop};
  }
  var el=document.createElement('div');
  el.className='demo-cursor';
  el.innerHTML='<span class="ring"></span>';
  el.style.left='50%';
  el.style.top='50%';
  document.body.appendChild(el);
  var idle=null;
  function poke(){
    el.classList.add('show');
    if(idle) clearTimeout(idle);
    idle=setTimeout(function(){ el.classList.remove('show'); },1200);
  }
  poke();
  return {
    el:el,
    moveTo:function(target){ var r=target.getBoundingClientRect(); el.style.left=(r.left+r.width/2)+'px'; el.style.top=(r.top+r.height/2)+'px'; poke(); },
    at:function(x,y){ var w=window.innerWidth-12,h=window.innerHeight-12; el.style.left=Math.max(12,Math.min(x,w))+'px'; el.style.top=Math.max(12,Math.min(y,h))+'px'; poke(); },
    press:function(){ el.classList.add('pressed'); poke(); },
    release:function(){ el.classList.remove('pressed'); poke(); },
    hide:function(){ el.classList.remove('show'); if(idle){clearTimeout(idle);idle=null;} }
  };
};
`;

    /** Re-reads the theme on html/body attribute changes and on a slow tick. */
    function useThemeTokens() {
      const [tokens, setTokens] = React.useState(readThemeTokens);
      React.useEffect(() => {
        let last = themeSignature(readThemeTokens());
        const bump = () => {
          const next = readThemeTokens();
          const signature = themeSignature(next);
          if (signature !== last) {
            last = signature;
            setTokens(next);
          }
        };
        const observer = new MutationObserver(bump);
        observer.observe(document.documentElement, { attributes: true });
        if (document.body) observer.observe(document.body, { attributes: true });
        const timer = window.setInterval(bump, 800);
        return () => {
          observer.disconnect();
          window.clearInterval(timer);
        };
      }, []);
      return tokens;
    }

    // ---------- pager（按知识库里「分页导航」那套：页码窗口跟当前页走） ----------
    function pagerPages(cur, total) {
      if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
      if (cur <= 4) return [1, 2, 3, 4, 5, 'gap', total];
      if (cur >= total - 3) return [1, 'gap', total - 4, total - 3, total - 2, total - 1, total];
      return [1, 'gap', cur - 1, cur, cur + 1, 'gap', total];
    }

    function Pager(props) {
      const { page, totalPages, onChange } = props;
      return h('nav', { className: 'uid-pager', 'aria-label': '分页' },
        h('button', {
          className: 'uid-pg nav',
          disabled: page <= 1,
          'aria-label': '上一页',
          onClick: () => onChange(Math.max(1, page - 1)),
        }, '‹'),
        pagerPages(page, totalPages).map((item, index) => item === 'gap'
          ? h('span', { className: 'uid-gap', key: 'gap-' + index }, '…')
          : h('button', {
            className: 'uid-pg' + (item === page ? ' cur' : ''),
            key: item,
            'aria-current': item === page ? 'page' : undefined,
            onClick: () => onChange(item),
          }, String(item))),
        h('button', {
          className: 'uid-pg nav',
          disabled: page >= totalPages,
          'aria-label': '下一页',
          onClick: () => onChange(Math.min(totalPages, page + 1)),
        }, '›'),
      );
    }

    // ---------- lazy preview ----------
    // 列表只拿元数据；demo 在卡片进入视口附近时才按 id 取，离开视口就卸载 iframe。
    function PreviewFrame(props) {
      const ref = React.useRef(null);
      const [visible, setVisible] = React.useState(false);
      const [demo, setDemo] = React.useState('');
      const designId = props.design.id;

      React.useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        if (typeof IntersectionObserver !== 'function') {
          setVisible(true);
          return undefined;
        }
        const io = new IntersectionObserver((entries) => {
          setVisible(entries.some((entry) => entry.isIntersecting));
        }, { rootMargin: '300px' });
        io.observe(el);
        return () => io.disconnect();
      }, []);

      React.useEffect(() => {
        if (!visible || demo) return undefined;
        let alive = true;
        fetch(GET_URL + '?id=' + encodeURIComponent(designId), { cache: 'no-store' })
          .then((res) => res.json())
          .then((json) => {
            if (alive && json.ok && json.design) setDemo(json.design.demoHtml || '');
          })
          .catch(() => {});
        return () => {
          alive = false;
        };
      }, [visible, demo, designId]);

      return h('div', { className: 'uid-preview', ref },
        visible && demo
          ? h('iframe', {
            srcDoc: buildSrcDoc(demo, props.tokens, false),
            sandbox: 'allow-scripts',
            scrolling: 'no',
            title: props.design.name,
            loading: 'lazy',
          })
          : h('div', { className: 'uid-skel' }),
      );
    }

    // ---------- card ----------
    function DesignCard(props) {
      const design = props.design;
      const open = () => props.onOpen(design);
      return h('article', {
        className: 'uid-card',
        'data-uid-card': design.id,
        tabIndex: 0,
        role: 'button',
        'aria-label': '打开设计：' + design.name,
        onClick: open,
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        },
      },
        h(PreviewFrame, { design, tokens: props.tokens }),
        h('div', { className: 'uid-cardbody' },
          h('div', { className: 'uid-name' }, design.name),
          design.summary ? h('div', { className: 'uid-summary' }, design.summary) : null,
          h('div', { className: 'uid-cardmeta' },
            design.tags.map((tag) => h('span', { className: 'uid-tag', key: tag }, tag)),
            h('span', { className: 'uid-cue' }, '点击体验 →'),
          ),
        ),
      );
    }

    // ---------- detail modal (FLIP from the card) ----------
    function DetailModal(props) {
      const { design, sourceRect, onClose } = props;
      const [box, setBox] = React.useState(() => sourceRect || targetBox());
      const [open, setOpen] = React.useState(false);
      const closingRef = React.useRef(false);
      const [copied, setCopied] = React.useState('');

      const close = React.useCallback(() => {
        if (closingRef.current) return;
        closingRef.current = true;
        setOpen(false);
        const el = document.querySelector('[data-uid-card="' + design.id + '"]');
        const rect = el ? el.getBoundingClientRect() : sourceRect;
        if (rect) {
          setBox({ left: rect.left, top: rect.top, width: rect.width, height: rect.height, radius: 16 });
        }
        window.setTimeout(() => onClose(), 260);
      }, [design.id, onClose, sourceRect]);

      React.useEffect(() => {
        const raf = requestAnimationFrame(() => {
          setBox(targetBox());
          setOpen(true);
        });
        const onKey = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            close();
          }
        };
        const onResize = () => {
          if (!closingRef.current) setBox(targetBox());
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', onResize);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          cancelAnimationFrame(raf);
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('resize', onResize);
          document.body.style.overflow = previous;
        };
      }, [close]);

      const copyPrompt = () => {
        copyText(design.prompt).then(
          () => {
            setCopied('已复制');
            window.setTimeout(() => setCopied(''), 1600);
          },
          () => setCopied('复制失败，手动选中试试'),
        );
      };

      return ReactDOM.createPortal(
        h('div', {
          className: 'uid-overlay' + (open ? ' open' : ''),
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) close();
          },
        },
          h('div', {
            className: 'uid-modal',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': design.name,
            style: {
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              borderRadius: box.radius,
            },
            onMouseDown: (event) => event.stopPropagation(),
          },
            h('div', { className: 'uid-modal-head' },
              h('div', { style: { minWidth: 0, flex: '1 1 auto' } },
                h('div', { className: 'uid-modal-title' }, design.name),
                h('div', { className: 'uid-modal-sub' },
                  design.tags.join(' · ') || '无 tag',
                  design.summary ? ' · ' + design.summary : '',
                ),
              ),
              h('button', {
                className: 'uid-iconbtn',
                title: '关闭（Esc）',
                'aria-label': '关闭',
                onClick: close,
              }, '✕'),
            ),
            h('div', { className: 'uid-modal-body' + (open ? ' open' : '') },
              h('div', { className: 'uid-demo-col' },
                h('div', { className: 'uid-demo' },
                  h('iframe', {
                    srcDoc: buildSrcDoc(design.demoHtml, props.tokens, true),
                    sandbox: 'allow-scripts',
                    title: design.name + ' 演示',
                  }),
                ),
                design.hint ? h('div', { className: 'uid-hint-bar' },
                  h('b', null, '操作提示'),
                  h('span', null, design.hint),
                ) : null,
              ),
              h('aside', { className: 'uid-side' },
                h('div', { className: 'uid-side-scroll' },
                  design.summary ? h('p', null, design.summary) : null,
                  design.usage ? h('div', null,
                    h('h4', null, '适用场景'),
                    h('p', { className: 'uid-usage' }, design.usage),
                  ) : null,
                  design.caution ? h('div', null,
                    h('h4', null, '不适用'),
                    h('p', { className: 'uid-caution' }, design.caution),
                  ) : null,
                  h('div', null,
                    h('h4', null, '实现提示词'),
                    h('pre', { className: 'uid-prompt' }, design.prompt),
                  ),
                ),
                h('div', { className: 'uid-side-actions' },
                  h('button', { className: 'uid-btn', onClick: copyPrompt }, copied || '复制提示词'),
                  h('button', { className: 'uid-btn', onClick: () => props.onEdit(design) }, '编辑'),
                  h('button', { className: 'uid-btn danger', onClick: () => props.onDelete(design) }, '删除'),
                ),
              ),
            ),
          ),
        ),
        document.body,
      );
    }

    // ---------- editor ----------
    function EditorModal(props) {
      const editing = props.design || null;
      const [form, setForm] = React.useState({
        name: editing ? editing.name : '',
        tags: editing ? editing.tags.join(', ') : '',
        summary: editing ? editing.summary : '',
        usage: editing ? editing.usage : '',
        caution: editing ? editing.caution : '',
        hint: editing ? editing.hint : '',
        prompt: editing ? editing.prompt : '',
        demoHtml: editing ? editing.demoHtml : '',
      });
      const [error, setError] = React.useState('');
      const [busy, setBusy] = React.useState(false);

      const set = (field) => (event) => {
        const value = event.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
      };

      const submit = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        const body = {
          name: form.name.trim(),
          tags: form.tags.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean),
          summary: form.summary.trim(),
          usage: form.usage.trim(),
          caution: form.caution.trim(),
          hint: form.hint.trim(),
          prompt: form.prompt,
          demoHtml: form.demoHtml,
        };
        if (editing) body.id = editing.id;
        try {
          const res = await fetch(editing ? UPDATE_URL : CREATE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || '保存失败');
          props.onSaved(json.design);
        } catch (err) {
          setError(err && err.message ? err.message : '保存失败');
        } finally {
          setBusy(false);
        }
      };

      React.useEffect(() => {
        const onKey = (event) => {
          if (event.key === 'Escape') props.onCancel();
        };
        window.addEventListener('keydown', onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          window.removeEventListener('keydown', onKey);
          document.body.style.overflow = previous;
        };
      }, [props]);

      return ReactDOM.createPortal(
        h('div', {
          className: 'uid-overlay open',
          onMouseDown: (event) => {
            if (event.target === event.currentTarget) props.onCancel();
          },
          style: { zIndex: 605 },
        },
          h('div', {
            className: 'uid-editor',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': editing ? '编辑设计' : '新建设计',
            onMouseDown: (event) => event.stopPropagation(),
          },
            h('div', { className: 'uid-editor-head' },
              h('div', { className: 'uid-modal-title' }, editing ? '编辑「' + editing.name + '」' : '新建设计'),
              h('button', { className: 'uid-iconbtn', onClick: props.onCancel, 'aria-label': '关闭' }, '✕'),
            ),
            h('div', { className: 'uid-editor-body' },
              h('div', { className: 'uid-field' },
                h('label', null, '设计名 *'),
                h('input', { value: form.name, onChange: set('name'), placeholder: '例如：下拉导航菜单' }),
              ),
              h('div', { className: 'uid-field' },
                h('label', null, 'tag（逗号分隔）'),
                h('input', { value: form.tags, onChange: set('tags'), placeholder: '导航, 展开' }),
              ),
              h('div', { className: 'uid-field' },
                h('label', null, '一句话说明'),
                h('input', { value: form.summary, onChange: set('summary'), placeholder: '显示在卡片上的一句话' }),
              ),
              h('div', { className: 'uid-field' },
                h('label', null, '适用场景（建议填写，≤120 字）'),
                h('input', { value: form.usage, onChange: set('usage'), maxLength: 120, placeholder: '什么情况下该用这套设计' }),
              ),
              h('div', { className: 'uid-field' },
                h('label', null, '不适用场景（建议填写，≤120 字）'),
                h('input', { value: form.caution, onChange: set('caution'), maxLength: 120, placeholder: '什么情况下别用、有什么限制' }),
              ),
        h('div', { className: 'uid-field' },
          h('label', null, '操作提示（可选，≤80 字，显示在演示区外）'),
          h('input', { value: form.hint, onChange: set('hint'), maxLength: 80, placeholder: '例如：点击「产品」展开；Esc 关闭' }),
        ),
        h('div', { className: 'uid-field' },
          h('label', null, '实现提示词 *（AI 拿到的就是这段）'),
                h('textarea', {
                  className: 'mono',
                  value: form.prompt,
                  onChange: set('prompt'),
                  rows: 7,
                  placeholder: '结构 / 动画参数 / 交互 / 无障碍 / 坑',
                }),
              ),
              h('div', { className: 'uid-field' },
                h('label', null, '演示 demo（完整 HTML，含样式与脚本）*'),
                h('textarea', {
                  className: 'mono',
                  value: form.demoHtml,
                  onChange: set('demoHtml'),
                  rows: 12,
                  placeholder: '<!doctype html> … </html>',
                }),
              ),
            ),
            h('div', { className: 'uid-editor-foot' },
              error ? h('span', { className: 'uid-error' }, error) : null,
              h('button', { className: 'uid-btn ghost', onClick: props.onCancel }, '取消'),
              h('button', { className: 'uid-btn primary', onClick: submit, disabled: busy }, busy ? '保存中…' : '保存'),
            ),
          ),
        ),
        document.body,
      );
    }

    // ---------- the view ----------
    function UiDesignView() {
      useStyles();
      const [data, setData] = React.useState({ designs: [], tags: [], total: 0, loading: true, error: '' });
      const [searchInput, setSearchInput] = React.useState('');
      const [query, setQuery] = React.useState('');
      const [tagWords, setTagWords] = React.useState([]);
      const [dupMsg, setDupMsg] = React.useState('');
      const [activeTag, setActiveTag] = React.useState('all');
      const [offset, setOffset] = React.useState(0);
      const [opened, setOpened] = React.useState(null);
      const [editing, setEditing] = React.useState(null);
      const [editorOpen, setEditorOpen] = React.useState(false);
      const themeTokens = useThemeTokens();

      // 输入防抖 300ms 再发请求
      React.useEffect(() => {
        const timer = window.setTimeout(() => setQuery(searchInput.trim()), 300);
        return () => window.clearTimeout(timer);
      }, [searchInput]);

      // 搜索词 / tag 变了回到第一页
      React.useEffect(() => { setOffset(0); }, [query, activeTag]);

      const addTagWord = React.useCallback(() => {
        const word = searchInput.trim().replace(/[,，]$/, '');
        if (!word) return;
        if (tagWords.includes(word)) {
          // 和 demo 一致：重复忽略 + 轻抖 + 边框闪一下
          const box = document.querySelector('.uid-searchtags');
          if (box) {
            if (box.animate) {
              box.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(3px)' },
                { transform: 'translateX(0)' },
              ], { duration: 220, easing: 'ease-out' });
            }
            box.classList.add('dup');
            window.setTimeout(() => box.classList.remove('dup'), 600);
          }
          setSearchInput('');
          setQuery('');
          setDupMsg('已经有「' + word + '」这个标签了');
          window.setTimeout(() => setDupMsg(''), 1600);
          return;
        }
        setTagWords((prev) => prev.concat(word));
        setSearchInput('');
        setQuery('');
      }, [searchInput, tagWords]);

      const removeTagWord = React.useCallback((word) => {
        setTagWords((prev) => prev.filter((item) => item !== word));
      }, []);

      const load = React.useCallback(async () => {
        try {
          const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
          const q = (tagWords.join(' ') + ' ' + query).trim();
          if (q) params.set('q', q);
          if (activeTag !== 'all') params.set('tag', activeTag);
          const res = await fetch(LIST_URL + '?' + params.toString(), { cache: 'no-store' });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || '接口错误');
          setData({
            designs: json.designs || [],
            tags: json.tags || [],
            total: json.total || 0,
            loading: false,
            error: '',
          });
        } catch (err) {
          setData((prev) => ({
            ...prev,
            loading: false,
            error: (err && err.message) || '连不上模块端点（/ui-design/list）',
          }));
        }
      }, [query, activeTag, offset]);

      React.useEffect(() => { load(); }, [load]);

      // 列表只有元数据，点开时再取完整设计
      const openDesign = React.useCallback(async (meta) => {
        const el = document.querySelector('[data-uid-card="' + meta.id + '"]');
        const rect = el ? el.getBoundingClientRect() : null;
        try {
          const res = await fetch(GET_URL + '?id=' + encodeURIComponent(meta.id), { cache: 'no-store' });
          const json = await res.json();
          if (!json.ok || !json.design) throw new Error(json.error || '取设计失败');
          setOpened({ design: json.design, rect });
        } catch (err) {
          window.alert((err && err.message) || '取设计失败');
        }
      }, []);

      const removeDesign = async (design) => {
        if (!window.confirm('确定删除「' + design.name + '」？这个操作不能撤销。')) return;
        try {
          const res = await fetch(DELETE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: design.id }),
          });
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || '删除失败');
          setOpened(null);
          load();
        } catch (err) {
          window.alert((err && err.message) || '删除失败');
        }
      };

      const total = data.total;
      const page = Math.floor(offset / PAGE_SIZE) + 1;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const tagChips = [{ tag: 'all', count: total }].concat(data.tags);

      return h('div', { className: 'uid-page' },
        h('div', { className: 'uid-head' },
          h('div', null,
            h('h2', { className: 'uid-title' }, 'UI 设计'),
            h('div', { className: 'uid-sub' },
              '前端知识库 · ' + total + ' 项设计 · ' + data.tags.length + ' 个 tag' +
              (data.loading ? ' · 加载中…' : ''),
            ),
          ),
          h('div', { className: 'uid-actions' },
            h('div', { className: 'uid-searchtags', role: 'group', 'aria-label': '搜索条件' },
              tagWords.map((word) => h('span', { className: 'uid-tagchip', key: word },
                word,
                h('button', {
                  className: 'x',
                  type: 'button',
                  'aria-label': '移除 ' + word,
                  onClick: () => removeTagWord(word),
                }, '×'),
              )),
              h('input', {
                className: 'uid-search',
                value: searchInput,
                onChange: (event) => setSearchInput(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter' || event.key === ',' || event.key === '，') {
                    event.preventDefault();
                    addTagWord();
                  } else if (event.key === 'Backspace' && !searchInput && tagWords.length) {
                    setTagWords((prev) => prev.slice(0, -1));
                    setQuery('');
                  }
                },
                placeholder: dupMsg || (tagWords.length ? '继续添加…' : '搜索设计名 / tag / 场景…'),
                'aria-label': '搜索设计',
                autoComplete: 'off',
                autoCapitalize: 'off',
                spellCheck: false,
              }),
            ),
            h('button', { className: 'uid-btn ghost', onClick: load }, '刷新'),
            h('button', {
              className: 'uid-btn primary',
              onClick: () => {
                setEditing(null);
                setEditorOpen(true);
              },
            }, '+ 新建设计'),
          ),
        ),

        h('div', { className: 'uid-chips' },
          tagChips.map((item) => h('button', {
            key: item.tag,
            className: 'uid-chip' + (activeTag === item.tag ? ' active' : ''),
            onClick: () => setActiveTag(item.tag),
          },
            item.tag === 'all' ? '全部' : item.tag,
            h('span', { className: 'n' }, item.count),
          )),
        ),

        h('div', { className: 'uid-note' },
          '做前端时 agent 会先按场景搜这里；也可以直接说「以（设计名）的形式实现」。新建设计说「新建一个设计：……」，会先读《设计规范》再用 ',
          h('code', null, 'ui_design'),
          ' 写进来。',
        ),

        data.error
          ? h('div', { className: 'uid-empty' },
            data.error,
            h('div', { style: { marginTop: 14 } },
              h('button', { className: 'uid-btn', onClick: load }, '重试'),
            ),
          )
          : data.loading && data.designs.length === 0
            ? h('div', { className: 'uid-empty' }, '加载中…')
            : data.designs.length === 0
              ? h('div', { className: 'uid-empty' },
                '没有匹配的设计。',
                h('div', { style: { marginTop: 14 } },
                  h('button', {
                    className: 'uid-btn',
                    onClick: () => {
                      setSearchInput('');
                      setActiveTag('all');
                    },
                  }, '清空筛选'),
                ),
              )
              : h('div', { className: 'uid-grid' },
                data.designs.map((design) => h(DesignCard, {
                  key: design.id,
                  design,
                  tokens: themeTokens,
                  onOpen: openDesign,
                })),
              ),

        total > PAGE_SIZE
          ? h(Pager, {
            page,
            totalPages,
            onChange: (target) => setOffset((target - 1) * PAGE_SIZE),
          })
          : null,

        opened
          ? h(DetailModal, {
            design: opened.design,
            tokens: themeTokens,
            sourceRect: opened.rect,
            onClose: () => setOpened(null),
            onEdit: (design) => {
              setOpened(null);
              setEditing(design);
              setEditorOpen(true);
            },
            onDelete: removeDesign,
          })
          : null,

        editorOpen
          ? h(EditorModal, {
            design: editing,
            onCancel: () => setEditorOpen(false),
            onSaved: () => {
              setEditorOpen(false);
              setEditing(null);
              load();
            },
          })
          : null,
      );
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        let mounted = false;

        // 没有工作台：第一行系统栏图标 + main.key 页面（和内置面板同一种发布方式）
        const standalone = () => {
          if (mounted) return;
          mounted = true;
          ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
            name: 'sidebar.panellist',
            id: VIEW_ID,
            order: 50,
            label: 'UI设计',
          }, UiDesignIcon)), 'ui-design: sidebar entry');
          ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register(
            { name: 'main', key: VIEW_ID }, UiDesignView,
          )), 'ui-design: main view');
        };

        // 有工作台：入口在工作台第二行 tab
        const useWorkbench = (api) => {
          if (mounted || !api || api.apiVersion !== 1) return;
          mounted = true;
          ctx.effect(() => api.registerView({
            id: VIEW_ID,
            title: 'UI设计',
            subtitle: '前端设计知识库：tag 筛选、可交互 demo、给 AI 的提示词',
            icon: UiDesignIcon,
            component: UiDesignView,
            order: 50,
          }), 'ui-design: workbench view');
        };

        // 外壳可能晚于本模块 apply：先轮询等 workbench 服务，1.5 秒还没出现就走独立形态
        const startedAt = Date.now();
        const waitForWorkbench = () => {
          if (mounted) return;
          const api = ctx.get('workbench');
          if (api) {
            useWorkbench(api);
            return;
          }
          if (Date.now() - startedAt > 1500) {
            standalone();
            return;
          }
          setTimeout(waitForWorkbench, 100);
        };
        waitForWorkbench();
      },
    };
  },
});
