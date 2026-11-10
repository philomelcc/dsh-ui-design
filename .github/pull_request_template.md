## 这个 PR 做了什么

<!-- 一句话说明：新增哪项设计 / 修了哪个 demo / 改了哪条提示词 -->

## 类型

- [ ] 新增设计
- [ ] 修 demo（动画/交互/主题适配）
- [ ] 改提示词
- [ ] 修数据/脚本/文档
- [ ] 其他

## 检查清单

- [ ] `npm run validate` 通过
- [ ] demo 是完整 HTML 文档，不访问网络 / localStorage / 父页面
- [ ] 配色只用 `--ui-*` 变量，换深色主题不坏
- [ ] 自动播放包在 `if (!window.__uiInteractive)` 里
- [ ] 没有 `scrollIntoView`；`focus()` 都带 `{ preventScroll: true }`
- [ ] 卡片预览（176px 高）和放大弹窗里都看过，布局正常
- [ ] `prompt` 自包含、参数具体（不引用本规范或本库其他设计）
- [ ] `usage` / `caution` 写了（尽量）

## 备注

<!-- 截图、录屏或需要 review 注意的地方 -->
