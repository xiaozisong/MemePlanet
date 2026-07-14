# Harness 路由总索引 · MemeChatAI

> 本目录是项目「skill / MCP / rule / hook / tool」的**分类路由层**。Cursor 的 skill 与 rule 资产保持扁平加载（`.agents/skills/<name>/SKILL.md`、`.cursor/rules/*.mdc`），本目录按**技术方向**把它们归类，并给出「任务 → 该用哪个工具」的路由表。
>
> **Agent 使用约定**：接到任务后，先按技术方向读本目录对应文件，找到该用哪些 skill / rule / MCP，再开工。`.cursor/rules/05-harness-routes.mdc`（alwaysApply）会强制提醒这一步。

## 为什么不物理移动 skill/rule 文件？

- **skill 发现机制**：`skills-lock.json` 用扁平路径 `skills/<name>/SKILL.md` 锁定 skill；ECC skill 靠 frontmatter `name` 发现。物理嵌套会破坏锁同步与发现。
- **rule 加载机制**：`.cursor/rules/*.mdc` 靠 frontmatter `globs` / `alwaysApply` 自动加载，扁平结构是 Cursor 的加载契约。
- **正确做法**：资产保持扁平，路由层（本目录）做分类导航。这是 agent harness 的标准模式——agent 不浏览目录，它读路由表找工具。

## 技术方向（7 类 + 3 辅助）

| 方向 | 路由文件 | 覆盖 | skill 数 |
|---|---|---|---|
| 前端开发 | [01-frontend.md](01-frontend.md) | RN/Expo 移动端 + Next.js Web + React + UI/设计 | 21 |
| 后端开发 | [02-backend.md](02-backend.md) | NestJS + Drizzle + PG + Redis + BullMQ + Supabase + API | 12 |
| AI 编排 | [03-ai-orchestration.md](03-ai-orchestration.md) | LLM/图像/视频/TTS adapter + 成本熔断 + 推荐 + 评测 | 10 |
| 基础设施/DevOps | [04-infra-devops.md](04-infra-devops.md) | Docker + GitHub Actions + 部署 + 监控 + Git | 13 |
| 质量与测试 | [05-quality-testing.md](05-quality-testing.md) | Jest/Playwright + 安全评审 + 代码评审 + TDD | 12 |
| Agent 工程元层 | [06-agent-harness.md](06-agent-harness.md) | 7 个 ecc-agent + harness 元技能 + 编排 + 上下文预算 + 探索 + ADR | 37 |
| 项目上下文协议 | [07-project-context.md](07-project-context.md) | 项目自有 rules + 活状态文档 + 决策协议（无 skill） | 0 |
| MCP 服务 | [08-mcp-servers.md](08-mcp-servers.md) | 6 个已启用 MCP（context7/sequential-thinking/playwright 等） | — |
| Hooks | [09-hooks.md](09-hooks.md) | 3 个安全钩子（密钥检测/敏感文件/--no-verify 阻断） | — |
| 休眠资产 | [10-dormant.md](10-dormant.md) | 项目不用的语言/框架规则（Go/Rust/Java/Kotlin/Swift/Dart）+ 106 归档 skill | — |

**合计**：105 个活动 skill + 6 MCP + 73 条 rule（7 项目自有 + 66 ECC）+ 3 hook。

## 快速决策表（任务 → 路由）

| 我要做… | 看哪个路由 |
|---|---|
| 写 RN 页面 / Expo 导航 / 移动端 UI | 01-frontend |
| 写 Next.js 落地页 / 后台 / Tailwind+shadcn | 01-frontend |
| 写 NestJS Module/Controller/Service/DTO | 02-backend |
| 改表结构 / Drizzle 查询 / pgvector | 02-backend（drizzle-orm skill） |
| 写 AI 造梗/图片/视频/TTS 接口 | 03-ai-orchestration + 02-backend（bullmq-queue skill） |
| 做推荐 feed / RAG 检索 | 03-ai-orchestration（recsys-pipeline-architect） |
| 写 Dockerfile / docker-compose / CI | 04-infra-devops |
| 写测试 / E2E / 安全评审 | 05-quality-testing |
| 规划复杂功能 / 架构决策 / 代码评审 | 06-agent-harness（ecc-agent-* 技能） |
| 查项目当前状态 / 决策 / 更新上下文 | 07-project-context |
| 查 MCP 工具能用什么 | 08-mcp-servers |
| 查某语言规则为什么没生效 | 10-dormant |

## 调用方式速查

- **Skill**：`available_skills` 列表里看到名字 → 用 Read 读 `.agents/skills/<name>/SKILL.md` → 遵循其指引。无需"激活"，按需读即可。
- **Rule**：自动加载——`alwaysApply: true` 每次会话注入；`globs` 匹配文件时注入。无需手动调用。
- **MCP**：在 `mcp.json` 配置后，工具以 `CallMcpTool` 形式可用；资源以 `FetchMcpResource` 可读。
- **Hook**：在 `.cursor/hooks.json` 配置，对应事件自动触发（提交前/读文件前/执行命令前）。
- **Cursor Task 子代理**：`Task` 工具 + `subagent_type`（generalPurpose/explore/shell/cursor-guide/ci-investigator/bugbot/security-review/best-of-n-runner）。

## 维护

- 新增 skill/rule/MCP 后，**同步更新对应分类路由文件**与本索引的计数。
- skill 瘦身/归档后，更新 `10-dormant.md`。
- 本目录是活文档，随项目演进滚动更新（参见 `30-context-maintenance.mdc`）。

## 裁剪历史

| 日期 | 动作 | 影响 |
|---|---|---|
| 2026-07-13 | 移出 `vitest` / `detox` 至归档；清理幽灵引用 `production-audit`（04）/ `agent-sort`（06）；补注册 `architecture-decision-records`（06） | 活动 skill 107→105（-2 归档 +1 补注册），归档 236→238；04:14→13，05:14→12，06:36→37 |
| 2026-07-14 | **归档激进瘦身**：删除区块链/Web3/网络运维/医疗物流/营销/科研/ITO/不相关框架与集成等 ~132 个归档 skill | 归档 238→106（-55%），体积 7.4M→3.6M |
| 2026-07-14 | **休眠 rule 激进瘦身**：删除 Angular/Vue/Nuxt/Python/Perl/PHP/Ruby/ArkTS 共 8 语言 × 5 规则 = 40 个 .mdc 文件 | 休眠 rule 80→30（仅保留 Go/Rust/Java/Kotlin/Swift/Dart），ECC 总数 121→66 |
