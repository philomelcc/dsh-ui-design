/**
 * 极简 defineTool：把参数 DSL 编译成 JSON Schema，并做基本校验。
 *
 * 不 import `@deepseek-ai/dsh-tools` —— 插件以 link 方式安装时，模块解析从
 * workspace 物理路径开始，找不到 profile 里的 dsh 包。工具定义本身是普通对象，
 * 只要字段齐全就能注册。（做法和 `dsh-fast-download/lib/tool.js` 一致。）
 */
export function compileParameters(parameters = {}) {
  const properties = {};
  const required = [];
  for (const [key, spec] of Object.entries(parameters)) {
    const { required: isRequired, ...rest } = spec ?? {};
    properties[key] = { ...rest };
    if (isRequired === true) required.push(key);
  }
  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties: false,
  };
}

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

export function validateArguments(schema, args) {
  const violations = [];
  const value = args && typeof args === "object" ? args : {};
  for (const key of schema.required ?? []) {
    if (value[key] === undefined || value[key] === null) violations.push(`缺少必填参数: ${key}`);
  }
  for (const [key, propSchema] of Object.entries(schema.properties ?? {})) {
    const given = value[key];
    if (given === undefined || given === null) continue;
    const expected = propSchema.type;
    if (!expected) continue;
    const actual = typeOf(given);
    const ok =
      expected === "number" ? actual === "number" || actual === "integer" : actual === expected;
    if (!ok) violations.push(`参数 ${key} 应为 ${expected}，收到 ${actual}`);
  }
  return violations;
}

export function defineTool(options) {
  const schema = compileParameters(options.parameters);
  return {
    name: options.name,
    description: options.description,
    parameters: schema,
    output: options.output,
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
    async execute(args, exec) {
      const violations = validateArguments(schema, args);
      if (violations.length > 0) {
        const error = new Error(`参数不合法: ${violations.join("; ")}`);
        error.code = "invalid_arguments";
        throw error;
      }
      return await options.execute(args ?? {}, exec);
    },
  };
}
