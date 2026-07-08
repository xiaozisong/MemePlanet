# Progress · 进度追踪 + 文件地图

> 记录"什么做完了 / 什么没做 / 已知问题 / 文件在哪"。配合 `activeContext.md`（当前焦点）与 `decisions.md`（决策）使用。

**最后更新**：2026-07-08

---

## 总体进度

| 阶段 | 状态 | 完成度 |
|---|---|---|
| 产品+技术设计 | ✅ 完成 | 100% |
| 立项决策（13 项） | ✅ 完成 | 100% |
| M1 工程化准备（Sprint/DDL/API） | ✅ 完成 | 100% |
| 项目脚手架 | ✅ 文件完成 + 通电验证 | 100%（S0 通过） |
| M1 详细执行计划 | ✅ 完成 | 100%（S0+S1~S4，~31 人日） |
| 脚手架通电调试（S0） | ✅ 完成 | 100%（S0-1~S0-6 全 done） |
| S1 T1.0 脚手架 TS 补丁 | ✅ 完成 | 100%（~60 个 TS 错误全修，typecheck+lint 通过） |
| 双端 QA 测试套件 | ✅ 完成 | 100%（166 用例全通过，Web+App 双端可运行） |
| Mobile UI 设计系统 | ✅ 完成 | 100%（design tokens + SVG 图标 + 通用组件 + 5 页优化 + typecheck/lint 全 0） |
| M1 S1 用户系统+AI 编排 | ⏳ 待启动 | 0%（T1.1 起点） |
| M1 S2 造梗+梗卡+审核 | ⏳ 待启动 | 0% |
| M1 S3 feed+评分+RN | ⏳ 待启动 | 0% |
| M1 S4 合规+Demo+收尾 | ⏳ 待启动 | 0% |
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
- [x] `context/activeContext.md` + `context/decisions.md` + `context/progress.md` + `context/execution-plan.md`（M1 详细执行计划，S0+S1~S4 技术点级粒度）

### 双端 QA 测试套件（166 用例，100% 通过）
- [x] `apps/backend/test/e2e/`（6 spec：冒烟/鉴权/全量路由/功能/压力/性能，114 用例，Jest+supertest）
- [x] `tests/backend/api.smoke.test.ts`（根级黑盒冒烟，13 用例）
- [x] `apps/web/tests/e2e/` + `apps/web/playwright.config.ts`（3 spec：冒烟/路由/功能，23 用例，Playwright chromium）
- [x] `apps/mobile/__tests__/` + `apps/mobile/__mocks__/`（2 spec：组件/13 屏渲染冒烟，16 用例，Jest+ts-jest + RN/expo-router mock）
- [x] `apps/mobile/jest.config.js` + `apps/backend/test/jest.e2e.config.json` + `jest.config.js`（根）
- [x] `docs/qa/test-plan.md` + `docs/qa/test-report.md`（测试计划 + 报告）
- [x] `expo export --platform ios` bundle 编译验证通过（1443 模块 / 4.02 MB）

### Mobile UI 设计系统（第一期 + 第二期修复）
- [x] `apps/mobile/src/theme/` 设计系统目录：`colors.ts`（含 `colors` 嵌套 + `colorsFlat` 扁平）+ `spacing.ts` + `typography.ts` + `radius.ts` + `shadow.ts`
- [x] `apps/mobile/src/theme/tailwind-colors.cjs`：CommonJS 颜色映射，给 `tailwind.config.js` 引用（单源 truth）
- [x] `apps/mobile/tailwind.config.js` 更新：colors 改为 `require('./src/theme/tailwind-colors.cjs')`，间距/字号/圆角/阴影同步 theme tokens
- [x] `apps/mobile/src/components/icons/Icons.tsx` + `index.ts`：30+ SVG 图标（Home/Sparkles/Shield/Swords/User + Heart/Comment/Share/Bookmark/Star 等）
- [x] `apps/mobile/app/(tabs)/_layout.tsx`：Tab 栏 emoji 替换为 SVG 图标，颜色用 theme tokens
- [x] 通用组件：`PrimaryButton`（4 variant + 3 size + loading）+ `UserAvatar`（5 size + badge）+ `LoadingSkeleton`（4 variant + 动画）+ `FullPageLoading` + `EmptyState`
- [x] 页面优化：Feed（骨架屏/空状态/下拉刷新）+ 登录页（品牌区/输入框/CTA）+ 造梗入口（4 模式卡片）+ 个人主页（头像/数据/Tab/菜单）
- [x] 类型修复：装 `@types/jest` + `@types/node`；`tsconfig.json` `types` 加 `"node"`；`colorsFlat` 解决嵌套 vs 扁平访问；`app/_layout.tsx` 删除 RN 不支持的 `elevation/shadowOpacity`；`feed.tsx` `RefreshControl tintColor` 改 `themeColors.brand!`
- [x] `pnpm --filter @memestar/mobile typecheck` = 0 errors
- [x] `pnpm --filter @memestar/mobile lint` = 0 errors / 0 warnings

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
- [x] `.cursor/rules/25-execution-plan.mdc`（alwaysApply，M1 详细执行计划 Agent 入口 + 推进协议）
- [x] `.cursor/rules/30-context-maintenance.mdc`（alwaysApply，上下文维护协议 + Definition of Done）
- [x] `.cursor/rules/update-context.mdc`（手动触发，`/update-context` 斜杠命令，全量同步上下文）
- [x] `scripts/check-context-sync.sh`（一致性校验脚本，10 项检查，`pnpm check:context`）
- [x] `.github/workflows/context-sync.yml`（PR 上下文同步检查 + activeContext 更新提醒 + 受保护文档 review 提醒）
- [x] `husky/pre-commit` 集成上下文软检查（警告不阻断，严重错误提示）

---

## 未完成 / 待做

### 通电验证（S0，已完成 100%）
- [x] 启动 Docker Desktop（28.1.1 + Compose v2.35.1）
- [x] `cp .env.example .env` 并改 4 处 host 为 `localhost`（POSTGRES_HOST/REDIS_HOST/REDIS_URL/DATABASE_URL）
- [x] `pnpm install`（1921 包）
- [x] `pnpm db:init`（50 表 + 5 扩展 + 3 分区子表 + 种子数据；修了 4 个 schema/seed bug）
- [x] `pnpm gen:api`（generated.ts 生成）
- [x] `docker exec ... \dt` 验证 50 表（2 users + 3 legions + 1 meme + 5 templates + 4 tts + 20 sensitive words）
- [x] `pnpm typecheck + lint` 无错误（T1.0 修 ~60 个 TS 编译错误后通过）
- [x] `pnpm dev:backend` 验证后端 fully 启动 + Swagger + `/health`（S0-6：JwtModule.registerAsync 加 `global: true`，14 controller 共享全局 JwtService；`/health` 200 + `/docs` 可访问）

### S1 T1.0 脚手架 TS 补丁（已完成）
- [x] 装缺依赖 `dotenv` + `socket.io` + `@types/socket.io`
- [x] 修 TS6059 rootDir（~30 处）：保留 rootDir，paths 改指向 `packages/shared/dist`，先 `pnpm build:shared`
- [x] 修 TS7006 @CurrentUser（27 处）：12 controller 加 `: CurrentUser` 类型，装饰器 interface 改 type alias
- [x] 修 TS2339 policy-engine（~5 处）：runChain 泛型加 `P extends {name:string}` + 新增 `AIConfig`/`AIProviderConfig` 类型

### M1 编码任务（按 `execution-plan.md` 推进，每完成一项更新状态字段）
- [ ] S1 用户系统+AI 编排（9.7 人日，W2）：T1.0 已完成，从 T1.1 开始（Drizzle schema 对齐）→ T1.2（Supabase Auth + JWT 中间件 + RBAC 装饰器；JwtModule 全局装配已完成）
- [ ] S2 造梗+梗卡+机审（8.5 人日，W3）
- [ ] S3 feed+评分+RN（11.0 人日，W4）
- [ ] S4 合规+Demo+收尾（5.6 人日，W5）
- [ ] AIGC 备案材料草稿（S4 启动）

### S0 当天并行申请（避免 S1/S2 阻塞）
- [ ] DeepSeek API key
- [ ] GLM-4-Flash API key
- [ ] 阿里云短信签名（审核 1~3 天）
- [ ] 阿里云内容安全服务开通
- [ ] Supabase 项目创建 + Auth 配置

### 已知问题 / 技术债
- `packages/shared` 改为 CJS 输出以兼容 NestJS（mobile/web 通过 paths 映射读源码）
- ~~`packages/shared/src/api-client/generated.ts` 是占位 stub~~ → 已通过 `pnpm gen:api` 生成真实类型
- `.env.example` 的 `DATABASE_URL` 默认 host 是 `postgres`（docker 内部名），从宿主机跑 backend 要改 `localhost`（已在 .env 改）
- M1 P0 工时 74 人日 vs 个人月产能 22 人日，已按 `M1-Sprint-Plan.md §7.3` 砍到 ~25 人日核心闭环（用户已采纳）
- **改 shared 源码后需 `pnpm build:shared` 才生效**（T1.0 把 backend paths 指向 shared/dist）。开发时建议开 `pnpm --filter @memestar/shared dev` watch 自动重建
- **ratings 表设计变更**：S0 修复分区表 UNIQUE 冲突，改为普通表（保留 UNIQUE(meme_id,user_id)）。用户已确认（ADR-013，2026-07-07）
- ~~**后端 DI 装配未完成**~~ → ✅ 已解决（S0-6：JwtModule.registerAsync 加 `global: true`，后端 fully 启动）
- Drizzle schema.ts 仍是占位（S1 T1.1 用 drizzle-kit introspect 生成真实 schema）
- S0 修复的 4 个 schema/seed bug 已同步到 schema.sql + Database-DDL.md（ratings 分区/citext opclass/date_trunc IMMUTABLE/seed uuid），Drizzle 占位待 S1 T1.1 同步
- **mobile package.json 声明与实际安装版本漂移**：声明 `expo ^51 / react 18.2 / RN 0.74.5`，实际装 `expo 54 / react 19.1 / RN 0.81.5`（expo-router 6 的 @radix-ui peer 拉入 React 19）。功能可用（expo start + bundle 编译 + 测试均通过），但建议后续对齐 package.json 声明或固化到 SDK 54
- **React 19 废弃 react-test-renderer**：`toJSON()` 恒为 null、`create()` 后立即 unmount。mobile 测试已改用"直接调用函数组件 + 手动遍历 React 元素树"绕开。后续可评估迁 `@testing-library/react-native`（需解决 jest-expo ESM 兼容）
- **真机预览受 Wi-Fi AP 隔离影响**：企业/校园 Wi-Fi 阻断设备互访，需手机热点或 tunnel（ngrok 需 authtoken，国内可能慢）
- **ecc 规则集为 untracked 外部资产**：`.cursor/rules/ecc-*.mdc`（~120 个语言规则）+ `.cursor/ecc-reference/` + `ecc_src/`（嵌入式 git 仓库）+ `.cursor/hooks/` 为外部安装的 ruleset，非 MemeChatAI 项目代码，未纳入版本控制。如需追踪应单独 commit（`ecc_src/` 不应直接 git add）
- **mobile typecheck 报错（nativewind className 类型缺失）**：~~`apps/mobile/app/(tabs)/*.tsx` 用了 `className` 但 TS 不识别~~ → ✅ 已修（T1.0b 升 nativewind 到 v4.2.6，`nativewind/types` 子路径可用）
- **nativewind v4 拉入 reanimated 4.5.1 peer 警告**：reanimated 4.5 要求 RN 0.83-0.86，当前 RN 0.74.5。安装有 peer 警告但不阻断 expo start 启动。若运行时动画报错，需降 reanimated 到 3.x（兼容 RN 0.74）或锁 nativewind 到不拉 reanimated 4 的版本。MVP 骨架页无动画，暂不影响预览

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

### 想看 M1 详细执行计划（当前推进依据）
→ `docs/context/execution-plan.md`（S0+S1~S4 技术点级粒度，含工时/测试用例/测试时间/状态字段，Agent 每次会话先读）

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
| 文档总数 | 9 份 md + 1 份 yaml + 2 份 sql + 2 份 QA（test-plan/test-report） |
| 脚手架文件 | 215（backend 100 / mobile 34 / web 27 / shared 29 / 根 25） |
| Cursor 规则 | 6 个 MDC（00 总上下文 / 10 编码 / 20 M1 Sprint / 25 执行计划 / 30 上下文维护 / update-context） |
| NestJS Module | 15 个 |
| 数据库表 | 50 张（46 业务 + 4 分区默认子表） |
| 数据库索引 | 106 个 |
| pgvector 表 | 3 张（meme_embeddings / user_interest_embeddings / prompt_template_embeddings） |
| API 接口 | 34 个操作（M1 P0 = 13 个） |
| 测试用例 | 166 个（backend e2e 114 + 根 api.smoke 13 + web Playwright 23 + mobile jest 16），通过率 100% |
| 决策 ADR | 13 项 |
| M1 任务 | 75 个（P0 = 74 人日，砍后 ≈ 25 人日编码 + 5.5 人日测试 + 1 人日通电 ≈ 31 人日） |
| MVP 月成本估算 | 灰度 DAU 500：¥400~¥1200；DAU 1w：¥3585~¥16855 |
| Pro 定价 | ¥18/月 + 视频按次包 |
| 视频配额 | 免费 1次/周·Pro 3次/日 |
| Agent 配额 | Pro 10次/日 + 日预算 ¥80 熔断 |
