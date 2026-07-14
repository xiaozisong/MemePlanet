# 09 · Hooks 路由

> 已启用 3 个安全钩子（配置在 `.cursor/hooks.json`）。完整 17 事件模板归档在 `.cursor/ecc-reference/hooks.full.json`，按需启用。

## 已启用 Hooks（3 个，低风险高价值）

| 事件 | 钩子 | 脚本 | 作用 |
|---|---|---|---|
| `beforeSubmitPrompt` | 密钥检测 | `.cursor/hooks/before-submit-prompt.js` | 提交 prompt 前检测 `sk-`/`ghp_`/`AKIA`/Slack token/私钥，防泄露 |
| `beforeReadFile` | 敏感文件警告 | `.cursor/hooks/before-read-file.js` | 读 `.env`/`.key`/`.pem`/credentials/secret 时警告 |
| `beforeShellExecution` | 阻断 `--no-verify` | `.cursor/hooks/before-shell-execution-block-no-verify.js` | 阻断 `git --no-verify` / `--no-gpg-sign`，保护 husky pre-commit/commit-msg/pre-push |

## 钩子机制

- **触发**：对应事件发生时自动执行脚本，无需手动调用。
- **适配器**：`.cursor/hooks/*.js`（事件入口）。
- **实现库**：`.cursor/scripts/hooks/*.js` + `.cursor/scripts/lib/*.js`。
- **严格度档位**：`export ECC_HOOK_PROFILE=standard`（minimal/standard/strict）。
- **禁用特定钩子**：`export ECC_DISABLED_HOOKS="pre:bash:tmux-reminder,post:edit:typecheck"`。

## 按需启用更多钩子

1. 从 `.cursor/ecc-reference/hooks.full.json` 复制目标事件条目到 `.cursor/hooks.json`
2. 脚本位于 `.cursor/hooks/*.js`（适配器）与 `.cursor/scripts/hooks/*.js`（实现）
3. **重型钩子启用前必设**：`export CLAUDE_PLUGIN_ROOT=/Users/xiaozisong/Desktop/MemeChatAI/.cursor`（否则 `session-start`/`session-end`/`after-file-edit` 等找不到 ECC 根）

### 可选启用钩子（评估后决定）

| 钩子 | 作用 | 风险/重叠 |
|---|---|---|
| `after-file-edit` | 编辑后自动 typecheck / console.log 检测 / 设计质量提醒 | 与 husky + lint-staged 重叠，谨慎 |
| `session-start` / `session-end` | 会话上下文持久化 | 与 `30-context-maintenance.mdc` 协议重叠，二选一 |
| `pre-compact` | 压缩前提示 | 低风险 |

## 典型场景

| 场景 | 钩子行为 |
|---|---|
| 我在 prompt 里贴了 API key | beforeSubmitPrompt 检测到并拦截 |
| Agent 想读 `.env` | beforeReadFile 警告（不阻断） |
| 我想 `git commit --no-verify` 跳过 husky | beforeShellExecution 阻断（保护 lint-staged） |

## 注意

- 当前 3 个钩子不依赖 `CLAUDE_PLUGIN_ROOT`，开箱即用。
- 启用重型钩子前务必设 `CLAUDE_PLUGIN_ROOT`，否则回退到 `~/.claude/` 找不到文件。
- `after-file-edit` 自动 typecheck 可能与项目 husky 流程重叠，建议二选一。
