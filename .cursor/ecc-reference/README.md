# ECC 迁移参考与启用指南

本目录归档 ECC（Everything Claude Code）迁移过程中**未默认启用**的完整模板，供按需开启。

## 概览

| 组件 | 活动位置 | 状态 | 完整模板 |
|---|---|---|---|
| Rules | `.cursor/rules/ecc-*.mdc` | 全量启用（121 条） | — |
| Skills | `.agents/skills/<name>/` | 项目相关子集启用（104 个） | `.cursor/ecc-reference/skills/`（236 个归档） |
| MCP | `.cursor/mcp.json` | 安全子集启用（6 个无 key） | `mcp-servers.full.json` |
| Hooks | `.cursor/hooks.json` | 安全子集启用（3 个） | `hooks.full.json` |
| Agents | `.agents/skills/ecc-agent-*/` + `.cursor/ecc-reference/agents/` | 7 个核心转技能，其余归档 | `agents/` |

## Skills：归档与按需启用

`.agents/skills/` 当前只保留 **104 个与项目技术栈/agent harness 相关**的 skill（TS/NestJS/Next/RN/Expo/PG/Redis/Docker/Jest/Vitest/Playwright/Detox + AI 编排/推荐/合规 + 7 个 ecc-agent + harness 元技能）。

其余 **236 个无关 skill**（Go/Rust/Java/Kotlin/Swift/Perl/PHP/Ruby/Angular/Vue/Flutter/Dart/ArkTS/C++/C#/F#/Spring/Quarkus/Laravel/Django/Fastapi/Prisma/MySQL/Oracle/ClickHouse/ES + healthcare/finance/logistics/trading/networking/homelab/scientific/marketing 等领域 skill）已归档到 `.cursor/ecc-reference/skills/`，不进入会话上下文。

### 启用归档 skill
1. 把目标目录从 `.cursor/ecc-reference/skills/<name>/` 移回 `.agents/skills/<name>/`
2. 重启 Cursor 会话
3. **警告**：同时启用的 skill 越多，`available_skills` 列表注入上下文越多，会挤压可用上下文窗口。建议只在确实需要时启用单个。

## MCP：启用更多服务

`mcp-servers.full.json` 含 30+ MCP 服务模板。启用步骤：
1. 把目标条目复制到 `../mcp.json` 的 `mcpServers` 下
2. 把 `YOUR_*_HERE` 占位符替换为真实 API key
3. 重启 Cursor

**警告**：同时启用的 MCP 不宜超过 10 个，否则 200k 上下文窗口可能被压缩到 70k（ECC README 原警告）。

## Hooks：启用完整钩子集

`hooks.full.json` 是 ECC 原始完整钩子配置（17 个事件）。当前活动 `.cursor/hooks.json` 只启用 3 个低风险高价值钩子：
- `beforeSubmitPrompt` — 提交前密钥检测
- `beforeReadFile` — 敏感文件读取警告
- `beforeShellExecution` — 阻断 `git --no-verify` 钩子绕过

### 启用更多钩子

1. 从 `hooks.full.json` 复制目标事件条目到 `../hooks.json`
2. 钩子脚本位于 `.cursor/hooks/*.js`（适配器）与 `.cursor/scripts/hooks/*.js`（实现）
3. 设置严格度档位：`export ECC_HOOK_PROFILE=standard`（minimal/standard/strict）
4. 按需禁用特定钩子：`export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"`

### 已做的路径适配

ECC 原始钩子假设脚本在仓库根 `scripts/`。迁移时为避免污染项目根 `scripts/`（项目已有 4 个 .sh），把 ECC 脚本树放在 `.cursor/scripts/`，并修改了 3 处引用：
- `.cursor/hooks/adapter.js` 的 `getPluginRoot()` → `path.resolve(__dirname, '..')`（指向 `.cursor/`）
- `.cursor/hooks/before-shell-execution-block-no-verify.js` 的 require → `../scripts/hooks/block-no-verify`
- `.cursor/hooks/before-shell-execution.js` 的 require → `../scripts/lib/shell-split`

### 注意事项

- 部分重型钩子（`session-start`、`session-end`、`evaluate-session`、`cost-tracker`、`design-quality-check`、`after-file-edit` 自动 typecheck）依赖 `.cursor/scripts/lib/resolve-ecc-root.js`，该模块会回退到 `~/.claude/` 查找 ECC 根，在纯 Cursor 环境下可能找不到预期文件。启用这些钩子前，设置 `export CLAUDE_PLUGIN_ROOT=/Users/xiaozisong/Desktop/MemeChatAI/.cursor` 让其正确定位。
- `after-file-edit` 钩子会在每次文件编辑后自动跑 typecheck / console.log 检测 / 前端设计质量提醒，可能与项目自有 husky + lint-staged 流程重叠，建议谨慎启用。
- `session-start` / `session-end` 钩子的上下文持久化与项目 `30-context-maintenance.mdc` 协议可能重叠，二选一即可。

## Agents

- 核心 7 个已转为技能：`.agents/skills/ecc-agent-{planner,architect,code-reviewer,security-reviewer,build-error-resolver,refactor-cleaner,doc-updater}/SKILL.md`
- 其余 60 个归档于 `.cursor/ecc-reference/agents/*.md`，仅作查阅参考（Cursor 子代理走固定 subagent_type，不直接加载自定义 agent .md）

## Commands / Contexts

未迁移（Cursor 无 `/plugin` 斜杠命令体系；功能由对应 skills 覆盖）。
