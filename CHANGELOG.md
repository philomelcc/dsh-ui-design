# Changelog

## 0.3.6

- 新增 `related` 字段（结构化引用）：正文用「」提到别的设计时登记，`get` 会连对方的 tag 和一句话摘要一起返回，检索匹配不准时能顺着再取一次（兜底）
- `validate.mjs` 新增引用体检：`related` 引用的设计不存在、正文提到设计名但没登记 → 警告（允许先写引用后补设计，不阻断）
- `create` / `update` / 页面端点支持 `related`；改名时提示哪些设计还引用旧名
- 数据：200 项 tag 重审（65 项调整，补 70 处、删 45 处）；50 项设计登记 64 条引用
- 《设计规范》新增「引用其他设计」与「tag 怎么标」两节（26 个 tag 定义 + 标注规则）
- README 加真实截图（展示版首页 / 设计详情 / 深色主题）与演示 GIF，`docs/screenshots/` 随包发布
- README 数字与过时说明修正（200 项、validate 已实现、数据规模）
- 修：`validate.mjs` 判 `scrollIntoView(` / `.focus(` 前先剥掉 HTML 与 JS 注释，注释里解释「为什么不用」不再误报（命令面板那条假警告即此）

## 0.3.5

- 数据同步：仓库设计库到 170 项
- README 展示版域名说明（链接渲染成文本，不写裸 URL）

## 0.3.4

- 卡片标题与弹窗标题加复制按钮
- 卡片 tag 移到独立底栏（内容区 flex:1 + 底栏，无分隔线）

## 0.3.3

- `TIMER_GUARD`：后台标签页隐藏时跳过 `setTimeout` / `setInterval` 回调，修「挂久了切回动画抽搐」

## 0.3.2

- 修：副标题与「全部」计数不再随 tag 筛选变化（接口补 `libraryTotal`）

## 0.3.1

- 设计规范新增「素材与来源（版权风险）」章节；CONTRIBUTING 加素材授权条款
- 数据新增可选 `inspiration` 字段（灵感来源，≤200 字），DSH 弹窗与展示版弹窗都会显示
- `validate.mjs` 增加 `inspiration` 长度校验

## 0.3.0

- 可选向量重排：`config.json` 配了 OpenAI 兼容 embedding 端点后，`search` 会对关键词候选做语义重排（RRF 融合）；**没配就完全跳过**，默认检索行为不变
- README 补「检索」章节

## 0.2.0

- 检索增强：同义词表（55 组）、中文 2 字滑窗拆词、分层打分（name > aliases > tags > summary > usage）、bigram 字面兜底
- 数据新增可选 `aliases` 字段（别名，帮助搜索命中）
- `get` 输出增加「以 demo 为基准、逐条核对 prompt」的实现要求

## 0.1.1

- 修：`client.js` 的模块加载 id 必须与包名一致（`@philomelcc/dsh-ui-design`），否则 UI 不激活

## 0.1.0

- 首个版本：99 项设计（可交互 demo + 实现提示词 + 适用/不适用场景）、`ui_design` 工具（search / get / create / update / guide / tags / list）、静态展示版、数据校验脚本
