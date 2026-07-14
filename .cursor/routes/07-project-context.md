# 07 · 项目上下文协议路由

> 覆盖：**项目自有 rules**（6 条，最高优先级）+ **ECC 优先级规则** + **活状态文档**（`docs/context/`）+ **决策协议**。
>
> 这一层是「保证跨会话不漂移」的契约。**每次会话开头先读这里**。本类无 skill，全是规则与文档。

## 活状态文档（每次会话开头读）

| 文档 | 路径 | 用途 | 何时读 |
|---|---|---|---|
| activeContext | `docs/context/activeContext.md` | 当前在做什么 / 下一步 / 阻塞 / 待确认 | **每次会话开头强制读** |
| progress | `docs/context/progress.md` | 已完成清单 / 总体进度 / 技术债 | 看进度、找文件 |
| decisions | `docs/context/decisions.md` | 13 项已定稿决策（冻结文档） | 想质疑/回顾决策时（**改前必须用户确认**） |
| execution-plan | `docs/context/execution-plan.md` | M1 详细执行计划（S0+S1~S4 技术点级） | 推进 M1 编码任务时 |

## 项目自有 Rules（最高优先级，alwaysApply 或 globs）

| rule | 路径 | 加载 | 核心内容 |
|---|---|---|---|
| `00-project-context.mdc` | `.cursor/rules/` | **alwaysApply** | 一句话定位 + 技术栈表 + 文档索引 + 上下文维护协议 + 当前阶段 + 核心约定 9 条 + 代码风格 + 快速启动命令 |
| `10-coding-conventions.mdc` | `.cursor/rules/` | globs `apps/**,packages/**` | 后端/前端/共享层/数据库/提交规范/禁止事项的**强制编码约定** |
| `20-m1-sprint.mdc` | `.cursor/rules/` | 手动引用 | M1 必须交付 P0 + 工时现实 + 砍项建议 + 关键路径 + 退出标准 + 待确认 |
| `25-execution-plan.mdc` | `.cursor/rules/` | **alwaysApply** | 执行计划推进协议：会话开头自检 + 任务推进流程 + 状态字段 5 态 + DoD |
| `30-context-maintenance.mdc` | `.cursor/rules/` | **alwaysApply** | 上下文维护协议：何时更新哪个文件 + DoD + 文件修改权限表 + 上下文压缩 + 自动化工具 |
| `update-context.mdc` | `.cursor/rules/` | 手动引用 | `/update-context` 斜杠命令：全量同步上下文 |
| `05-harness-routes.mdc` | `.cursor/rules/` | **alwaysApply** | **本路由系统的指引**：做任务前按技术方向查 `.cursor/routes/` |

## ECC 优先级规则

| rule | 路径 | 加载 | 内容 |
|---|---|---|---|
| `ecc-00-precedence.mdc` | `.cursor/rules/` | alwaysApply | ECC 迁移规则优先级：项目自有规则 > ECC；冲突以项目为准 |

## 静态设计文档（改前需用户确认）

| 文档 | 路径 | 何时改 |
|---|---|---|
| `docs/PRD.md` | 产品需求（10 模块/MVP/路线图） | 改产品逻辑前，**需用户确认** |
| `docs/TechnicalDesign.md` | 技术架构（选型/成本/ER/时序/Agent） | 改架构前，**需用户确认** |
| `docs/M1-Sprint-Plan.md` | M1 任务清单（75 任务/甘特/砍项） | 规划/执行 M1 时 |
| `docs/Database-DDL.md` | 数据库设计说明 | 改表时同步（4 处之一） |
| `docs/db/schema.sql` | 50 表 DDL（权威） | 改表时同步（4 处之一） |
| `docs/db/seed.sql` | 种子数据 | 跑测试/demo |
| `docs/API-Spec.md` | REST API 详设（34 接口） | 改接口时同步（2 处之一） |
| `docs/openapi.yaml` | OpenAPI 3.1.0 | 改接口时同步（2 处之一），跑 `pnpm gen:api` |

## 同步协议（必须遵守，见 `30-context-maintenance.mdc`）

| 触发 | 同步动作 |
|---|---|
| 完成一个 M1 任务 | 更新 `activeContext.md`（已完成/进行中/会话历史）+ `progress.md`（勾选）+ `execution-plan.md`（状态→✅ + 完成日期） |
| 完成一个 Sprint | 更新 `progress.md` 总体进度表 + `execution-plan.md` §0 路线图 |
| **表结构变更** | 同步改 **4 处**：schema.sql + Database-DDL.md + Drizzle schema.ts + openapi.yaml；跑 `pnpm --filter @memestar/backend db:generate` |
| **接口变更** | 同步改 **2 处**：openapi.yaml + API-Spec.md；跑 `pnpm gen:api` |
| **决策变更** | **必须先与用户确认** → 改 `decisions.md`（新 ADR 或改状态）+ TechnicalDesign.md + 00-project-context.mdc |
| 发现 Bug/技术债 | 更新 `progress.md` 已知问题区；严重的同步到 `activeContext.md` 阻塞区 |
| 会话结束前 | 强制更新 `activeContext.md`（时间戳 + 会话历史 + 下一步） |

## 文件修改权限表（见 `30-context-maintenance.mdc`）

| 文件 | 谁能改 |
|---|---|
| `activeContext.md` / `progress.md` / `execution-plan.md` / `20-m1-sprint.mdc` | Agent 自主改 |
| `schema.sql` / `openapi.yaml` | Agent 改（同步其余处） |
| `decisions.md` / `PRD.md` / `TechnicalDesign.md` / `00-project-context.mdc` / `10-coding-conventions.mdc` | **必须用户确认后改** |

## 自动化校验工具

| 工具 | 用法 | 作用 |
|---|---|---|
| `pnpm check:context` | 本地手动 | 10 项一致性校验 |
| `scripts/check-context-sync.sh` | bash | 退出码 0/1/2 |
| `.github/workflows/context-sync.yml` | PR 自动 | 校验 + PR 评论；**严重漂移（exit 2）阻断 PR** |
| husky pre-commit | git commit 时 | lint-staged + 上下文软检查 |
| `/update-context` 斜杠命令 | 对话输入 | 全量同步上下文 |

## 典型任务 → 工具选择

| 任务 | 用什么 |
|---|---|
| 会话开头对齐 | Read `activeContext.md` → `progress.md` 未完成项 → `25-execution-plan.mdc` 当前 Sprint |
| 推进一个 M1 任务 | 按 `25-execution-plan.mdc` 流程：状态 ⏳→🔄→✅ + 同步 3 个活文档 |
| 改表 | 改 4 处 + `pnpm db:generate`（见 `02-backend.md` drizzle-orm skill） |
| 改接口 | 改 2 处 + `pnpm gen:api`（见 `02-backend.md` api-design skill） |
| 质疑/改决策 | **先问用户** → 确认后改 `decisions.md` + TechnicalDesign + 00-project-context |
| 会话结束 | 更新 `activeContext.md`（时间戳 + 会话历史 + 下一步） |
| 全量同步 | 输入 `/update-context` |

## Definition of Done（任务完成标准）

未更新上下文文档的任务**不算完成**：
- [ ] 代码通过 `pnpm typecheck` + `pnpm lint`（无新增错误）
- [ ] 涉及文档已同步（schema 4 处 / API 2 处）
- [ ] `activeContext.md` 已更新
- [ ] `execution-plan.md` 状态字段已更新（如做 M1 任务）
- [ ] 决策变更已与用户确认并改 `decisions.md`
- [ ] commit message 符合 conventional commits
