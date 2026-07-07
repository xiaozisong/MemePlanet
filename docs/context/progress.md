# Progress · 进度追踪 + 文件地图

> 记录"什么做完了 / 什么没做 / 已知问题 / 文件在哪"。配合 `activeContext.md`（当前焦点）与 `decisions.md`（决策）使用。

**最后更新**：2026-07-07

---

## 总体进度

| 阶段 | 状态 | 完成度 |
|---|---|---|
| 产品+技术设计 | ✅ 完成 | 100% |
| 立项决策（12 项） | ✅ 完成 | 100% |
| M1 工程化准备（Sprint/DDL/API） | ✅ 完成 | 100% |
| 项目脚手架 | ✅ 文件完成 | 100%（待通电验证） |
| 脚手架通电调试 | ⏳ 待执行 | 0% |
| M1 S1 基础设施编码 | ⏳ 待启动 | 0% |
| M1 S2 用户系统+AI 编排 | ⏳ 待启动 | 0% |
| M1 S3 造梗+梗卡+审核 | ⏳ 待启动 | 0% |
| M1 S4 评分+收尾+Demo | ⏳ 待启动 | 0% |
| AIGC 备案 | ⏳ M1 启动材料 | 0% |
| M3 上线 gate | ⏳ 阻塞于备案 | 0% |

---

## 已完成清单

### 文档（docs/）
- [x] `PRD.md` v1.1.0（782 行，13 章节）
- [x] `TechnicalDesign.md` v1.1.0（1815 行，17 章节 + 8.6 Agent 章节）
- [x] `M1-Sprint-Plan.md`（75 任务，4 周 Sprint，甘特图，砍项建议）
- [x] `Database-DDL.md`（13 域 50 表详设）
- [x] `db/schema.sql`（50 表 106 索引，可直接执行）
- [x] `db/seed.sql`（15 类种子数据）
- [x] `API-Spec.md`（15 Module 接口表 + 34 接口详设 + WS/Webhook 契约）
- [x] `openapi.yaml`（OpenAPI 3.1.0，29 path/34 操作/43 schema）
- [x] `context/activeContext.md` + `context/decisions.md` + `context/progress.md`

### 代码脚手架（215 文件）
- [x] 根配置：`package.json` / `pnpm-workspace.yaml` / `tsconfig.base.json` / `.editorconfig` / `.gitignore` / `.npmrc` / `.nvmrc` / `.env.example` / `.prettierrc` / `.eslintrc.cjs` / `commitlint.config.cjs`
- [x] `husky/`（pre-commit + commit-msg）
- [x] `.github/workflows/`（ci.yml + deploy.yml）
- [x] `docker-compose.yml` + `docker-compose.dev.yml` + `Dockerfile.backend`
- [x] `README.md`
- [x] `packages/shared/`（types / api-client / constants / prompts，29 文件）
- [x] `apps/backend/`（NestJS 15 Module 全骨架 + common + config + database + workers + ai-orch，100 文件）
- [x] `apps/mobile/`（Expo Router 5 Tab + store + api，34 文件）
- [x] `apps/web/`（Next.js 14 App Router + admin，27 文件）
- [x] `scripts/`（dev.sh / gen-api-types.sh / db-init.sh）

### Cursor 上下文管理
- [x] `.cursor/rules/00-project-context.mdc`（alwaysApply，项目总上下文）
- [x] `.cursor/rules/10-coding-conventions.mdc`（apps/**/packages/** 自动加载，编码约定）
- [x] `.cursor/rules/20-m1-sprint.mdc`（手动引用，M1 Sprint 上下文）
- [x] `.cursor/rules/30-context-maintenance.mdc`（alwaysApply，上下文维护协议 + Definition of Done）
- [x] `.cursor/rules/update-context.mdc`（手动触发，`/update-context` 斜杠命令，全量同步上下文）
- [x] `scripts/check-context-sync.sh`（一致性校验脚本，10 项检查，`pnpm check:context`）
- [x] `.github/workflows/context-sync.yml`（PR 上下文同步检查 + activeContext 更新提醒 + 受保护文档 review 提醒）
- [x] `husky/pre-commit` 集成上下文软检查（警告不阻断，严重错误提示）

---

## 未完成 / 待做

### 通电验证（阻塞 M1 编码）
- [ ] 启动 Docker Desktop
- [ ] `cp .env.example .env` 并改 `DATABASE_URL` host 为 `localhost`
- [ ] `pnpm install`
- [ ] `pnpm db:init`（起 PG+Redis + 跑 schema/seed）
- [ ] `pnpm gen:api`（生成 TS 类型）
- [ ] `pnpm dev:backend` 验证后端启动 + Swagger `/docs` 可访问 + `/health` 通过
- [ ] `docker exec memestar-postgres-dev psql -U app -d meme -c "\dt"` 验证 50 表

### M1 编码任务（待砍项确认后启动）
- [ ] M1 S2：手机号验证码登录 + JWT 中间件 + LLM Adapter 接 DeepSeek
- [ ] M1 S3：造梗任务 + 梗卡发布 + 机审 + feed
- [ ] M1 S4：评分 + 评论 + RN 评分页 + Demo
- [ ] AIGC 备案材料草稿

### 已知问题 / 技术债
- `packages/shared` 改为 CJS 输出以兼容 NestJS（mobile/web 通过 paths 映射读源码）
- `packages/shared/src/api-client/generated.ts` 是占位 stub，需跑 `pnpm gen:api` 生成真实类型
- `.env.example` 的 `DATABASE_URL` 默认 host 是 `postgres`（docker 内部名），从宿主机跑 backend 要改 `localhost`
- M1 P0 工时 74 人日 vs 个人月产能 22 人日，需按 `M1-Sprint-Plan.md §7.3` 砍项

---

## 文件地图（找东西用）

### 想了解产品逻辑
→ `docs/PRD.md`（10 个功能模块在 §5，MVP 范围在 §11，路线图在 §12）

### 想了解技术架构
→ `docs/TechnicalDesign.md`（选型在 §3/§4，模块在 §5，ER 在 §6，Agent 在 §8.6，部署在 §13）

### 想看/改数据库表
→ `docs/db/schema.sql`（权威 DDL）+ `docs/Database-DDL.md`（设计说明）+ `apps/backend/src/database/schema.ts`（Drizzle）

### 想看/改接口
→ `docs/API-Spec.md`（人类可读）+ `docs/openapi.yaml`（机器可读，导入 Swagger/Apifox）+ `apps/backend/src/modules/*/`（实现）

### 想看 M1 任务清单
→ `docs/M1-Sprint-Plan.md`（75 任务，§4 任务分解，§7.3 砍项建议）

### 想看当前在做什么
→ `docs/context/activeContext.md`

### 想看为什么这么决策
→ `docs/context/decisions.md`（12 项 ADR）

### 想看 AI 编排怎么实现
→ `apps/backend/src/modules/ai-orch/`（adapters/ + policy-engine.ts + interfaces.ts）

### 想起后端
→ `pnpm dev:backend`（端口 3000，Swagger `/docs`，健康检查 `/health`）

### 想起数据库
→ `pnpm db:init` 或 `docker compose -f docker-compose.dev.yml up -d`

### 想生成 API 类型
→ `pnpm gen:api`（从 `docs/openapi.yaml` 生成到 `packages/shared/src/api-client/generated.ts`）

---

## 关键数字速查

| 项 | 值 |
|---|---|
| 文档总数 | 8 份 md + 1 份 yaml + 2 份 sql |
| 脚手架文件 | 215（backend 100 / mobile 34 / web 27 / shared 29 / 根 25） |
| NestJS Module | 15 个 |
| 数据库表 | 50 张（46 业务 + 4 分区默认子表） |
| 数据库索引 | 106 个 |
| pgvector 表 | 3 张（meme_embeddings / user_interest_embeddings / prompt_template_embeddings） |
| API 接口 | 34 个操作（M1 P0 = 13 个） |
| M1 任务 | 75 个（P0 = 74 人日，砍后 ≈ 25 人日） |
| MVP 月成本估算 | 灰度 DAU 500：¥400~¥1200；DAU 1w：¥3585~¥16855 |
| Pro 定价 | ¥18/月 + 视频按次包 |
| 视频配额 | 免费 1次/周·Pro 3次/日 |
| Agent 配额 | Pro 10次/日 + 日预算 ¥80 熔断 |
