# DSH UI 设计知识库

给 DeepSeek Harness（dsh）用的前端设计知识库：**99 项可复用设计**，每项带 tag、可交互 demo、适用/不适用场景、一套实现提示词。

- **给 AI 用**：agent 做前端任务时先按场景搜，匹配到就取提示词和 demo 当实现依据；没有合适的就自己设计，不硬套。
- **给人用**：页面里按 tag 筛选、点卡片看 demo（可交互）、复制提示词给任何 AI，或复制 JSON。
- **不需要 dsh 也能看**：仓库里带一个纯静态展示版。

## 安装

```bash
dsh plugin --profile web add @philomelcc/dsh-ui-design
```

装好后重启一次 dsh web。入口有两种形态：

- 装了 `@philomelcc/dsh-workbench`：出现在工作台第二行的 tab「UI设计」；
- 没装工作台：出现在第一行系统栏（`sidebar.panellist`），点图标打开页面。

首次启动会把包内 `data/` 的 99 项设计写入 `~/.dsh/storages/ui-design/`，之后只读你的数据，不再覆盖。

## agent 侧

插件注册一个 `ui_design` 工具：

| action | 作用 |
|---|---|
| `search` | 按场景/关键词搜候选（返回名称/tag/场景，不带 demo） |
| `get` | 取某项的完整提示词 + 适用场景（`includeDemo=true` 连 demo 代码一起） |
| `create` / `update` / `delete` | 新建 / 修改 / 删除设计（自然语言即可） |
| `guide` | 读《设计规范》（写 demo 前必读） |
| `tags` / `list` | 标签概览 / 分页浏览 |

系统提示会告诉 agent：**做前端 UI 任务前先搜索**；匹配后以 prompt 和 demo 为实现依据、逐条对照，不要凭印象简化。

## 展示版（不需要 dsh）

```bash
npm run site        # 把 data/ 同步到 site/data/ 并起本地服务
# 或
node site/serve.mjs # 直接起，默认 http://127.0.0.1:3090
```

展示版功能：卡片网格（分页）、tag 筛选、标签输入搜索、弹窗 demo、复制提示词/JSON、`配色方案` 直接作为主题切换。

## 数据

- 包内 `data/`：初始设计库（`index.json` 元数据 + `designs/<id>.json` 单条完整内容）。
- 运行时 `~/.dsh/storages/ui-design/`：同结构，你的增删改都在这里。
- 2000+ 项时索引约 1.6MB，可一次加载；单条 demo 按需读取。

## 贡献

欢迎加设计、修 demo、提问题。提交前请读 [`设计规范.md`](./设计规范.md)——每项设计必须能通过「写 demo 前自检」那节。

1. 加一项设计：在页面里「+ 新建设计」，或在任意 dsh 会话里说「新建一个设计：……」；
2. 导出到仓库：`node scripts/export-data.mjs`（把 `~/.dsh/storages/ui-design/` 同步回 `data/`）；
3. 跑 `node scripts/validate.mjs`（待补）确认数据格式；
4. 提 PR。

## License

MIT
