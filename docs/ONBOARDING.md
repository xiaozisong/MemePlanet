# 梗星球 MemeChatAI · 模型交接路由文档

> 本文档是给 AI 模型（而非人类）快速上手项目的精简路由。按"想干什么 → 读什么"组织，尽量少写描述、多给路径。

---

## 1. 项目概况

| 问 | 答 |
|---|---|
| 这是什么 | 面向年轻人的"梗"文化聊天平台 + 内容社区 |
| 闭环 | 手机号登录 → 文本造梗（Pro Agent）→ 梗卡发布 → 机审 → feed → 评分评论 |
| 当前阶段 | M1 编码期（S1 用户系统进行中），详见 `docs/context/activeContext.md` |
| 技术栈 | 见 `docs/TechnicalDesign.md §3-§4` 或 `.cursor/rules/00-project-context.mdc` |

---

## 2. 产品需求 → 读这里

| 想了解 | 文件 |
|---|---|
| 完整产品逻辑（10 模块） | `docs/PRD.md §5` |
| MVP 范围（砍后 25 人日闭环） | `docs/PRD.md §11` |
| 路线图（M1→M3） | `docs/PRD.md §12` |
| 开放问题（评审官/合规/PK 奖励等） | `docs/PRD.md §13.2` |

---

## 3. 技术架构 → 读这里

| 想了解 | 文件/位置 |
|---|---|
| 架构全景（选型/模块/ER/部署） | `docs/TechnicalDesign.md §3-§5` |
| 成本估算（DB/存储/AI/月总） | `docs/TechnicalDesign.md §11` |
| AI 编排架构（Adapter/Policy/状态机） | `docs/TechnicalDesign.md §8.6` + `apps/backend/src/modules/ai-orch/` |
| 13 项决策（勿擅改） | `docs/context/decisions.md` |

---

## 4. 数据库 → 读这里

| 想了解 | 文件/位置 |
|---|---|
| 权威 DDL（50 表 + 106 索引，可直接执行） | `docs/db/schema.sql` |
| 设计说明（13 域 + ER） | `docs/Database-DDL.md` |
| Drizzle ORM schema（运行时映射） | `apps/backend/src/database/schema.ts` |
| 种子数据 | `docs/db/seed.sql` |

---

## 5. API → 读这里

| 想了解 | 文件/位置 |
|---|---|
| 人类可读接口详设（34 操作） | `docs/API-Spec.md` |
| OpenAPI 契约（可导入 Swagger/Apifox） | `docs/openapi.yaml` |
| 生成 TS 类型（`pnpm gen:api`） | `packages/shared/src/api-client/generated.ts` |
| 后端 Controller（路由入口） | `apps/backend/src/modules/*/*.controller.ts` |
| 统一响应格式 `{code, data, message}` | `docs/API-Spec.md §2.5` |

---

## 6. M1 Sprint 计划 → 读这里

| 想了解 | 文件/位置 |
|---|---|
| 75 任务总清单 + 甘特图 + 砍项建议 | `docs/M1-Sprint-Plan.md §4` |
| 砍项建议（25 人日核心闭环） | `docs/M1-Sprint-Plan.md §7.3` |

---

## 7. 当前执行状态（每次必读）→ 读这里

| 想了解 | 文件/位置 |
|---|---|
| **当前在做什么 / 下一步** | `docs/context/activeContext.md`（会话起始点） |
| **详细执行计划（技术点级、状态字段）** | `docs/context/execution-plan.md`（推进依据） |
| **总体进度 + 已完成清单** | `docs/context/progress.md` |
| 当前 Sprint | S1 用户系统 + AI 编排层（W2: 07-08~07-14） |

---

## 8. 代码目录 → 读这里

| 想了解 | 位置 |
|---|---|
| Monorepo 根 | `pnpm-workspace.yaml` |
| 共享类型/常量/API 客户端 | `packages/shared/src/` |
| 后端（NestJS, 15 Module） | `apps/backend/src/modules/` |
| 移动端（Expo Router, 5 Tab） | `apps/mobile/app/` |
| 移动端 UI 组件/主题 | `apps/mobile/src/components/` / `src/theme/` |
| Web 后台（Next.js 14 App Router） | `apps/web/app/` |
| 测试 | `apps/backend/test/e2e/` / `apps/mobile/__tests__/` / `apps/web/tests/e2e/` |

---

## 9. AI 编排 → 读这里

| 想了解 | 位置 |
|---|---|
| Provider 抽象接口 | `apps/backend/src/modules/ai-orch/adapters/interfaces.ts` |
| LLM Adapter（DeepSeek + GLM） | `apps/backend/src/modules/ai-orch/adapters/deepseek.adapter.ts` |
| 图像通义万相、视频豆包、TTS 火山 | `apps/backend/src/modules/ai-orch/adapters/tongyi.adapter.ts` + `siliconflow.adapter.ts` + `volcano-tts.adapter.ts` |
| 熔断/限流/成本策略 | `apps/backend/src/modules/ai-orch/policy-engine.ts` |
| Prompt 模板（5 类官方梗模板） | `packages/shared/src/prompts/` |
| AI 成本熔断（Agent ¥80/d、视频 ¥200/d） | `packages/shared/src/constants/` |

---

## 10. 当前 Sprint 任务（S1）

| 任务 | 状态 | 查找位置 |
|---|---|---|
| T1.1 Drizzle schema 5 表 | ✅ done | `apps/backend/src/database/schema.ts` |
| T1.2 JWT Guard + RBAC | ✅ done | `apps/backend/src/common/guards/` + `decorators/` |
| T1.3 手机号 OTP 登录 | ✅ done | `apps/backend/src/modules/auth/` |
| T1.4 兴趣标签 + 冷启动 | ✅ done | `apps/backend/src/modules/user/` |
| **T1.5 个人主页只读** | 🔄 in_progress | `apps/backend/src/modules/user/user.controller.ts` |
| T1.6~T1.14 AI 编排 + 埋点 | ⏳ pending | `apps/backend/src/modules/ai-orch/` + `analytics/` |

---

## 11. UI 设计 → 读这里

| 想了解 | 位置 |
|---|---|
| UI 设计系统文档（已落地/剩余） | `apps/mobile/UI_PLAN.md` |
| 设计 Token（色彩/间距/字号/圆角/阴影） | `apps/mobile/src/theme/` |
| 通用组件（PrimaryButton/UserAvatar/LoadingSkeleton 等） | `apps/mobile/src/components/ui/` |
| SVG 图标（30+ 品牌图标） | `apps/mobile/src/components/icons/Icons.tsx` |
| 参考 Figma 设计稿 | [Online Game Streaming Mobile App — Community](https://www.figma.com/design/3ktAZ9eJ1FmAPhNYjx8BYh/Online-Game-Streaming-Mobile-App--Community-?node-id=0-1&p=f&t=xgWpcwaQSiAMThm6-0) |

---

## 12. 快速查找问题索引

| 问题 | 答案位置 |
|---|---|
| 某个 Module 怎么实现 | `apps/backend/src/modules/<name>/`（Controller → Service → Module 三件套） |
| 某个页面的路由和代码 | `apps/mobile/app/` 对应 Expo Router 目录结构 |
| 某个接口的定义和类型 | `docs/openapi.yaml`（契约）→ `packages/shared/src/api-client/generated.ts`（类型） |
| 迁移数据库 | `docs/Database-DDL.md` → 改 `schema.sql` + `apps/backend/src/database/schema.ts` → `pnpm db:generate` |
| 加一个新接口 | 改 `docs/openapi.yaml` + `docs/API-Spec.md` → `pnpm gen:api` → 写 Controller/Service |
| 部署流程 | `docs/TechnicalDesign.md §13` + `Dockerfile.backend` + `.github/workflows/` |
| 上下文已过时、想同步 | 读 `docs/context/` 三件套（activeContext + progress + execution-plan）；写完任务后按 `30-context-maintenance.mdc` 更新 |
