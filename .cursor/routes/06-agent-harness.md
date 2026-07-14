# 06 · Agent 工程元层路由

> 覆盖：**7 个 ecc-agent 技能** + **harness 元技能** + **多 Agent 编排** + **上下文预算** + **代码库探索** + **MCP 构建**。
>
> 这一层是「让 Agent 用好其他工具」的元能力。规划/架构/评审/探索任务都从这里找工具。

## Skills（按需 Read `.agents/skills/<name>/SKILL.md`）

### 7 个核心 Agent 技能（ECC 转 skill）
| skill | 用途 | 何时读 |
|---|---|---|
| `ecc-agent-planner` | 实现规划（分阶段、文件级、风险） | 复杂功能/重构前规划 |
| `ecc-agent-architect` | 系统设计 | 架构决策 |
| `ecc-agent-code-reviewer` | 代码评审 | 写完代码后 |
| `ecc-agent-security-reviewer` | 安全分析 | 安全敏感代码 |
| `ecc-agent-build-error-resolver` | 修构建错误 | 构建/typecheck 失败 |
| `ecc-agent-refactor-cleaner` | 死代码清理 | 代码维护 |
| `ecc-agent-doc-updater` | 文档更新 | 更新 docs |

### Harness 元能力
| skill | 用途 | 何时读 |
|---|---|---|
| `agentic-engineering` | Agent 工程方法论 | 设计 agent 流程 |
| `agent-harness-construction` | harness 搭建 | 改 harness（本路由系统即产物） |
| `autonomous-agent-harness` | 自主 agent harness | 长时自主任务 |
| `agent-architecture-audit` | agent 架构审计 | 审 agent 设计 |
| `agent-introspection-debugging` | agent 自省调试 | 调 agent 行为 |
| `agent-browser` | 浏览器自动化 agent | web 抓取/测试 |

### 多 Agent 编排
| skill | 用途 | 何时读 |
|---|---|---|
| `plan-orchestrate` | 规划编排 | 编排多步任务 |
| `parallel-execution-optimizer` | 并行执行优化 | 独立任务并行 |
| `intent-driven-development` | 意图驱动开发 | 从意图到实现 |
| `orch-build-mvp` | MVP 编排 | 编排 MVP 构建 |
| `orch-pipeline` | 流水线编排 | 编排流水线 |
| `team-agent-orchestration` | 团队 agent 编排 | 多角色协作 |

### 上下文与预算
| skill | 用途 | 何时读 |
|---|---|---|
| `context-budget` | 上下文预算管理 | 上下文吃紧时 |
| `token-budget-advisor` | token 预算建议 | 控 token |
| `strategic-compact` | 策略性压缩 | 压缩上下文 |
| `recursive-decision-ledger` | 决策账本 | 记录决策链 |

### 探索与导航
| skill | 用途 | 何时读 |
|---|---|---|
| `code-tour` | 代码导览 | 给新人/agent 导览代码 |
| `codebase-onboarding` | 代码库上手 | 上手项目 |
| `search-first` | 搜索优先策略 | 找答案前先搜 |
| `deep-research` | 深度研究 | 复杂调研 |
| `workspace-surface-audit` | 工作区审计 | 审工作区状态 |

### MCP 构建与工具
| skill | 用途 | 何时读 |
|---|---|---|
| `mcp-builder` | 构建 MCP server | 自建 MCP |
| `mcp-server-patterns` | MCP server 模式 | 设计 MCP |
| `code-generator` | 代码生成辅助 | 脚手架/scaffold |
| `hookify-rules` | 规则转 hook | 把规则转成 hook |
| `skill-stocktake` | skill 盘点 | 盘点可用 skill |

### ECC 元工具
| skill | 用途 | 何时读 |
|---|---|---|
| `ecc-guide` | ECC 使用指南 | 查 ECC 用法 |
| `ecc-recipes` | ECC 配方 | 查 ECC 配方 |
| `ecc-tools-cost-audit` | 成本审计工具 | 审 AI 成本 |
| `architecture-decision-records` | 架构决策记录（ADR） | 记录/回顾架构决策 |

## Rules（自动加载，alwaysApply）

| rule | 路径 | 用途 |
|---|---|---|
| **ecc-common-agents** | `.cursor/rules/` | **Agent 编排总表**：Cursor Task `subagent_type` 映射 + 7 个 ecc-agent 技能 + 并行执行 + 多视角分析 |
| ecc-common-development-workflow | `.cursor/rules/` | feature 实现流程（plan→TDD→review→commit） |
| ecc-common-hooks | `.cursor/rules/` | hooks 系统说明 |
| ecc-common-patterns | `.cursor/rules/` | 通用模式（仓储、API 封装） |
| ecc-common-performance | `.cursor/rules/` | 模型选择策略、上下文管理 |

## Cursor Task 子代理（直接调用，无需 Read SKILL）

| subagent_type | 用途 |
|---|---|
| `generalPurpose` | 通用多步任务、复杂搜索 |
| `explore` | 只读代码库探索（quick/medium/very thorough） |
| `shell` | 命令执行专家（git 等） |
| `cursor-guide` | Cursor 产品文档问答 |
| `ci-investigator` | 诊断失败 CI 检查 |
| `bugbot` | Bugbot 风格本地评审（用户显式要求） |
| `security-review` | 安全评审本地改动（用户显式要求） |
| `best-of-n-runner` | 隔离 worktree 并行 N 次尝试 |

## 典型任务 → 工具选择

| 任务 | 用什么 |
|---|---|
| 规划复杂功能 | Read `ecc-agent-planner` + 必要时 `SwitchMode` 到 Plan |
| 架构决策 | Read `ecc-agent-architect` + 查 `docs/context/decisions.md`（改决策需用户确认，见 `07-project-context.md`） |
| 代码评审 | Read `ecc-agent-code-reviewer` 或 Task `bugbot` subagent |
| 安全评审 | Read `ecc-agent-security-reviewer` 或 Task `security-review` subagent |
| 修构建错误 | Read `ecc-agent-build-error-resolver` |
| 探索代码库 | Task `explore` subagent（无需 Read skill） |
| 并行独立任务 | 一条消息发多个 Task（`parallel-execution-optimizer` 思路） |
| 上下文快满 | `context-budget` + `strategic-compact` + `token-budget-advisor` |
| 给新人导览 | `code-tour` + `codebase-onboarding` |
| 审 AI 成本 | `ecc-tools-cost-audit` + `cost-tracking`（见 `03-ai-orchestration.md`） |

## 关键提醒

- Cursor 子代理走**固定 `subagent_type`**，不加载 `~/.claude/agents/*.md`（见 `ecc-common-agents.mdc` 适配说明）。
- 决策类任务**必须先查 `docs/context/decisions.md`**，变更需用户确认（30 协议，见 `07-project-context.md`）。
- 规划产出写到 `docs/context/execution-plan.md`，用 5 态状态字段（⏳/🔄/✅/❌/⏭️）。
