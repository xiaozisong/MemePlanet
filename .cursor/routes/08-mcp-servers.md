# 08 · MCP 服务路由

> 已启用 6 个无 key MCP（配置在 `.cursor/mcp.json`）。完整 30+ 模板归档在 `.cursor/ecc-reference/mcp-servers.full.json`，按需复制启用（需填 key，**同时启用不宜超过 10 个**，否则上下文窗口被压缩）。

## 已启用 MCP（6 个）

| MCP | 类型 | 用途 | 何时用 |
|---|---|---|---|
| **context7** | npx | Upstash 文档上下文检索 | 查第三方库/框架最新文档（Vercel AI SDK / DeepSeek / 豆包 / Drizzle 等） |
| **sequential-thinking** | npx | 分步推理 | 复杂架构/算法决策时分步推理 |
| **playwright** | npx | 浏览器自动化（chrome） | Web E2E 测试、抓页面、UI 自动化（配合 `05-quality-testing.md`） |
| **chrome-devtools** | npx | Chrome DevTools 协议 | 调 Web 性能/网络/控制台（配合 `01-frontend.md`） |
| **cloudflare-docs** | http | Cloudflare 文档 | 查 R2 / 边缘部署文档（配合 `04-infra-devops.md`） |
| **parallel-search** | http | 并行搜索 | 并行检索多源信息 |

## Cursor 内置 MCP

| MCP | 用途 |
|---|---|
| **cursor-app-control** | 控制 Cursor 本身：`move_agent_to_root` / `create_project` / `open_resource` / `rename_chat` / `cursor_dialog`（用户规则管理） |

## 调用方式

- **工具**：`CallMcpTool`（server 名 + tool 名 + 参数）。**调用前必须先读 tool 的 schema**（在 `/Users/xiaozisong/.cursor/projects/.../mcps/<server>/tools/<tool>.json`）。
- **资源**：`FetchMcpResource`（server 名 + URI）。
- **认证**：某 server 需认证时，先 `mcp_auth` 认证该 server，再重试。

## 按需启用更多 MCP

1. 打开 `.cursor/ecc-reference/mcp-servers.full.json`
2. 把目标条目复制到 `.cursor/mcp.json` 的 `mcpServers`
3. 替换 `YOUR_*_HERE` 占位符为真实 API key
4. 重启 Cursor

### 建议后续启用（按项目需求）

| MCP | 用途 | 需 key | 优先级 |
|---|---|---|---|
| postgres | DB 直连，做 schema 变更后直接验证 DDL | 是 | 中（S2 改表频繁时） |
| supabase | Supabase 项目管理（Auth/Realtime/DB） | 是 | 中（S1 登录开发时） |
| sentry | 错误监控查询 | 是 | 低（上线后） |

## 典型任务 → MCP 选择

| 任务 | 用什么 MCP |
|---|---|
| 查 Drizzle/NestJS/Next.js/Vercel AI SDK 文档 | context7 |
| 复杂架构分步决策 | sequential-thinking |
| 写/跑 Web Playwright E2E | playwright |
| 调 Web 性能/网络 | chrome-devtools |
| 查 Cloudflare R2/边缘配置 | cloudflare-docs |
| 并行检索多源资料 | parallel-search |
| 把会话移到新 worktree 根 | cursor-app-control（`move_agent_to_root`） |

## 注意

- MCP 工具调用前**必须读 schema**，否则参数易错。
- 同时启用 MCP ≤ 10，避免 200k 上下文压缩到 70k。
- http 类型 MCP 无需本地 npx，直接配置 `url`。
