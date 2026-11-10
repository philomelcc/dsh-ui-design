/**
 * UI 设计知识库 —— Host 半（独立插件，不依赖工作台）。
 *
 * 三件事：
 *   1) 数据：`~/.dsh/storages/ui-design/`（索引 + 每项一个文件，见 store.js）
 *   2) 页面数据：`/ui-design/*` 的 CRUD 路由（`/wb/ui-design/*` 保留兼容）
 *   3) 给 agent 用：`ui_design` 工具（search/list/get/create/update/delete/guide）+ 系统提示
 */
import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineTool } from "./lib/tool.js";
import { loadEmbeddingConfig, rerankByVectors } from "./lib/embedding.js";
import {
  listDesigns,
  listTags,
  getDesign,
  createDesign,
  updateDesign,
  deleteDesign,
  dataFile,
} from "./lib/store.js";

export const inject = ["webServer", "tools", "systemPrompt"];

const MAX_BODY = 2 * 1024 * 1024;

/** 《设计规范》随工具一起发给 agent：新建/修改 demo 前先读。按 mtime 缓存，改文件立即生效。 */
const GUIDE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "设计规范.md");
let guideCache = { mtime: -1, text: "" };
function designGuide() {
  try {
    const mtime = statSync(GUIDE_PATH).mtimeMs;
    if (mtime !== guideCache.mtime) {
      guideCache = { mtime, text: readFileSync(GUIDE_PATH, "utf8") };
    }
    return guideCache.text;
  } catch (_error) {
    return "（设计规范文件缺失）demo 必须：用 --ui-* 主题变量、点击类演示加 __uiDemoCursor、自动播放包在 !window.__uiInteractive 里、小视口加 @media (max-height:420px)、动画用 el.animate()、flex 子项防压缩。";
  }
}

function text(content) {
  return [{ type: "text", text: content }];
}

function send(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function isLoopback(req) {
  const address = req.socket?.remoteAddress || "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY) {
        fail(new Error("请求体太大（上限 2 MB）"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_error) {
        reject(new Error("请求体不是合法 JSON"));
      }
    });
    req.on("error", fail);
  });
}

function route(handler) {
  return async (req, res) => {
    if (!isLoopback(req)) {
      send(res, 403, { ok: false, error: "只允许本机访问" });
      return;
    }
    try {
      await handler(req, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      send(res, 400, { ok: false, at: Date.now(), error: message });
    }
  };
}

const ok = (res, extra) => send(res, 200, { ok: true, at: Date.now(), ...extra });

function query(url) {
  try {
    return new URL(url, "http://localhost").searchParams;
  } catch (_error) {
    return new URLSearchParams();
  }
}

export function apply(ctx) {
  // ── 页面数据端点 ──────────────────────────────────────────────────────
  // 新路径 `/ui-design/*`；旧 `/wb/ui-design/*` 同时保留一版兼容。
  const handlers = {
    list: route(async (req, res) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        send(res, 405, { ok: false, error: "只支持 GET" });
        return;
      }
      const params = query(req.url);
      const result = listDesigns({
        q: params.get("q") || "",
        tag: params.get("tag") || "",
        offset: Number(params.get("offset") || 0),
        limit: Number(params.get("limit") || 0),
      });
      ok(res, {
        designs: result.items,
        total: result.total,
        offset: result.offset,
        limit: result.limit,
        tags: listTags(),
        dataFile: dataFile(),
      });
    }),

    /** 旧工作台页面的兼容入口：一次返回全部完整设计（分页客户端改造完之前先用这个）。 */
    listFull: route(async (req, res) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        send(res, 405, { ok: false, error: "只支持 GET" });
        return;
      }
      const metas = listDesigns({ limit: 0 }).items;
      const designs = metas.map((m) => getDesign(m.id)).filter(Boolean);
      ok(res, { designs, tags: listTags(), dataFile: dataFile() });
    }),

    get: route(async (req, res) => {
      const params = query(req.url);
      const key = params.get("id") || params.get("name");
      if (!key) throw new Error("要取哪项设计？请给 id 或 name");
      const design = getDesign(key);
      if (!design) throw new Error(`没找到设计「${key}」`);
      ok(res, { design });
    }),

    tags: route(async (req, res) => {
      ok(res, { tags: listTags() });
    }),

    create: route(async (req, res) => {
      if (req.method !== "POST") {
        send(res, 405, { ok: false, error: "只支持 POST" });
        return;
      }
      const body = await readJson(req);
      const design = createDesign({
        name: body.name,
        tags: body.tags,
        summary: body.summary,
        usage: body.usage,
        caution: body.caution,
        hint: body.hint,
        prompt: body.prompt,
        demoHtml: body.demoHtml,
      });
      ok(res, { design });
    }),

    update: route(async (req, res) => {
      if (req.method !== "POST") {
        send(res, 405, { ok: false, error: "只支持 POST" });
        return;
      }
      const body = await readJson(req);
      const key = body.id || body.name;
      if (!key) throw new Error("要更新哪项设计？请给 id 或 name");
      const patch = {};
      for (const field of ["name", "tags", "summary", "usage", "caution", "hint", "prompt", "demoHtml"]) {
        if (body[field] !== undefined) patch[field] = body[field];
      }
      const design = updateDesign(key, patch);
      ok(res, { design });
    }),

    delete: route(async (req, res) => {
      if (req.method !== "POST") {
        send(res, 405, { ok: false, error: "只支持 POST" });
        return;
      }
      const body = await readJson(req);
      const key = body.id || body.name;
      if (!key) throw new Error("要删除哪项设计？请给 id 或 name");
      const design = deleteDesign(key);
      ok(res, { id: design.id, name: design.name });
    }),
  };

  for (const [name, handler] of Object.entries(handlers)) {
    for (const prefix of ["/ui-design", "/wb/ui-design"]) {
      // `/wb/ui-design/list` 单独注册成全量兼容入口，这里跳过
      if (prefix === "/wb/ui-design" && name === "list") continue;
      ctx.effect(
        () =>
          ctx.webServer.register({
            kind: "exact",
            path: `${prefix}/${name}`,
            handler,
          }),
        `ui-design: route ${prefix}/${name}`,
      );
    }
  }

  // 旧工作台页面：/wb/ui-design/list 返回全量完整数据（兼容）
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: "/wb/ui-design/list",
        handler: handlers.listFull,
      }),
    "ui-design: route /wb/ui-design/list (full)",
  );

  // ── agent 工具 ────────────────────────────────────────────────────────
  const uiDesign = defineTool({
    name: "ui_design",
    description: [
      "前端设计知识库：每项设计含名称、tag、适用/不适用场景、实现提示词（prompt）和可交互演示（demoHtml）。",
      "做前端 UI 任务（页面、组件、交互动画、加载态等）前，先 action=\"search\" 查候选（只返回名称/tag/场景，不带 demo）；匹配的用 action=\"get\" 取提示词再实现；没有合适的就自己设计，不要硬套。",
      "get 之后以 prompt 和 demo 为实现基准（demo 是可运行参考，必要时 includeDemo=true 取完整代码），逐条照做、不要凭印象简化。",
      "用户明确说「以（设计名）的形式实现」「按知识库里的 XX 做」时，直接 action=\"get\"。",
      "用户让你新建/修改设计时，先 action=\"guide\" 读《设计规范》，再用 create/update 写回（demoHtml 必须是完整可运行的 HTML）。",
    ].join(" "),
    parameters: {
      action: {
        type: "string",
        required: true,
        enum: ["search", "list", "get", "tags", "guide", "create", "update", "delete"],
        description:
          "search 搜候选 / list 分页浏览 / get 取提示词 / tags 看标签 / guide 读设计规范 / create 新建 / update 修改 / delete 删除",
      },
      id: { type: "string", description: "设计 id（比 name 更精确，优先使用）" },
      name: { type: "string", description: "设计名：get/update/delete 用它定位；create 时是新设计名" },
      newName: { type: "string", description: "update 时改的新名字" },
      tags: { type: "array", items: { type: "string" }, description: "标签数组，例如 [\"导航\",\"展开\"]" },
      aliases: { type: "array", items: { type: "string" }, description: "别名/同义词（可选，帮助搜索命中，例如 [\"loading\",\"载入\"]）" },
      summary: { type: "string", description: "一句话说明（显示在卡片上）" },
      usage: { type: "string", description: "适用场景：什么情况下该用这套设计" },
      caution: { type: "string", description: "不适用场景：什么情况下不该用、有什么限制" },
      hint: { type: "string", description: "操作提示（页面渲染在 demo 外面，demo 里不要写 hint 元素）" },
      inspiration: { type: "string", description: "灵感来源（可选，≤200 字，例如参考的视频/网页/开源库；版权与来源透明化用）" },
      prompt: { type: "string", description: "给 AI 的实现提示词：结构、动画参数、交互、无障碍、坑" },
      demoHtml: { type: "string", description: "完整可交互的 HTML demo（DOCTYPE 到 </html>，自带样式与脚本）" },
      query: { type: "string", description: "search/list 的搜索词：名字、标签、场景里的词，空格分隔" },
      tag: { type: "string", description: "search/list 时只返回含这个 tag 的设计" },
      offset: { type: "number", description: "search/list 分页起点（默认 0）" },
      limit: { type: "number", description: "search/list 每页条数（默认 search 8、list 30）" },
      includeDemo: { type: "boolean", description: "get 时是否连 demoHtml 全文一起返回（默认 false）" },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: { text: { type: "string" } },
        required: ["text"],
      },
      render(_args, value) {
        return text(value.text);
      },
    },
    async execute(args) {
      const action = String(args.action);
      const key = args.id || args.name;

      if (action === "search" || action === "list") {
        const isSearch = action === "search";
        const offset = Number(args.offset || 0);
        const limit = Number(args.limit) > 0 ? Number(args.limit) : isSearch ? 8 : 30;
        // search 多取候选给语义重排留空间；list 保持分页语义
        const fetchLimit = isSearch ? Math.min(limit * 3, 60) : limit;
        const result = listDesigns({
          q: String(args.query || ""),
          tag: String(args.tag || ""),
          offset: isSearch ? 0 : offset,
          limit: fetchLimit,
        });
        let rerankedByVectors = false;
        if (isSearch && result.items.length > 1) {
          const config = loadEmbeddingConfig();
          if (config) {
            try {
              const reranked = await rerankByVectors(config, result.items, String(args.query || ""));
              result.items = reranked.slice(0, limit);
              rerankedByVectors = true;
            } catch (_error) {
              result.items = result.items.slice(0, limit);
            }
          } else {
            result.items = result.items.slice(0, limit);
          }
        }
        const all = listDesigns({ limit: 0 });
        if (result.total === 0) {
          return {
            text: `没有匹配的设计（共 ${all.total} 项）。没有合适的就按自己的方案实现，不要为了用而用。\ntag 概览：${listTags()
              .map((t) => `${t.tag}×${t.count}`)
              .join("、") || "无"}`,
          };
        }
        const lines = [
          `匹配 ${result.total} 项（显示 ${result.items.length} 项，共 ${all.total} 项；tag：${listTags()
            .map((t) => `${t.tag}×${t.count}`)
            .join("、") || "无"}）：`,
        ];
        if (result.mode === "fuzzy") {
          lines.push("（没有词面直接命中，下面是字面相近的候选，可能不相关——没有合适的就自己设计。）");
        }
        if (rerankedByVectors) {
          lines.push("（已用本地 embedding 做语义重排。）");
        }
        for (const d of result.items) {
          const bits = [
            `- ${d.name}${d.tags.length ? ` [${d.tags.join(", ")}]` : ""}`,
            d.summary ? `— ${d.summary}` : "",
          ];
          if (d.usage) bits.push(`\n  适用：${d.usage}`);
          if (d.caution) bits.push(`\n  不适用：${d.caution}`);
          bits.push(`\n  id: ${d.id}`);
          lines.push(bits.join(""));
        }
        if (result.total > result.items.length) {
          lines.push(`还有 ${result.total - result.items.length} 项没显示，可加 offset 翻页或收窄 query/tag。`);
        }
        lines.push("匹配的用 action=get + name 或 id 取完整提示词。");
        return { text: lines.join("\n") };
      }

      if (action === "tags") {
        const tags = listTags();
        return {
          text: tags.length
            ? `tag 列表：\n${tags.map((t) => `- ${t.tag}（${t.count} 项）`).join("\n")}`
            : "还没有任何 tag。",
        };
      }

      if (action === "guide") {
        return { text: designGuide() };
      }

      if (action === "get") {
        if (!key) throw new Error("get 需要 id 或 name");
        const design = getDesign(key);
        if (!design) {
          const all = listDesigns({ limit: 30 });
          throw new Error(
            `没找到设计「${key}」。可以用 action=search 按场景找；现有前 ${all.items.length} 项：${all.items
              .map((d) => d.name)
              .join("、") || "（空）"}。`,
          );
        }
        const lines = [
          `【${design.name}】`,
          design.tags.length ? `tag：${design.tags.join("、")}` : "tag：无",
          design.summary ? `说明：${design.summary}` : "",
          design.usage ? `适用：${design.usage}` : "",
          design.caution ? `不适用：${design.caution}` : "",
          design.hint ? `操作提示：${design.hint}` : "",
          "",
          "实现提示词：",
          design.prompt,
          "",
          args.includeDemo
            ? `参考 demo（完整 HTML，可直接对照实现）：\n${design.demoHtml}`
            : `还有一份可交互 demo（${design.demoHtml.length} 字符）；需要参考代码时用 includeDemo=true 再取一次。`,
          "",
          "实现要求：以 prompt 和 demo 为基准（demo 是可运行参考，优先照它的结构/参数/细节），不要凭印象简化；",
          "产出后逐条核对 prompt 里的参数（尺寸、时长、颜色、交互细节），漏一条都要补上。",
        ].filter(Boolean);
        return { text: lines.join("\n") };
      }

      if (action === "create") {
        const design = createDesign({
          name: args.name,
          tags: args.tags,
          aliases: args.aliases,
          summary: args.summary,
          usage: args.usage,
          caution: args.caution,
          hint: args.hint,
          inspiration: args.inspiration,
          prompt: args.prompt,
          demoHtml: args.demoHtml,
        });
        return {
          text: `已创建「${design.name}」（id: ${design.id}，tag：${design.tags.join("、") || "无"}）。UI设计页刷新即可看到。${
            design.usage || design.caution ? "" : "（还没写使用场景，建议补一下 usage/caution。）"
          }`,
        };
      }

      if (action === "update") {
        if (!key) throw new Error("update 需要 id 或 name 指定要改哪项设计");
        const patch = {};
        for (const field of ["tags", "aliases", "summary", "usage", "caution", "hint", "inspiration", "prompt", "demoHtml"]) {
          if (args[field] !== undefined) patch[field] = args[field];
        }
        if (args.newName !== undefined) patch.name = args.newName;
        const design = updateDesign(key, patch);
        return {
          text: `已更新「${design.name}」（id: ${design.id}）；改动字段：${Object.keys(patch).join("、") || "无"}。`,
        };
      }

      if (action === "delete") {
        const design = deleteDesign(key);
        return { text: `已删除「${design.name}」（id: ${design.id}）。` };
      }

      throw new Error(`未知 action：${action}`);
    },
  });

  ctx.effect(() => ctx.tools.register(uiDesign), "ui-design: tool ui_design");

  // ── 系统提示 ──────────────────────────────────────────────────────────
  ctx.effect(
    () =>
      ctx.systemPrompt.section({
        name: "ui-design-library",
        order: 1001,
        text: [
          "前端有一套设计知识库（UI设计）：每项设计带 tag、适用/不适用场景、实现提示词和可交互 demo。",
          "做前端 UI 任务（页面、组件、交互动画、加载态等）前，先调用 ui_design 的 action=\"search\" 按场景查候选（返回名称/tag/场景，不带 demo）；匹配的用 action=\"get\" 取提示词再实现；确实没有合适的设计就按自己的方案实现，不要硬套。",
          "用设计实现时：get 返回的 prompt 和 demo 是**实现依据**，不是参考资料——以 demo 为基准（必要时 includeDemo=true 取完整代码），逐条照 prompt 里的结构/尺寸/时长/颜色/交互细节实现，不要凭印象简化；产出后对照 prompt 自检一遍，漏的补上。",
          "用户明确说「以（设计名）的形式实现」「按知识库里的 XX 做」时，直接 action=\"get\"。",
          "用户让你新建/修改设计时，先 action=\"guide\" 读《设计规范》，再用 create/update 写回知识库（demoHtml 必须是完整可运行的 HTML；usage 写适用场景、caution 写不适用场景——尽量写，不是必填）。",
        ].join("\n"),
      }),
    "ui-design: prompt section",
  );
}
