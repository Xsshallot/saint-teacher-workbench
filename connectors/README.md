# connectors · 数据源连接器规范

每个连接器是一个目录，包含一个入口 `.mjs`，导出异步函数 `runImport(options)`，返回统计对象。

## 接口契约

```js
export async function runImport(options = {}) {
  // 读取数据源（问卷答卷 / 文档变更 / 会议记录…）
  // 按数据契约转换（docs/contracts/）
  // 写入 SQLite（server/src/db.js 提供工具）
  return {
    added: 0, updated: 0,        // 新增/更新行数
    students: 0, submissions: 0, // 各域计数（可自定义）
    elapsed_ms: 0,
  };
}
```

## 要求

1. **幂等**：重复运行不产生脏数据（推荐 clear-and-rebuild 或按唯一键 upsert）。
2. **写日志**：开始/结束写入 `syn_log`（服务端 `/api/sync/run` 已自动包裹）。
3. **契约对齐**：字段名与类型必须符合 `docs/contracts/*.schema.json`。
4. **密钥安全**：API Key / Token 一律从环境变量读取，禁止硬编码。

## 现有连接器

| 目录 | 数据源 | 状态 |
|---|---|---|
| `local-import/` | 本地已采集文件（问卷 NDJSON + 会议纪要 JSON） | ✅ v0.1 可用 |
| `tencent-survey/` | 腾讯问卷（拉取新答卷） | 🔜 预留 |
| `tencent-docs/` | 腾讯文档（增量变更） | 🔜 预留 |
| `tencent-meeting/` | 腾讯会议（会议记录/纪要） | 🔜 预留 |
| `feishu/` | 飞书问卷/文档（兼容渠道） | 🔜 预留 |

> 腾讯系连接器在 AI 助手（ZCode / WorkBuddy 等）中通过对应官方连接器（腾讯问卷、腾讯文档、腾讯会议 MCP）授权后调用其 API 实现，按本目录接口规范包装即可。
