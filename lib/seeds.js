/**
 * 内置设计种子。
 *
 * 每项设计 = 一张卡片（名字 + tag + 演示动画）+ 一套给 AI 用的提示词 + 一份
 * 可交互的 self-contained demo（iframe srcdoc 渲染，沙箱 allow-scripts）。
 *
 * 约定：
 * - demoHtml 必须是完整 HTML 文档，自己带样式，不依赖外层主题；
 * - 配色一律用 `--ui-*` 变量（父页面按当前 DSH 主题注入，见 client.js 的
 *   buildSrcDoc），不要写死深色值——深色/浅色/纸质/以后的新主题都能适配；
 * - demo 里放循环动画，卡片预览才看得出「演示」；
 * - 只使用普通 DOM / CSS，不访问 localStorage、cookie、父页面。
 */

export const SEED_DESIGNS = [
  {
    id: "dropdown-nav",
    name: "下拉导航菜单",
    tags: ["导航", "展开"],
    summary: "顶部导航点开二级面板：上浮淡入 + 箭头旋转，点击外部或 Esc 关闭。",
    hint: "点击「产品」展开 · Esc / 点击空白关闭",
    usage: "顶部导航的多级入口（产品/文档/设置）；层级浅、选项 3–8 个。",
    caution: "选项超过 12 个（改用 mega menu 或二级页）；需要在面板里搜索/筛选；移动端（改用抽屉或底部菜单）。",
    prompt: [
      "【下拉导航菜单】目标：顶部/悬浮导航条。点击（或 hover）「产品」在下方展开二级面板，带轻微上浮 + 淡入 + 缩放进入，chevron 旋转 180°。",
      "1) 结构：nav.nav > .item > button + .panel。.item 用 position:relative；.panel 绝对定位 top:calc(100% + 10px)、min-width 220px、padding 8px。",
      "2) 动画：.panel 默认 opacity:0; transform:translateY(-6px) scale(.98); pointer-events:none。打开态 .item.open .panel { opacity:1; transform:none; pointer-events:auto }。transition: opacity .18s ease, transform .22s cubic-bezier(.2,.8,.25,1)。",
      "3) 交互：点击触发按钮 toggle；点击面板外部关闭；chevron 用 transform:rotate(180deg) 跟随 open；面板内项 hover 用 surface-2 提亮。",
      "4) 无障碍：按钮加 aria-haspopup=\"menu\" 与 aria-expanded；面板 role=\"menu\"，项 role=\"menuitem\"；Esc 关闭并把焦点还给按钮；Tab 可进入面板项。",
      "5) 坑：不要用 display:none 切换（无法过渡）；用 pointer-events 控制交互；面板不要超出视口右边（小屏时改 left:auto; right:0）。",
      "6) 配色：用 --ui-bg / --ui-surface / --ui-surface-2 / --ui-border / --ui-text / --ui-text-dim / --ui-brand，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(1100px 560px at 25% -10%,color-mix(in srgb,var(--ui-brand) 16%,transparent),transparent 62%),var(--ui-bg)}
.nav{display:flex;gap:4px;align-items:center;padding:8px;border-radius:16px;background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:0 24px 70px rgba(0,0,0,.22)}
.item{position:relative;flex:0 0 auto}
.item>button{appearance:none;border:0;background:transparent;color:var(--ui-text-dim);font-size:14px;padding:10px 15px;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;transition:background .18s,color .18s}
.item>button:hover,.item.open>button{background:var(--ui-surface-2);color:var(--ui-text)}
.item>button.pressing{transform:scale(.96)}
.chev{font-size:9px;opacity:.7;transition:transform .2s ease}
.item.open .chev{transform:rotate(180deg)}
.panel{position:absolute;top:calc(100% + 10px);left:0;min-width:236px;padding:8px;border-radius:14px;background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:0 26px 70px rgba(0,0,0,.3);opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .22s cubic-bezier(.2,.8,.25,1)}
.item.open .panel{opacity:1;transform:none;pointer-events:auto}
.panel a{display:block;padding:10px 12px;border-radius:10px;color:var(--ui-text);text-decoration:none;font-size:13px;transition:background .15s}
.panel a:hover{background:var(--ui-surface-2)}
.panel b{display:block;font-weight:600}
.panel small{display:block;margin-top:2px;font-size:11px;color:var(--ui-text-dim)}
@media (max-height:420px){}
</style></head>
<body>
<nav class="nav" id="nav">
  <div class="item"><button>首页</button></div>
  <div class="item" id="autoItem"><button aria-haspopup="menu" aria-expanded="false">产品 <span class="chev">▼</span></button>
    <div class="panel" role="menu">
      <a href="#" role="menuitem"><b>设计系统</b><small>组件、token 与规范</small></a>
      <a href="#" role="menuitem"><b>数据看板</b><small>实时指标与告警</small></a>
      <a href="#" role="menuitem"><b>团队协作</b><small>权限、评论与审批</small></a>
    </div>
  </div>
  <div class="item"><button>文档</button></div>
  <div class="item"><button>价格</button></div>
</nav>
<script>
(function(){
  var nav=document.getElementById('nav'),autoItem=document.getElementById('autoItem');
  var btn=autoItem.querySelector('button'),timer=null;
  function setOpen(on){
    autoItem.classList.toggle('open',on);
    btn.setAttribute('aria-expanded',on?'true':'false');
  }
  var cursor=window.__uiDemoCursor && window.__uiDemoCursor();
  function demo(){
    cursor.moveTo(btn);
    setTimeout(function(){
      cursor.press(); btn.classList.add('pressing');
      setTimeout(function(){ cursor.release(); btn.classList.remove('pressing'); setOpen(true); },190);
    },560);
    setTimeout(function(){ setOpen(false); },2600);
  }
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  function start(){ stop(); demo(); timer=setInterval(demo,4200); }
  function restart(){ if(!window.__uiInteractive) start(); }
  restart();
  nav.addEventListener('mouseenter',stop);
  nav.addEventListener('mouseleave',restart);
  document.addEventListener('click',function(e){
    if(!nav.contains(e.target)){ setOpen(false); return; }
    if(e.target.closest('#autoItem')){ stop(); setOpen(!autoItem.classList.contains('open')); }
  });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ setOpen(false); restart(); } });
})();
</script>
</body></html>`,
  },

  {
    id: "center-modal",
    name: "居中弹窗",
    tags: ["弹窗"],
    summary: "遮罩淡入 + 弹窗上浮回弹，Esc / 点遮罩关闭，焦点锁在弹窗内。",
    hint: "遮罩淡入 + 弹窗上浮回弹 · Esc / 点遮罩关闭",
    usage: "破坏性操作确认、表单填写、需要用户集中注意力的提示。",
    caution: "高频轻量反馈（用 Toast）；可延后阅读的信息；会打断用户连续操作的任务。",
    prompt: [
      "【居中弹窗】目标：点击按钮打开居中对话框，遮罩淡入，弹窗从 0.94 倍 + 下移 14px 弹到原位（带一点回弹），关闭反向。",
      "1) 结构：.backdrop 固定铺满（color-mix(in srgb, var(--ui-bg) 72%, transparent) + backdrop-filter:blur(6px)），.dialog 固定居中（left/top 50% + translate(-50%,-50%)），宽 min(440px, calc(100vw - 48px))。",
      "2) 入场：opacity 0→1 .22s；transform 从 translate(-50%,-50%) translateY(14px) scale(.94) 到 translate(-50%,-50%)，曲线 cubic-bezier(.2,.9,.25,1.06)（回弹）。遮罩只过渡 opacity。",
      "3) 交互：Esc 关闭；点遮罩关闭（onMouseDown 判断 target===currentTarget）；点弹窗内部不关。打开时 body overflow:hidden，关闭恢复。",
      "4) 无障碍：role=\"dialog\" aria-modal=\"true\" aria-labelledby 指向标题；打开时把焦点移到弹窗内第一个可聚焦元素，关闭还给触发按钮；Tab 循环限制在弹窗内。",
      "5) 坑：不要给遮罩加 display:none；关闭动画结束前不要卸载（setTimeout 250ms）；按钮 hover 用 translateY(-2px) + 阴影加强，别用颜色突变。",
      "6) 配色：用 --ui-bg / --ui-surface / --ui-border / --ui-text / --ui-text-dim / --ui-brand，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(1000px 540px at 70% 0%,color-mix(in srgb,var(--ui-brand) 18%,transparent),transparent 62%),var(--ui-bg);display:flex;align-items:center;justify-content:center}
.openbtn{appearance:none;border:0;cursor:pointer;font-size:15px;font-weight:600;color:var(--ui-bg);padding:14px 26px;border-radius:12px;background:var(--ui-brand);background:linear-gradient(135deg,color-mix(in srgb,var(--ui-brand) 72%,#fff),var(--ui-brand));box-shadow:0 16px 44px rgba(0,0,0,.28);transition:transform .18s,box-shadow .18s}
.openbtn:hover{transform:translateY(-2px);box-shadow:0 22px 56px rgba(0,0,0,.34)}
.openbtn.pressing{transform:scale(.96)}
.backdrop{position:fixed;inset:0;background:color-mix(in srgb,var(--ui-bg) 66%,transparent);backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .22s ease}
.backdrop.show{opacity:1;pointer-events:auto}
.dialog{position:fixed;left:50%;top:50%;width:min(440px,calc(100vw - 48px));padding:26px;border-radius:18px;background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:0 40px 110px rgba(0,0,0,.35);opacity:0;pointer-events:none;transform:translate(-50%,-50%) translateY(14px) scale(.94);transition:opacity .22s ease,transform .26s cubic-bezier(.2,.9,.25,1.06)}
.dialog.show{opacity:1;pointer-events:auto;transform:translate(-50%,-50%)}
.icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--ui-brand) 16%,transparent);color:var(--ui-brand);font-size:20px;margin-bottom:14px}
h3{margin:0 0 8px;font-size:18px;color:var(--ui-text)}
p{margin:0;font-size:13px;line-height:1.7;color:var(--ui-text-dim)}
.actions{display:flex;gap:10px;justify-content:flex-end;margin-top:22px}
.btn{appearance:none;cursor:pointer;font-size:13px;padding:10px 16px;border-radius:10px;border:1px solid var(--ui-border);background:transparent;color:var(--ui-text-dim);transition:.16s}
.btn:hover{background:var(--ui-surface-2);color:var(--ui-text)}
.btn.primary{background:var(--ui-brand);border-color:var(--ui-brand);color:var(--ui-bg)}
.btn.primary:hover{filter:brightness(1.1)}
@media (max-height:420px){}
</style></head>
<body>
<button class="openbtn" id="open">打开弹窗</button>
<div class="backdrop" id="backdrop"></div>
<div class="dialog" id="dialog" role="dialog" aria-modal="true" aria-labelledby="title">
  <div class="icon">✦</div>
  <h3 id="title">删除这条记录？</h3>
  <p>删除后无法恢复。相关的附件和评论会一并清除，请确认后继续。</p>
  <div class="actions">
    <button class="btn" id="cancel">取消</button>
    <button class="btn primary" id="ok">确认删除</button>
  </div>
</div>
<script>
(function(){
  var open=document.getElementById('open'),backdrop=document.getElementById('backdrop'),dialog=document.getElementById('dialog');
  var timer=null;
  function show(){ backdrop.classList.add('show'); dialog.classList.add('show'); }
  function hide(){ backdrop.classList.remove('show'); dialog.classList.remove('show'); }
  var cursor=window.__uiDemoCursor && window.__uiDemoCursor();
  function demo(){
    cursor.moveTo(open);
    setTimeout(function(){
      cursor.press(); open.classList.add('pressing');
      setTimeout(function(){ cursor.release(); open.classList.remove('pressing'); show(); },190);
    },560);
    setTimeout(function(){ hide(); },3400);
  }
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  function start(){ stop(); demo(); timer=setInterval(demo,4400); }
  function restart(){ if(!window.__uiInteractive) start(); }
  restart();
  open.addEventListener('click',function(){ stop(); show(); });
  backdrop.addEventListener('click',function(){ hide(); restart(); });
  document.getElementById('cancel').addEventListener('click',function(){ hide(); restart(); });
  document.getElementById('ok').addEventListener('click',function(){ hide(); restart(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ hide(); } });
})();
</script>
</body></html>`,
  },

  {
    id: "drag-sort",
    name: "拖拽排序卡片",
    tags: ["拖拽", "交互"],
    summary: "指针按住卡片上下拖动，其余卡片即时让位，松手落位并高亮当前卡。",
    hint: "按住卡片拖动，松手落位",
    usage: "用户自定义顺序（看板、播放列表、任务优先级）；桌面端为主。",
    caution: "顺序由业务规则决定（按时间/分数）；卡片很多（>20）时一屏放不下；移动端小屏（改用长按 + 弹层）。",
    prompt: [
      "【拖拽排序卡片】目标：纵向列表可拖拽重排。按住卡片开始拖（放大 1.04 倍 + 强阴影 + grab 光标），拖动到某张卡片中线以上就插到它前面，松手落位。",
      "1) 结构：.list（display:flex; column）> .card；卡片含 grip 图标、标题、副标题、右侧头像。",
      "2) 拖拽：pointerdown 把卡片改 position:fixed 跟随指针（left/top = 指针 - 抓取偏移），原位置插同高占位 div；pointermove 更新 fixed 坐标并遍历其它卡片找第一个「指针 y < 卡片中线」的作为 after，把占位挪到它前面；pointerup 把卡片插回占位、清掉 fixed 样式与占位。拖拽中的卡片要 pointer-events:none，否则会挡住指针事件。",
      "3) 样式：.dragging { transform:scale(1.04); box-shadow:0 24px 60px rgba(0,0,0,.35); border-color:color-mix(in srgb,var(--ui-brand) 55%,transparent); background:var(--ui-surface-2); z-index:5; cursor:grabbing }。其它卡片 transition transform/box-shadow .18s。",
      "4) 无障碍：给每张卡加 tabindex=\"0\" + aria-grabbed；Alt+↑/↓ 键盘移动；拖拽时 aria-live 播报当前顺序。",
      "5) 坑：pointermove 必须节流（requestAnimationFrame）；不要在 pointermove 里反复读 offsetTop（用 getBoundingClientRect）；移动端要 touch-action:none 防止滚动抢手势。",
      "6) 配色：用 --ui-surface / --ui-surface-2 / --ui-border / --ui-text / --ui-text-dim / --ui-brand，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(900px 520px at 10% 10%,color-mix(in srgb,var(--ui-brand) 14%,transparent),transparent 60%),var(--ui-bg);padding:34px;display:flex;flex-direction:column;gap:14px;align-items:center}
.title{font-size:13px;color:var(--ui-text-dim);letter-spacing:.08em}
.list{width:min(420px,100%);display:flex;flex-direction:column;gap:10px;touch-action:none}
.card{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;background:var(--ui-surface);border:1px solid var(--ui-border);cursor:grab;user-select:none;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
.card:hover{background:var(--ui-surface-2)}
.card.dragging{position:fixed;z-index:20;margin:0;cursor:grabbing;transform:scale(1.04);box-shadow:0 26px 70px rgba(0,0,0,.35);border-color:color-mix(in srgb,var(--ui-brand) 55%,transparent);background:var(--ui-surface-2);transition:none;pointer-events:none}
.card.placeholder{background:color-mix(in srgb,var(--ui-brand) 7%,transparent);border:1px dashed color-mix(in srgb,var(--ui-brand) 45%,transparent);box-shadow:none;cursor:default}
.grip{width:18px;color:var(--ui-text-dim);flex:0 0 auto;font-size:12px;letter-spacing:-2px}
.card b{font-size:14px;font-weight:600;color:var(--ui-text)}
.card small{display:block;font-size:11px;color:var(--ui-text-dim);margin-top:2px}
.avatar{margin-left:auto;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,color-mix(in srgb,var(--ui-brand) 55%,#fff),var(--ui-brand));flex:0 0 auto}
@media (max-height:420px){}
</style></head>
<body>
<div class="title">拖拽卡片调整顺序</div>
<div class="list" id="list">
  <div class="card"><span class="grip">⠿</span><div><b>需求评审</b><small>周四 · 10:00</small></div><span class="avatar"></span></div>
  <div class="card"><span class="grip">⠿</span><div><b>视觉稿确认</b><small>周四 · 14:30</small></div><span class="avatar"></span></div>
  <div class="card"><span class="grip">⠿</span><div><b>前端联调</b><small>周五 · 09:30</small></div><span class="avatar"></span></div>
  <div class="card"><span class="grip">⠿</span><div><b>上线发布</b><small>周五 · 18:00</small></div><span class="avatar"></span></div>
</div>
<script>
(function(){
  var list=document.getElementById('list'),dragging=null,placeholder=null,timer=null;
  var offsetX=0,offsetY=0,snapshot=[];
  function others(){ return [].slice.call(list.querySelectorAll('.card:not(.dragging):not(.placeholder)')); }
  function startDrag(card,e){
    var rect=card.getBoundingClientRect();
    offsetX=e.clientX-rect.left; offsetY=e.clientY-rect.top;
    dragging=card;
    card.classList.add('dragging');
    card.style.left=rect.left+'px'; card.style.top=rect.top+'px';
    card.style.width=rect.width+'px'; card.style.height=rect.height+'px';
    placeholder=document.createElement('div');
    placeholder.className='card placeholder';
    placeholder.style.height=rect.height+'px';
    card.parentNode.insertBefore(placeholder,card);
    snapshot=others().map(function(c){
      var r=c.getBoundingClientRect();
      return { el:c, mid:r.top+r.height/2 };
    });
    document.addEventListener('pointermove',onMove);
    document.addEventListener('pointerup',endDrag);
    document.addEventListener('pointercancel',endDrag);
  }
  function onMove(e){
    if(!dragging) return;
    dragging.style.left=(e.clientX-offsetX)+'px';
    dragging.style.top=(e.clientY-offsetY)+'px';
    var after=null;
    for(var i=0;i<snapshot.length;i++){
      if(e.clientY<snapshot[i].mid+4){ after=snapshot[i].el; break; }
    }
    if(placeholder.nextElementSibling===(after||null)) return;
    var cards=others(),before=[];
    cards.forEach(function(c){ before.push({ el:c, top:c.getBoundingClientRect().top }); });
    if(after) list.insertBefore(placeholder,after);
    else list.appendChild(placeholder);
    before.forEach(function(item){
      var delta=item.top-item.el.getBoundingClientRect().top;
      if(!delta) return;
      var c=item.el;
      if(c._flipAnim) c._flipAnim.cancel();
      c._flipAnim=c.animate(
        [{transform:'translateY('+delta+'px)'},{transform:'translateY(0px)'}],
        {duration:220,easing:'cubic-bezier(.2,.8,.25,1)'}
      );
    });
  }
  function endDrag(){
    if(!dragging) return;
    placeholder.parentNode.insertBefore(dragging,placeholder);
    placeholder.parentNode.removeChild(placeholder); placeholder=null;
    dragging.style.left=''; dragging.style.top=''; dragging.style.width=''; dragging.style.height='';
    dragging.classList.remove('dragging'); dragging=null;
    document.removeEventListener('pointermove',onMove);
    document.removeEventListener('pointerup',endDrag);
    document.removeEventListener('pointercancel',endDrag);
    restart();
  }
  list.addEventListener('pointerdown',function(e){
    var card=e.target.closest('.card');
    if(!card||card.classList.contains('placeholder')) return;
    e.preventDefault();
    stop();
    startDrag(card,e);
  });
  function demoDrag(){
    if(dragging) return;
    stop();
    var first=list.querySelector('.card:not(.placeholder)');
    if(!first) return;
    var r=first.getBoundingClientRect();
    var x=r.left+r.width/2, y=r.top+r.height/2;
    cursor.moveTo(first);
    setTimeout(function(){
      cursor.press();
      startDrag(first,{clientX:x,clientY:y});
      var targetY=y+150,steps=14,i=0;
      var move=setInterval(function(){
        i++;
        var ny=y+(targetY-y)*i/steps;
        cursor.at(x,ny);
        onMove({clientX:x,clientY:ny});
        if(i>=steps){
          clearInterval(move);
          setTimeout(function(){ cursor.release(); endDrag(); },180);
        }
      },36);
    },520);
  }
  var cursor=window.__uiDemoCursor && window.__uiDemoCursor();
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  function start(){ stop(); demoDrag(); timer=setInterval(demoDrag,4600); }
  function restart(){ if(!window.__uiInteractive) start(); }
  restart();
})();
</script>
</body></html>`,
  },

  {
    id: "sidebar-collapse",
    name: "侧边栏折叠",
    tags: ["导航", "展开"],
    summary: "点 ☰ 让侧栏在 232px 与 64px 间折叠，文字淡出、内容区随动画变宽。",
    hint: "点 ☰ 折叠 / 展开",
    usage: "内容型后台、宽屏桌面；需要频繁在「看列表」和「看内容」间切换。",
    caution: "移动端（改用抽屉）；导航层级很浅（用顶部导航）；折叠后图标无法自解释（需要 tooltip）。",
    prompt: [
      "【侧边栏折叠】目标：点左上角 ☰ 切换侧栏展开/折叠。展开 232px，折叠 64px，宽度过渡 .32s cubic-bezier(.2,.8,.25,1)，文字淡出但图标保留，主内容区自然变宽。",
      "1) 结构：.shell（flex）> .side + .main。.side 内 .brand（logo + 名称 + ☰ 按钮，按钮靠右）+ .row*（图标 + .txt）；☰ 属于侧栏，不要放在主区域。折叠时 logo/名称隐藏、☰ 居中。",
      "2) 折叠：.side { width:232px; transition:width .32s, padding .32s }；.side.collapsed { width:64px; padding 缩小 }。折叠时 .row 改 justify-content:center、隐藏 .txt（opacity:0; width:0; overflow:hidden）。",
      "3) 细节：给文字和 logo 都加 transition；品牌名折叠后隐藏而非消失（保留布局位）；不要用 display:none，会跳。",
      "4) 无障碍：toggle 按钮 aria-expanded / aria-label=\"折叠侧栏\"；折叠态菜单项加 title 提示；键盘 Enter/Space 可切换。",
      "5) 坑：宽度用 flex:0 0 auto 防止被挤压；overflow:hidden 放在 .side 上，避免文字换行；窄屏（<720px）默认折叠。",
      "6) 配色：用 --ui-bg / --ui-surface / --ui-surface-2 / --ui-border / --ui-text / --ui-text-dim / --ui-brand，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;height:100vh;display:flex;flex-direction:column;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);overflow:hidden}
.shell{display:flex;width:100%;height:calc(100vh - 36px);padding:18px;gap:14px;box-sizing:border-box}
.side{width:232px;flex:0 0 auto;border-radius:18px;background:linear-gradient(180deg,var(--ui-surface),var(--ui-bg));border:1px solid var(--ui-border);padding:14px 10px;display:flex;flex-direction:column;gap:4px;overflow:hidden;transition:width .32s cubic-bezier(.2,.8,.25,1),padding .32s}
.side.collapsed{width:64px;padding:14px 8px}
.brand{display:flex;align-items:center;gap:10px;padding:8px 10px 16px;white-space:nowrap;overflow:hidden;flex:0 0 auto}
.logo{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,color-mix(in srgb,var(--ui-brand) 55%,#fff),var(--ui-brand));flex:0 0 auto}
.brand span{font-size:14px;font-weight:650;color:var(--ui-text);transition:opacity .2s}
.side.collapsed .brand{padding:8px 0 16px;justify-content:center}
.side.collapsed .brand .logo,.side.collapsed .brand span{display:none}
.side.collapsed .burger{margin:0}
.row{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;color:var(--ui-text-dim);font-size:13px;white-space:nowrap;overflow:hidden;transition:background .16s,color .16s}
.row:hover{background:var(--ui-surface-2);color:var(--ui-text)}
.row.active{background:color-mix(in srgb,var(--ui-brand) 14%,transparent);color:var(--ui-text)}
.ico{width:18px;height:18px;flex:0 0 auto;border-radius:5px;background:color-mix(in srgb,var(--ui-brand) 45%,transparent)}
.side.collapsed .row{padding:10px 10px;gap:0;justify-content:center}
.row .txt{transition:opacity .2s}
.side.collapsed .row .txt{opacity:0;width:0;overflow:hidden}
.main{flex:1 1 auto;border-radius:18px;background:var(--ui-surface);border:1px solid var(--ui-border);padding:22px;position:relative;overflow:hidden}
.burger{appearance:none;border:1px solid var(--ui-border);background:var(--ui-surface-2);color:var(--ui-text);width:30px;height:30px;border-radius:9px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;margin-left:auto;flex:0 0 auto;transition:.16s}
.burger:hover{filter:brightness(1.08)}
.burger.pressing{transform:scale(.9)}
.main h2{margin:18px 0 6px;font-size:20px;color:var(--ui-text)}
.main p{margin:0;font-size:13px;color:var(--ui-text-dim)}
@media (max-height:420px){}
</style></head>
<body>
<div class="shell">
  <aside class="side" id="side">
    <div class="brand"><span class="logo"></span><span>Northwind</span><button class="burger" id="burger" aria-label="折叠侧栏" aria-expanded="true">☰</button></div>
    <div class="row active"><span class="ico"></span><span class="txt">概览</span></div>
    <div class="row"><span class="ico"></span><span class="txt">项目</span></div>
    <div class="row"><span class="ico"></span><span class="txt">数据看板</span></div>
    <div class="row"><span class="ico"></span><span class="txt">设置</span></div>
  </aside>
  <main class="main">
    <h2>内容区会随侧栏变宽</h2>
    <p>折叠后只保留图标，宽度 232 → 64px，曲线 cubic-bezier(.2,.8,.25,1)。</p>
  </main>
</div>
<script>
(function(){
  var side=document.getElementById('side'),burger=document.getElementById('burger'),timer=null;
  var cursor=window.__uiDemoCursor && window.__uiDemoCursor();
  function toggle(){
    side.classList.toggle('collapsed');
    burger.setAttribute('aria-expanded',side.classList.contains('collapsed')?'false':'true');
  }
  function demo(){
    cursor.moveTo(burger);
    setTimeout(function(){
      cursor.press(); burger.classList.add('pressing');
      setTimeout(function(){ cursor.release(); burger.classList.remove('pressing'); toggle(); },190);
    },560);
  }
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  function start(){ stop(); demo(); timer=setInterval(demo,3400); }
  if(!window.__uiInteractive) start();
  burger.addEventListener('click',function(){ stop(); toggle(); });
})();
</script>
</body></html>`,
  },

  {
    id: "tab-indicator",
    name: "标签页指示器",
    tags: ["导航", "切换"],
    summary: "下划线/胶囊指示条在 tab 间平滑滑动，内容淡入切换。",
    hint: "点击切换 · 指示条 0.3 秒滑动",
    usage: "同层级内容切换（概览/成员/设置）；tab 数量 3–7 个。",
    caution: "tab 超过 8 个（改用下拉或侧栏）；内容之间没有并列关系；需要深链接到每个 tab（要配合路由）。",
    prompt: [
      "【标签页指示器】目标：一排 tab，激活项背后有滑动指示条（胶囊），切换时指示条按 left/width 过渡滑过去，内容淡入。",
      "1) 结构：.tabs（position:relative; padding:6px）里放一个 .ink 绝对定位胶囊 + 若干 .tab 按钮。",
      "2) 定位：点击/切换时读目标按钮 offsetLeft / offsetWidth，写 ink.style.left / width。过渡 .3s cubic-bezier(.2,.8,.25,1)。",
      "3) 内容：切 tab 时内容先 opacity:0 + translateY(6px)，120ms 后换文字再淡入；不要 display:none。",
      "4) 无障碍：tablist/tab/tabpanel role，方向键切换，active tab 加 aria-selected。",
      "5) 坑：首次渲染必须等布局完成再算 offset（requestAnimationFrame）；窗口 resize 要重算；tab 文字变化也要重算。",
      "6) 配色：用 --ui-surface / --ui-surface-2 / --ui-border / --ui-text / --ui-text-dim / --ui-brand，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(900px 500px at 80% -10%,color-mix(in srgb,var(--ui-brand) 15%,transparent),transparent 60%),var(--ui-bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:30px}
.tabs{position:relative;display:flex;gap:4px;padding:6px;border-radius:14px;background:var(--ui-surface);border:1px solid var(--ui-border)}
.tab{appearance:none;border:0;background:transparent;color:var(--ui-text-dim);font-size:13px;padding:10px 18px;border-radius:10px;cursor:pointer;position:relative;z-index:1;transition:color .22s}
.tab.active{color:var(--ui-text)}
.tab.pressing{transform:scale(.95)}
.ink{position:absolute;top:6px;bottom:6px;left:6px;width:0;border-radius:10px;background:color-mix(in srgb,var(--ui-brand) 18%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ui-brand) 35%,transparent);transition:left .3s cubic-bezier(.2,.8,.25,1),width .3s cubic-bezier(.2,.8,.25,1)}
.panel{width:min(420px,100%);padding:20px;border-radius:16px;background:var(--ui-surface);border:1px solid var(--ui-border);opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s}
.panel.show{opacity:1;transform:none}
.panel h3{margin:0 0 6px;font-size:16px;color:var(--ui-text)}
.panel p{margin:0;font-size:13px;line-height:1.65;color:var(--ui-text-dim)}
@media (max-height:420px){}
</style></head>
<body>
<div class="tabs" id="tabs">
  <span class="ink" id="ink"></span>
  <button class="tab active" data-i="0">概览</button>
  <button class="tab" data-i="1">成员</button>
  <button class="tab" data-i="2">设置</button>
</div>
<div class="panel show" id="panel">
  <h3>概览</h3>
  <p>指示条用绝对定位跟随当前 tab，left / width 各 300ms 过渡。</p>
</div>
<script>
(function(){
  var tabs=document.getElementById('tabs'),ink=document.getElementById('ink'),panel=document.getElementById('panel');
  var btns=[].slice.call(tabs.querySelectorAll('.tab')),timer=null,cur=0;
  var data=[['概览','指示条用绝对定位跟随当前 tab，left / width 各 300ms 过渡。'],['成员','内容切换时淡入 + 上移 6px，避免生硬跳变。'],['设置','不要用 display:none 切内容，否则过渡全没了。']];
  function move(i){
    cur=i;
    btns.forEach(function(b,j){ b.classList.toggle('active',j===i); });
    var b=btns[i];
    ink.style.left=(b.offsetLeft)+'px';
    ink.style.width=(b.offsetWidth)+'px';
    panel.classList.remove('show');
    setTimeout(function(){
      panel.querySelector('h3').textContent=data[i][0];
      panel.querySelector('p').textContent=data[i][1];
      panel.classList.add('show');
    },120);
  }
  var cursor=window.__uiDemoCursor && window.__uiDemoCursor();
  function demo(){
    var target=(cur+1)%btns.length;
    cursor.moveTo(btns[target]);
    setTimeout(function(){
      cursor.press(); btns[target].classList.add('pressing');
      setTimeout(function(){ cursor.release(); btns[target].classList.remove('pressing'); move(target); },190);
    },560);
  }
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  function start(){ stop(); demo(); timer=setInterval(demo,3200); }
  tabs.addEventListener('click',function(e){
    var b=e.target.closest('.tab'); if(!b) return;
    stop(); move(Number(b.dataset.i));
  });
  requestAnimationFrame(function(){ move(0); if(!window.__uiInteractive) start(); });
})();
</script>
</body></html>`,
  },

  {
    id: "night-glass-palette",
    name: "配色方案：跟随主题",
    tags: ["配色方案"],
    summary: "读取 DSH 当前主题的 token 色板（背景/表面/边框/主色/语义色），点击复制，换主题自动更新。",
    hint: "换 DSH 主题（深色 / 浅色 / 纸质）再打开，会跟着变",
    usage: "需要跟 DSH 主题一致的后台页面；浅色/深色/纸质多主题共存。",
    caution: "品牌强约束的营销页（用品牌色板）；需要高对比度无障碍的场景要单独验对比度。",
    prompt: [
      "【配色方案：跟随主题】目标：任何页面都不要写死颜色——从当前主题读出 token（背景/表面/边框/主色/语义色），色板本身也用它，换主题时自动更新。",
      "1) 读 token：`getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base')` 等；在 iframe 里则用父页面注入的 `--ui-*`。纸质主题是 light 上的 token 覆盖层（workbench 的 theme.overrideTokens），所以读「计算后的值」而不是读设置。",
      "2) 常用别名：bg-base（背景）、bg-layer-1（表面）、bg-layer-2（次级表面）、border-l1（边框）、label-primary（正文）、label-secondary（次要文字）、brand-primary（主色）、state-success/warn/error-primary（语义色）。",
      "3) 玻璃卡：background 用 color-mix(in srgb, var(--ui-surface) 60%, transparent) + backdrop-filter:blur(10px) + 1px var(--ui-border) 描边，比写死 rgba 白更跟主题。",
      "4) 对比：正文对背景对比度 > 7:1；别把纯白/纯黑当正文（浅色主题用近黑、纸质用暖棕、深色用米白）。",
      "5) 语义色：成功/警告/危险只用于状态，不做装饰；状态点用「色 + 文字」双保险。",
      "6) 坑：不要写死 #0b1020 这类背景（切主题就脏）；渐变不超过 4 个色标；color-mix 给一条纯色 fallback。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;padding:28px;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(1000px 600px at 20% -20%,color-mix(in srgb,var(--ui-brand) 14%,transparent),transparent 60%),var(--ui-bg)}
.wrap{width:min(560px,100%);margin:0 auto;display:flex;flex-direction:column;gap:18px}
.head{display:flex;justify-content:space-between;align-items:baseline}
.head h2{margin:0;font-size:18px}
.head span{font-size:12px;color:var(--ui-text-dim)}
.swatches{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.sw{border-radius:13px;overflow:hidden;background:var(--ui-surface);border:1px solid var(--ui-border);cursor:pointer;transition:transform .18s,box-shadow .18s}
.sw:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(0,0,0,.22)}
.sw.pressing{transform:scale(.96)}
.chip{height:58px;border-bottom:1px solid var(--ui-border);box-shadow:inset 0 0 0 1px var(--ui-border)}
.meta{padding:9px 11px;font-size:10.5px;color:var(--ui-text-dim);line-height:1.5}
.meta b{display:block;color:var(--ui-text);font-weight:600;font-size:11.5px}
.grad{height:74px;border-radius:14px;background:linear-gradient(90deg,var(--ui-bg),var(--ui-surface),var(--ui-surface-2),var(--ui-border),var(--ui-brand),var(--ui-success),var(--ui-warn),var(--ui-danger));background-size:100% 100%;opacity:.85}
.glass{padding:16px;border-radius:14px;background:color-mix(in srgb,var(--ui-surface) 62%,transparent);border:1px solid var(--ui-border);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:space-between;font-size:13px}
.glass button{appearance:none;border:1px solid var(--ui-border);background:var(--ui-surface-2);color:var(--ui-text);padding:8px 14px;border-radius:9px;font-size:12px;cursor:pointer;transition:.16s}
.glass button:hover{filter:brightness(1.1)}
.toast{position:fixed;left:50%;top:16px;transform:translateX(-50%) translateY(-12px);opacity:0;padding:9px 16px;border-radius:10px;background:var(--ui-surface);border:1px solid var(--ui-border);font-size:12px;color:var(--ui-text);transition:opacity .2s,transform .2s;pointer-events:none;box-shadow:0 16px 40px rgba(0,0,0,.25)}
.toast.show{opacity:1;transform:translateX(-50%)}
@media (max-height:420px){}
</style></head>
<body>
<div class="wrap">
  <div class="head"><h2>当前主题色板</h2><span>点击色块复制色值</span></div>
  <div class="swatches" id="swatches"></div>
  <div class="grad"></div>
  <div class="glass"><span>玻璃拟态：color-mix(surface 62%) + blur(10px)</span><button>次要操作</button></div>
  </div>
<div class="toast" id="toast">已复制</div>
<script>
(function(){
  var keys=[['背景','--ui-bg'],['表面','--ui-surface'],['次级表面','--ui-surface-2'],['边框','--ui-border'],['主色','--ui-brand'],['文字','--ui-text'],['成功','--ui-success'],['警告','--ui-warn']];
  var root=getComputedStyle(document.documentElement);
  var box=document.getElementById('swatches'),toast=document.getElementById('toast'),timer=null;
  keys.forEach(function(item){
    var name=item[0],v='var('+item[1]+')';
    var value=(root.getPropertyValue(item[1])||'').trim()||v;
    var el=document.createElement('div');
    el.className='sw';
    el.innerHTML='<div class="chip" style="background:'+v+'"></div><div class="meta"><b>'+name+'</b>'+value.toUpperCase()+'</div>';
    el.addEventListener('click',function(){
      var done=function(){ toast.textContent='已复制 '+value.toUpperCase(); toast.classList.add('show'); clearTimeout(timer); timer=setTimeout(function(){toast.classList.remove('show');},1200); };
      try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(value).then(done,done); } else { done(); } }catch(_e){ done(); }
    });
    box.appendChild(el);
  });
  if(!window.__uiInteractive){
    var cursor=window.__uiDemoCursor && window.__uiDemoCursor();
    var sws=[].slice.call(box.querySelectorAll('.sw'));
    var k=0;
    function clickDemo(){
      var sw=sws[k%sws.length]; k++;
      cursor.moveTo(sw);
      setTimeout(function(){
        cursor.press(); sw.classList.add('pressing');
        setTimeout(function(){ cursor.release(); sw.classList.remove('pressing'); sw.click(); },180);
      },560);
    }
    clickDemo();
    setInterval(clickDemo,3600);
  }
})();
</script>
</body></html>`,
  },

  {
    id: "skeleton-loading",
    name: "骨架屏加载",
    tags: ["加载", "动画"],
    summary: "shimmer 扫光骨架屏，加载完成后淡入真实内容，循环演示。",
    hint: "骨架 → 内容循环 · 高光每 1.4 秒扫一轮",
    usage: "内容结构已知、加载 0.5–3 秒；列表/详情页首屏。",
    caution: "加载 <300ms（会闪一下）；结构不确定（用 spinner）；加载超过 10 秒（要给进度和重试）。",
    prompt: [
      "【骨架屏加载】目标：数据未到时显示与最终内容结构一致的灰色块，背景一条 shimmer 高光每 1.4s 从左到右扫过；数据到达后淡入真实内容。",
      "1) 结构：骨架和内容各一份，结构块一一对应（头像圆 / 标题条 / 图片块 / 正文条），高度一致，避免切换时跳版。",
      "2) shimmer：background: linear-gradient(90deg, color-mix(in srgb, var(--ui-text) 8%, transparent) 25%, color-mix(in srgb, var(--ui-text) 16%, transparent) 37%, color-mix(in srgb, var(--ui-text) 8%, transparent) 63%); background-size:400% 100%; animation: shimmer 1.4s ease infinite；keyframes 里 background-position 从 100% 0 到 0 0。",
      "3) 切换：内容 opacity 0→1 .3s；骨架用 display:none 切走；不要两个都渲染占高度。",
      "4) 无障碍：aria-busy=\"true\"，aria-live 在加载完成时播报；尊重 prefers-reduced-motion，关掉 shimmer 动画。",
      "5) 坑：骨架块数量/宽度要跟真实内容接近，不要用假文字；超时（>10s）要给重试而不是一直闪。",
      "6) 配色：用 --ui-surface / --ui-text / --ui-brand 等变量，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(900px 520px at 70% 10%,color-mix(in srgb,var(--ui-brand) 14%,transparent),transparent 62%),var(--ui-bg);display:flex;align-items:center;justify-content:center;padding:30px}
.cardw{width:min(430px,100%);border-radius:18px;background:var(--ui-surface);border:1px solid var(--ui-border);padding:18px;display:flex;flex-direction:column;gap:14px}
.skel,.content{display:flex;flex-direction:column;gap:12px;transition:opacity .3s ease}
.skel.hide,.content.hide{display:none}
.row{display:flex;align-items:center;gap:12px}
.ava{width:42px;height:42px;border-radius:50%;flex:0 0 auto}
.line{height:10px;border-radius:6px}
.sk{background:linear-gradient(90deg,color-mix(in srgb,var(--ui-text) 8%,transparent) 25%,color-mix(in srgb,var(--ui-text) 16%,transparent) 37%,color-mix(in srgb,var(--ui-text) 8%,transparent) 63%);background-size:400% 100%;animation:shimmer 1.4s ease infinite}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
.big{height:120px;border-radius:12px}
.content .hero{height:120px;border-radius:12px;background:linear-gradient(135deg,color-mix(in srgb,var(--ui-brand) 70%,#fff),var(--ui-brand))}
.content h3{margin:2px 0 0;font-size:15px;color:var(--ui-text)}
.content p{margin:0;font-size:12px;color:var(--ui-text-dim);line-height:1.6}
.badge{align-self:flex-start;font-size:11px;padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--ui-success) 16%,transparent);color:var(--ui-success)}
@media (max-height:420px){}
</style></head>
<body>
<div class="cardw">
  <div class="skel" id="skel">
    <div class="row"><div class="ava sk"></div><div style="flex:1"><div class="line sk" style="width:46%"></div><div class="line sk" style="width:28%;margin-top:8px"></div></div></div>
    <div class="big sk"></div>
    <div class="line sk" style="width:78%"></div>
    <div class="line sk" style="width:55%"></div>
  </div>
  <div class="content hide" id="content">
    <div class="hero"></div>
    <span class="badge">加载完成</span>
    <h3>城市夜跑路线</h3>
    <p>骨架屏只保留结构（头像 / 标题 / 图片 / 正文），不要塞假文字；内容出现时淡入，避免闪一下。</p>
  </div>
</div>
<script>
(function(){
  var skel=document.getElementById('skel'),content=document.getElementById('content');
  function cycle(){
    var loading=!skel.classList.contains('hide');
    if(loading){ skel.classList.add('hide'); content.classList.remove('hide'); }
    else { content.classList.add('hide'); skel.classList.remove('hide'); }
  }
  setInterval(cycle,2200);
})();
</script>
</body></html>`,
  },

  {
    id: "spotlight-card",
    name: "卡片悬停光效",
    tags: ["交互", "动画"],
    summary: "指针跟随的 radial-gradient 光斑，卡片边框同步提亮，自动扫光演示。",
    hint: "鼠标移动试试 · 光斑跟着指针走",
    usage: "展示型卡片、强调可点击；桌面端为主。",
    caution: "移动端（没有 hover）；密集列表（光斑干扰阅读）；表单控件；低动效偏好（respect prefers-reduced-motion）。",
    prompt: [
      "【卡片悬停光效】目标：鼠标在卡片上移动时，一个跟随指针的径向光斑照亮卡片（radial-gradient + CSS 变量 --mx/--my），卡片边框同步提亮；指针离开光斑淡出。",
      "1) 结构：.card（position:relative; overflow:hidden）里用 ::before 做光斑层：background: radial-gradient(220px circle at var(--mx,50%) var(--my,50%), color-mix(in srgb, var(--ui-brand) 24%, transparent), transparent 65%)；默认 opacity:0，hover 时 opacity:1。",
      "2) 更新：pointermove 里用 getBoundingClientRect 换算百分比，写 style.setProperty('--mx', x%) / ('--my', y%)；不要每帧 setState，直接写 CSS 变量。",
      "3) 联动：hover 时 transform:translateY(-3px)、边框色 color-mix(in srgb, var(--ui-brand) 45%, transparent)、阴影加强，transition .25s。",
      "4) 性能：光斑层 pointer-events:none；只在 pointermove 更新，不做 requestAnimationFrame 节流也行（写 CSS 变量开销小）；移动端没有 hover，改选中态。",
      "5) 坑：::before 的 inset 用 0；不要给光斑加 filter:blur（GPU 贵）；多个卡片共享逻辑用事件委托。",
      "6) 配色：用 --ui-surface / --ui-border / --ui-text / --ui-text-dim / --ui-brand，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;padding:32px;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(1000px 600px at 50% -20%,color-mix(in srgb,var(--ui-brand) 16%,transparent),transparent 62%),var(--ui-bg);display:flex;flex-direction:column;gap:18px;align-items:center;justify-content:center}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%;max-width:680px}
.card{position:relative;border-radius:16px;padding:20px 18px;background:var(--ui-surface);border:1px solid var(--ui-border);overflow:hidden;transition:border-color .25s,transform .25s}
.card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--ui-brand) 45%,transparent)}
.card::before{content:"";position:absolute;inset:0;background:radial-gradient(220px circle at var(--mx,50%) var(--my,50%),color-mix(in srgb,var(--ui-brand) 24%,transparent),transparent 65%);opacity:0;transition:opacity .3s;pointer-events:none}
.card.lit::before,.card:hover::before{opacity:1}
.ico{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--ui-brand) 14%,transparent);color:var(--ui-brand);font-size:16px;margin-bottom:14px;position:relative}
.card h3{margin:0 0 6px;font-size:14px;position:relative;color:var(--ui-text)}
.card p{margin:0;font-size:12px;line-height:1.6;color:var(--ui-text-dim);position:relative}
@media (max-height:420px){body{padding:14px;gap:10px}.cards{gap:8px}.card{padding:12px 10px}.ico{width:24px;height:24px;font-size:12px;margin-bottom:8px}.card h3{font-size:11px}.card p{display:none}}
@media (max-height:420px){}
</style></head>
<body>
<div class="cards" id="cards">
  <div class="card"><div class="ico">⚡</div><h3>极速构建</h3><p>鼠标在卡片上移动，光斑跟着指针走。</p></div>
  <div class="card"><div class="ico">◎</div><h3>焦点跟随</h3><p>--mx / --my 两个 CSS 变量驱动 radial-gradient。</p></div>
  <div class="card"><div class="ico">✦</div><h3>自动扫光</h3><p>每 2 秒自动在卡片间扫过，演示用。</p></div>
</div>
<script>
(function(){
  var cards=[].slice.call(document.querySelectorAll('.card'));
  cards.forEach(function(card){
    card.addEventListener('pointermove',function(e){
      var r=card.getBoundingClientRect();
      card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
      card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
    });
  });
  var i=0;
  if(!window.__uiInteractive){
    var cursor=window.__uiDemoCursor && window.__uiDemoCursor();
    function demo(){
      var r0=cards[0].getBoundingClientRect();
      var r2=cards[cards.length-1].getBoundingClientRect();
      if(!r0.width||!r2.width) return;
      var left=r0.left+6, right=r2.right-6;
      var y0=r0.top+r0.height*0.5;
      cursor.el.classList.add('sweeping');
      cursor.at(left,y0);
      cursor.el.classList.add('show');
      var start=performance.now();
      var total=4200;
      function step(now){
        var p=Math.min(1,(now-start)/total);
        var x=left+(right-left)*p;
        var y=y0+Math.sin(p*Math.PI)*8;
        cursor.at(x,y);
        cards.forEach(function(card){
          var r=card.getBoundingClientRect();
          if(x>=r.left&&x<=r.right){
            card.classList.add('lit');
            card.style.setProperty('--mx',((x-r.left)/r.width*100)+'%');
            card.style.setProperty('--my',((y-r.top)/r.height*100)+'%');
          } else {
            card.classList.remove('lit');
          }
        });
        if(p<1) requestAnimationFrame(step);
        else setTimeout(function(){
          cursor.el.classList.remove('sweeping');
          cursor.hide();
          cards.forEach(function(c){ c.classList.remove('lit'); });
        },300);
      }
      requestAnimationFrame(step);
    }
    setTimeout(demo,300);
    setInterval(demo,5600);
  }
})();
</script>
</body></html>`,
  },

  {
    id: "toast-notice",
    name: "Toast 通知",
    tags: ["提示", "弹窗"],
    summary: "右上角滑入的通知条：从 translateX(120%) 弹入，自动堆叠与消失。",
    hint: "通知条从右侧滑入 · 每 3.6 秒循环演示",
    usage: "操作结果反馈（保存成功/失败）、非阻塞提示。",
    caution: "需要用户确认的操作（用弹窗）；重要错误需要用户处理（用弹窗或页面内提示）；需要历史记录（用通知中心）。",
    prompt: [
      "【Toast 通知】目标：页面右上角依次滑入通知条，每条从右侧 translateX(120%) + opacity 0 过渡到原位，堆叠后整体消失。",
      "1) 结构：.toasts（fixed top:20px right:20px，flex column，gap:10px，宽 min(320px, 90vw)）> .toast。",
      "2) 入场：.toast 默认 transform:translateX(120%); opacity:0; 打开加 .show → transform:none; opacity:1。transition: transform .32s cubic-bezier(.2,.9,.25,1.1)（略微过冲）, opacity .24s。",
      "3) 堆叠：多条时第二条晚 400ms 进；整体 3s 后移除 .show 一起滑出（或者单条 3s 自动消失，从队列删 DOM，其余条向上补位用 max-height/scale 过渡）。",
      "4) 语义：成功/警告/错误用状态色（success / warn / danger），标题 + 一句详情；错误类不自动消失，给关闭按钮。",
      "5) 无障碍：容器 role=\"status\" aria-live=\"polite\"（错误用 alert/assertive）；一次最多堆 3 条，超出的排队；尊重 prefers-reduced-motion（去掉位移，只淡入）。",
      "6) 配色：用 --ui-bg / --ui-surface / --ui-border / --ui-text / --ui-text-dim / --ui-success / --ui-warn / --ui-danger，不要写死深色——父页面按当前主题注入。",
      "7) 自动演示：只在卡片预览里跑——把自动循环包在 if(!window.__uiInteractive){...} 里；弹窗里 window.__uiInteractive === true，用户要手动操作，不能被定时器顶掉。",
    ].join("\n"),
    demoHtml: `<!doctype html>
<html lang="zh"><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:"Segoe UI",system-ui,"Microsoft YaHei",sans-serif;color:var(--ui-text);background:var(--ui-bg);background:radial-gradient(900px 500px at 80% 0%,color-mix(in srgb,var(--ui-brand) 16%,transparent),transparent 62%),var(--ui-bg)}
.toasts{position:fixed;top:22px;right:22px;width:min(320px,calc(100vw - 44px));display:flex;flex-direction:column;gap:10px}
.toast{display:flex;gap:10px;align-items:flex-start;padding:13px 15px;border-radius:13px;background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:0 20px 50px rgba(0,0,0,.28);transform:translateX(120%);opacity:0;transition:transform .32s cubic-bezier(.2,.9,.25,1.1),opacity .24s}
.toast.show{transform:none;opacity:1}
.dot{width:9px;height:9px;border-radius:50%;background:var(--ui-success);margin-top:5px;flex:0 0 auto;box-shadow:0 0 12px color-mix(in srgb,var(--ui-success) 70%,transparent)}
.toast.warn .dot{background:var(--ui-warn);box-shadow:0 0 12px color-mix(in srgb,var(--ui-warn) 70%,transparent)}
.toast b{display:block;font-size:13px;margin-bottom:2px;color:var(--ui-text)}
.toast small{font-size:11.5px;color:var(--ui-text-dim);line-height:1.5}
@media (max-height:420px){}
</style></head>
<body>
<div class="toasts" id="toasts">
  <div class="toast"><span class="dot"></span><div><b>已保存</b><small>改动会在 2 秒后同步到云端。</small></div></div>
  <div class="toast warn"><span class="dot"></span><div><b>存储空间不足</b><small>清理缓存后可以继续上传。</small></div></div>
</div>
<script>
(function(){
  var list=[].slice.call(document.querySelectorAll('.toast'));
  function cycle(){
    list.forEach(function(t){ t.classList.remove('show'); });
    setTimeout(function(){ list[0].classList.add('show'); },80);
    setTimeout(function(){ list[1].classList.add('show'); },520);
    setTimeout(function(){ list.forEach(function(t){ t.classList.remove('show'); }); },3000);
  }
  cycle();
  setInterval(cycle,3600);
})();
</script>
</body></html>`,
  },
];
