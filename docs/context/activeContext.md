# Active Context · 活状态

> 本文件记录"当前在做什么 / 下一步 / 阻塞 / 待确认"，是跨会话上下文衔接的核心。每次开新 Agent 会话先读本文件，每次结束会话前更新本文件。

**最后更新**：2026-07-08
**当前阶段**：S0 通电验证全部完成（后端 fully 启动）+ 双端 QA 测试通过（166/166）→ S1 T1.1 待启动
**当前会话焦点**：双端全链路测试（冒烟/功能/契约/性能/压力）→ 166 用例全通过，Web+App 双端均可正常运行

---

## 当前状态

### 已完成 ✅

- **产品+技术设计**：`PRD.md` v1.1.0 + `TechnicalDesign.md` v1.1.0，12 项核心决策定稿
- **M1 工程化准备**：`M1-Sprint-Plan.md`（75 任务）+ `Database-DDL.md`（50 表）+ `db/schema.sql` + `db/seed.sql` + `API-Spec.md`（34 接口）+ `openapi.yaml`
- **项目脚手架**：pnpm monorepo，215 文件（NestJS 15 Module + Expo Router 5 Tab + Next.js 14 + ai-orch 7 adapter + docker-compose + GitHub Actions）
- **Cursor 上下文管理**：`.cursor/rules/` 4 个 MDC + `docs/context/` 4 份活文档
- **M1 详细执行计划**：`docs/context/execution-plan.md` + `.cursor/rules/25-execution-plan.mdc`
- **S0 通电验证完成**：
  - ✅ S0-1 Docker 28.1.1 + Compose v2.35.1 运行
  - ✅ S0-2 `.env` 配置（4 处 host 改 localhost）
  - ✅ S0-3 `pnpm install`（1921 包）
  - ✅ S0-4 `pnpm db:init`：50 表 + 5 扩展（vector/pg_trgm/citext/uuid-ossp/btree_gin）+ 3 分区子表 + 种子数据。修复 4 个 schema/seed bug（ratings 分区/citext opclass/date_trunc IMMUTABLE/seed uuid）。
  - ✅ S0-5 `pnpm gen:api`：generated.ts 生成
  - ✅ S0-6 后端 fully 启动：`/health` 200 + Swagger `/docs` 可访问。修复 DI 报错（`JwtAuthGuard` 缺 `JwtService`）—— 把 `AuthModule` 的 `JwtModule.registerAsync` 加 `global: true`，14 个 controller 共享全局 `JwtService`。

### 进行中 🔄

- 无（S0 全部完成，等待启动 S1 T1.1）

### 待启动 ⏳

- **S1 用户系统 + AI 编排层**（9.7 人日，W2）：T1.0 已完成，从 T1.1 开始。T1.2 Supabase Auth + JWT 中间件 + RBAC 装饰器（JwtModule 全局装配已完成，无需再装）。
- **S2/S3/S4**：详见 `execution-plan.md §3~§5`

### 阻塞 ❌

- 无（S0 全部完成）

---

## 下一步（按优先级）

1. **确认 schema 设计变更**：S0 修复了 ratings 分区 UNIQUE 冲突（改为普通表），详见 `execution-plan.md §1.5`。如不认可请告知，我会回滚。当前用户已选"暂不决定，先继续后端启动"，此变更暂保留。
2. **启动 S1 T1.1**：Drizzle 用户表 schema 对齐（`apps/backend/src/database/schema.ts` 与 `docs/db/schema.sql` 一致）。
3. **启动 S1 T1.2**：Supabase Auth + JWT 中间件 + RBAC 装饰器。JwtModule 全局装配已完成，后端已可 fully 启动。
4. **并行申请 AI/短信/内容安全 key**（S0 当天就提交，避免 S1/S2 阻塞）：DeepSeek + GLM-4-Flash + 阿里云短信签名 + 阿里云内容安全 + Supabase 项目。
5. **开发时改 shared 源码后需 `pnpm build:shared`**：T1.0 把 backend paths 指向 shared/dist，改 shared 后要重新 build 才生效。可开 `pnpm --filter @memestar/shared dev` watch 自动重建。

---

## 阻塞 / 待用户确认

| # | 事项 | 阻塞什么 | 状态 |
|---|---|---|---|
| 1 | ~~ratings 表设计变更确认~~ | M1 评分模块编码起点（S3 T3.4） | ✅ 已确认（ADR-013，2026-07-07）—— 改为普通表 |
| 2 | AI/短信/内容安全 key 何时申请 | S1/S2 是否阻塞 | 建议 S0 当天提交申请（DeepSeek/GLM/阿里云短信签名/阿里云内容安全/Supabase） |
| 3 | PRD §13.2 剩余 9 项开放问题（评审官规模/未成年人合规/冷启动种子/PK 奖励/陌生人社交/品牌广告/军团上限细化等） | 后续版本设计 | 不阻塞 M1 |

> 已解决（保留历史）：Docker Desktop 已开 ✅；M1 砍项已按 25 人日采纳 ✅；脚手架通电已代执行 ✅。

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
| 2026-07-07 10:46 | M1 详细执行计划 | `docs/context/execution-plan.md`（S0+S1~S4，~31 人日，技术点级粒度）+ `.cursor/rules/25-execution-plan.mdc`（Agent 自动加载 + 推进协议） |
| 2026-07-07 11:02 | S0 通电验证 + T1.0 脚手架补丁 | DB/依赖/API 全通（50 表+5 扩展+种子数据）；修 4 个 schema/seed bug（ratings 分区/citext opclass/date_trunc IMMUTABLE/seed uuid）；T1.0 修 ~60 个 TS 编译错误（rootDir+paths/27 处 @CurrentUser 类型/policy-engine 泛型+config 类型/装 dotenv+socket.io）；typecheck+lint 通过，后端编译启动到 DI 阶段（DI 装配属 S1 T1.2） |
| 2026-07-07 14:04 | /update-context 全量同步 | 清理 activeContext 阻塞表已解决项；progress 勾选 S0+T1.0 完成项 + 技术债更新；20-m1-sprint 待确认区更新；.gitignore 加 .agents/ + shared src 编译产物；清理误生成的 shared/src/*.js；用户确认 ratings 设计变更 → 新增 ADR-013（普通表） |
| 2026-07-07 15:34 | T1.0b mobile nativewind 修复 | 诊断 pnpm dev:mobile 报 `Cannot find module 'nativewind/metro'`：脚手架 metro/babel/tailwind/nativewind-env 全是 v4 写法但装的是 v2.0.11（无 metro/types/preset 子路径）→ 升 nativewind ^2.0.11 → ^4.2.6；expo start 成功（Metro 就绪 :8081 可 Expo Go 扫码）；mobile typecheck 0 errors；lint --fix 清 47 个 className 顺序 warning → 0 errors 0 warnings |
| 2026-07-07 15:58 | S0-6 后端 DI 修复 | `pnpm dev:backend` 报 `JwtAuthGuard` 无法解析 `JwtService`（UserModule 等 14 个 controller 用了 JwtAuthGuard 但各自模块未 import JwtModule）→ 在 `auth.module.ts` 的 `JwtModule.registerAsync` 加 `global: true`，JwtService 全局可注入；后端 fully 启动，`/health` 200，Swagger `/docs` 可访问；S0 通电验证全部完成 |
| 2026-07-08 00:30 | 双端 QA 测试 | 以双端测试工程师视角跑全链路测试：backend e2e 114/114、根 api.smoke 13/13、web Playwright 23/23、mobile jest 16/16 = **166/166 全通过（100%）**；修复 6 项阻断（perf 冷启动预热、react-test-renderer@19 对齐、expo-router mock、React 19 废弃 testRenderer 改用直接调用+元素树遍历、MemeCard 命名导入、删除 .mjs 脚本）；expo export iOS bundle 编译成功（1443 模块/4.02MB）；报告 `docs/qa/test-report.md`；更新 test-plan §3 指向框架测试 |
