# Active Context · 活状态

> 本文件记录"当前在做什么 / 下一步 / 阻塞 / 待确认"，是跨会话上下文衔接的核心。每次开新 Agent 会话先读本文件，每次结束会话前更新本文件。

**最后更新**：2026-07-07
**当前阶段**：脚手架通电调试 → M1 编码 S2 待启动
**当前会话焦点**：搭建 Cursor 上下文管理系统 + 上下文维护协议

---

## 当前状态

### 已完成 ✅

- **产品+技术设计**：`PRD.md` v1.1.0 + `TechnicalDesign.md` v1.1.0，12 项核心决策定稿
- **M1 工程化准备**：`M1-Sprint-Plan.md`（75 任务）+ `Database-DDL.md`（50 表）+ `db/schema.sql` + `db/seed.sql` + `API-Spec.md`（34 接口）+ `openapi.yaml`
- **项目脚手架**：pnpm monorepo，215 文件（NestJS 15 Module + Expo Router 5 Tab + Next.js 14 + ai-orch 7 adapter + docker-compose + GitHub Actions）
- **Cursor 上下文管理**：`.cursor/rules/` 3 个 MDC + `docs/context/` 3 份活文档

### 进行中 🔄

- **脚手架通电验证**：文件已建，但 `node_modules` 未装 / `.env` 未配 / Docker 未启动，需走 4 步启动命令验证能跑

### 待启动 ⏳

- **M1 S2 编码**：用户系统（手机号登录）+ AI 编排层（LLM Adapter 真实接入 DeepSeek）

---

## 下一步（按优先级）

1. **通电验证脚手架**：执行 `pnpm install` + `cp .env.example .env`（改 DATABASE_URL host 为 localhost）+ `pnpm db:init` + `pnpm gen:api` + `pnpm dev:backend`，验证后端能起 + Swagger 可访问 + 50 表建好。需用户本地先开 Docker Desktop。
2. **用户拍板砍项清单**：`M1-Sprint-Plan.md §7.3` 20 条砍项建议，确认 M1 P0 范围（74 人日 → 25 人日）。
3. **启动 M1 S2**：按砍后范围开始编码——手机号验证码登录 + JWT 中间件 + LLM Adapter 接 DeepSeek。

---

## 阻塞 / 待用户确认

| # | 事项 | 阻塞什么 | 状态 |
|---|---|---|---|
| 1 | Docker Desktop 是否已开 | 通电验证 | 待用户确认 |
| 2 | M1 砍项清单是否接受 | M1 编码起点 | 待用户拍板 |
| 3 | 脚手架通电是否要我代执行 | 验证流程 | 待用户选择 |
| 4 | PRD §13.2 剩余 9 项开放问题（评审官规模/未成年人合规/冷启动种子/PK 奖励/陌生人社交/品牌广告/军团上限细化等） | 后续版本设计 | 不阻塞 M1 |

---

## 关键提醒（给下一个会话的自己）

1. **读文档顺序**：先读本 `activeContext.md` → `decisions.md`（勿改）→ `progress.md`（看进度）→ 按需读 `docs/` 下的设计文档。
2. **勿擅改 12 项已定稿决策**，要改必须先与用户讨论（见 `decisions.md`）。
3. **豆包视频成本是最大风险**：DAU 1w 月成本可能 ¥1w+，MVP 必须灰度 DAU ≤ 500~2000。
4. **AIGC 备案是上线 gate**：M1 启动材料，M3 上线前必须取得备案号。
5. **回复用户用中文**（用户规则）。
6. **代码改动后跑 `pnpm typecheck` + `pnpm lint`**，修掉引入的 lint 错误。
7. **改表结构要同步改 `schema.sql` + `Database-DDL.md` + Drizzle schema + `openapi.yaml`**，四处一致。

---

## 会话历史摘要

| 时间 | 会话 | 产出 |
|---|---|---|
| 2026-07-06 23:55 | 需求+技术文档输出 | PRD v1.0 + TechnicalDesign v1.0（产品+技术子 Agent） |
| 2026-07-07 00:14 | 技术选型讨论 | RN+Expo(MVP)/Flutter(v2.0)、NestJS 保持、Pro Agent 引入 |
| 2026-07-07 00:56 | 4 项决策定稿 | 豆包视频、Pro ¥18、国内 PG、AIGC 备案 |
| 2026-07-07 01:10 | 5 项决策定稿 | 视频兜底、灰度、军团上限、IM 方案、Go 渐进 |
| 2026-07-07 01:17 | M1+DDL 并行 | M1-Sprint-Plan.md + db/schema.sql + db/seed.sql |
| 2026-07-07 04:48 | API 契约 | API-Spec.md + openapi.yaml |
| 2026-07-07 05:02 | 项目脚手架 | 215 文件 monorepo |
| 2026-07-07 09:53 | 上下文总结 | 本套 Cursor 上下文管理系统 |
