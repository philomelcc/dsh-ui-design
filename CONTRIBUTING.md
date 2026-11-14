# 贡献指南

欢迎加设计、修 demo、改提示词。这个库的价值在于「设计质量 + 提示词能直接照做」，所以比代码更看重数据本身。

## 加一项设计（两种方式）

**方式 A：在 dsh 里加（推荐）**

1. 打开「UI设计」页，点「+ 新建设计」；或在任意 dsh 会话里说「新建一个设计：……」。
2. 填名称、tag、一句话说明，再按 [`设计规范.md`](./设计规范.md) 写 `demoHtml` 和 `prompt`。
3. 导出到仓库：`npm run export`（把 `~/.dsh/storages/ui-design/` 同步回 `data/`）。

**方式 B：直接编辑 `data/`**

1. 在 `data/designs/` 新建 `<id>.json`（id 用一个短 slug，如 `export-menu`）。
2. 在 `data/index.json` 的 `designs` 数组里加一条元数据（id 必须一致）。
3. 跑 `npm run validate` 确认格式。

两种方式都要过校验。**不要只改 `index.json` 不加文件。**

## 数据格式

`data/designs/<id>.json`：

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | ✅ | 设计名，≤60 字，全库唯一 |
| `tags` | 建议 | ≤8 个，参考现有 tag（导航/弹窗/加载/表单/交互…） |
| `summary` | 建议 | 一句话说明，≤300 字 |
| `usage` | 建议 | 适用场景，≤120 字（1–2 句） |
| `caution` | 建议 | 不适用场景，≤120 字 |
| `hint` | 可选 | 操作提示，≤80 字；页面渲染在演示区外，**demo 里不要写提示行** |
| `related` | 建议 | 相关设计名数组（≤8 个）：正文用「」提到别的设计时，把那些名字登记进来，AI 取设计时能顺着找（兜底） |
| `prompt` | ✅ | 实现提示词，见下方要求 |
| `demoHtml` | ✅ | 完整 HTML（`<!doctype html>` 到 `</html>`），≤400KB |

`data/index.json` 的元数据只需 `id / name / tags / aliases / summary / usage / caution / hint / inspiration / related / createdAt / updatedAt`，不含 `prompt` 和 `demoHtml`。

### 引用其他设计（related）

正文里说「这种情况改用『时间线』」时，设计名要用「」写全，并登记到 `related`：

```json
"usage": "3–6 步线性流程用它；纯事件记录用「时间线」，不是它。",
"related": ["时间线"]
```

- 名字必须和库里完全一致；被引用的设计还没添加也可以先登记，`validate` 只报警告（允许分两次补）。
- 正文提到设计名但没登记，`validate` 也会警告。
- `demoHtml` 里的「」是界面文案，不算引用。

## demo 要求（硬性）

- 完整 HTML 文档，自带样式和脚本，不访问网络 / localStorage / 父页面。
- 配色只用 `--ui-*` 变量（父页面按主题注入），**不要写死深色**；品牌色按钮文字用 `var(--ui-bg)`。
- 自动播放包在 `if (!window.__uiInteractive)` 里：卡片预览会播，放大弹窗不播。
- 点击类演示用 `window.__uiDemoCursor()`（移过去 → 按下 → 触发真实 click）；被点元素要加 `.pressing` 之类的按下反馈。
- 小视口（卡片预览 176px 高）用 `@media (max-height: 420px)` 压缩布局，`.hint` 隐藏。
- 动画用 `el.animate()` / CSS keyframes，不要用「设 transform → reflow → 改 transition」的 FLIP。
- **不要用 `scrollIntoView`**，`focus()` 一律带 `{ preventScroll: true }`（否则会把外层页面滚走/抢焦点）。

完整规则见 [`设计规范.md`](./设计规范.md)，写之前先读一遍。

## prompt 要求

`prompt` 是给 AI 复现这套设计用的，**必须自包含**——用户可能只把这串文字复制给另一边的 AI：

- 结构（DOM/类名）、尺寸、颜色、动画参数（时长/缓动）、交互细节、无障碍、坑，都直接写进去；
- 不要写「按《设计规范》」「参考本库其他设计」这类引用，对方看不到；
- 参数要可执行、可感知：写「抖 3px / 0.22 秒」而不是「轻微抖动」。

## 素材与来源（版权）

参考视频/同类网页/开源库的**效果和思路**没问题；照搬**具体表达**有风险：

- demo 里只能用自绘 SVG/CSS、CC0 或 MIT/Apache 授权的素材（注明出处）；不要用未授权的图片、插画、图标集、字体、角色形象；
- 不要复刻可识别的品牌界面/logo/角色（整体观感相似也算）；
- 不要从 GPL/AGPL 项目直接复制代码；参考 MIT/Apache 项目的实现要保留版权声明；
- 如果参考了具体来源，在 `inspiration` 里写一句（链接或说明，可选但推荐）。

提交前逐项过一遍 [`设计规范.md`](./设计规范.md) 第六节的自检清单。

## 提交 PR

1. `npm run validate` 通过（CI 也会跑）；
2. 本地看一眼：`npm run site` → http://127.0.0.1:3090，新设计卡片能正常演示；
3. PR 用仓库自带的模板，勾选检查清单；
4. 一个 PR 只加一项设计或修一个问题，方便 review。

## 本地开发

```bash
npm run validate   # 校验 data/
npm run site       # 同步数据并起展示版（http://127.0.0.1:3090）
npm run export     # 运行时数据导出回 data/
```

## 审核看什么

- demo 能在卡片预览和弹窗里都正常跑；
- prompt 自包含、参数具体；
- 和库里已有设计不重复（重复的会建议合并或标明差异）；
- 没有写死的颜色/尺寸导致换主题就坏。
