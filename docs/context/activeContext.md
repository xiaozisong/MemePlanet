# Active Context · 活状态

> 本文件记录"当前在做什么 / 下一步 / 阻塞 / 待确认"，是跨会话上下文衔接的核心。每次开新 Agent 会话先读本文件，每次结束会话前更新本文件。

**最后更新**：2026-07-09
**当前阶段**：S0 通电验证全部完成 + **Mobile UI 设计系统完成（P0 视觉重构，基于 Figma "Online Game Streaming" 参考稿）** → 待启动 S1 T1.1
**当前会话焦点**：Mobile UI 设计系统第二期 — Figma 视觉风格重构（新色板金黄 #F7B84B + Poppins 字体 + 深黑氛围 + 搜索/分类胶囊/LIVE 角标/Feed 登录页重建）

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
- **双端 QA 测试套件**：166 用例全通过（100%）。backend e2e 114 + 根 api.smoke 13 + web Playwright 23 + mobile jest 16。详见 `docs/qa/test-report.md`。修复 6 项阻断（perf 冷启动预热 / react-test-renderer@19 对齐 / expo-router mock / React 19 废弃 testRenderer 改用直接调用+元素树遍历 / MemeCard 命名导入 / 删除 .mjs 脚本）。`expo export --platform ios` bundle 编译成功（1443 模块/4.02MB）。
- **Expo 真机 404 修复**：iOS Expo Go 连接 dev server 时显示 "+not-found / 404 页面不存在"。根因：`app/` 和 `app/(tabs)/` 缺少 `index.tsx` 入口，Expo Router 启动路由 `/` 找不到匹配回退到 `+not-found`。修复：新增 `app/(tabs)/index.tsx` 用 `Redirect` 跳转 `/(tabs)/feed`，并在 `(tabs)/_layout.tsx` 用 `href: null` 隐藏 index tab。
- **Harness 信噪比优化（P0+P1）**：审查 `.cursor` + `.agents` 后执行：
  - P0 skill 瘦身：`.agents/skills/` 340 → 107（236 个无关 skill 归档到 `.cursor/ecc-reference/skills/`，只留项目技术栈 + agent harness 相关）
  - P1 补核心栈 skill：新建 `drizzle-orm` / `bullmq-queue` / `supabase-auth` 3 个项目专属 SKILL.md（固化 Drizzle 查询约定/pgvector HNSW、BullMQ 异步 AI 任务契约/降级链/配额、Supabase 手机号 OTP+自建 JWT+Realtime 私聊+自建群聊 WS）
  - P1 修过时引用：重写 `ecc-common-agents.mdc`（`~/.claude/agents/` → Cursor Task `subagent_type` + `.agents/skills/ecc-agent-*` 技能映射表）
  - 更新 `.cursor/ecc-reference/README.md` Skills 章节（启用数/归档数/启用步骤）
- **Harness 路由分类层**：按技术方向把 107 活动 skill + 6 MCP + 127 rule + 3 hook 归类到 `.cursor/routes/`（7 技术方向 + 3 辅助）：`01-frontend` / `02-backend` / `03-ai-orchestration` / `04-infra-devops` / `05-quality-testing` / `06-agent-harness` / `07-project-context` / `08-mcp-servers` / `09-hooks` / `10-dormant`；每文件含「skill→用途→何时读」「rule→globs→加载时机」「典型任务→工具选择」路由表；新增 alwaysApply 规则 `05-harness-routes.mdc` 强制 Agent 做任务前查路由。资产保持扁平（Cursor 加载契约），路由层做分类导航。
|- **Mobile UI 设计系统第一期**：按字节跳动 UI/UX 设计标准完成以下改造（不含 RN 模拟器截图验证，TypeScript typecheck=0 + lint=0 通过）：
  - **设计系统**：`src/theme/` 目录（colors.ts / spacing.ts / typography.ts / radius.ts / shadow.ts）+ `colorsFlat` 扁平映射 + `tailwind-colors.cjs` 同步文件
  - **SVG 图标**：30+ 品牌 SVG 图标（Icons.tsx）+ Tab 栏 5 图标用 SVG 替换 emoji + barrel `index.ts`
  - **通用组件**：`PrimaryButton`（4 variant + 3 size + loading）+ `UserAvatar`（5 size + badge）+ `LoadingSkeleton`（4 variant + 动画）+ `FullPageLoading` + `EmptyState`
  - **页面优化**：Feed 卡片（骨架屏/空状态/下拉刷新/互动栏）+ 登录页（品牌区/输入框/CTA/服务条款/分隔线）+ 造梗工坊入口（4 模式卡片）+ 个人主页（头像区/数据行/内容 Tab/菜单）
  - **类型修复**：修 ~20 处颜色引用类型错误（嵌套 `colors.brand.DEFAULT` vs 扁平 `themeColors.brand`）+ 装 @types/jest + @types/node + tsconfig 加 `node` types
  - **Tailwind 对齐**：`tailwind.config.js` colors 内联改为引用 `theme/tailwind-colors.cjs`（单源 truth），间距/字号/圆角/阴影同步
|- **Mobile UI 设计系统第二期 — Figma 视觉重构（P0）**：基于 Figma "Online Game Streaming Mobile App — Community" 设计稿（[Figma 链接](https://www.figma.com/design/3ktAZ9eJ1FmAPhNYjx8BYh/Online-Game-Streaming-Mobile-App--Community-?node-id=0-1&p=f&t=xgWpcwaQSiAMThm6-0)）进行全面视觉重构，TypeScript typecheck=0 + lint=0 通过：
  - **色彩系统**：品牌色从 `#FF5A1F` 改为 `#F7B84B`（金黄），背景从 `#0F0F12` 改为 `#1E1D1A`（深棕黑），新增 4 色 accent（青 #28ACA6 / 绿 #5ED36A / 紫 #9E5CBD / 蓝 #70A3EE）+ 语义色（border/status/god/trash/overlay/tag/AI）。`colors.ts` + `tailwind-colors.cjs` 同步
  - **Poppins 字体**：5 字重（400/500/600/700/800）通过 `expo-font` + `assets/fonts/` 本地 `.ttf` 文件加载，移除 `@expo-google-fonts/poppins` NPM 依赖（避免 pnpm hoisting 兼容问题）。`app/_layout.tsx` 新增 `FontLoader` 组件 + 骨架屏。`typography.ts` 所有 token 继承 Poppins
  - **SVG 图标**：Tab 图标从 `#FF5A1F` 金黄化 + 新增 `EyeIcon`、`ChevronDownIcon`、`LiveDotIcon`、`EditIcon`。`Icons.tsx` + `index.ts` 同步
  - **Tab 栏**：5 Tab 保留，active 色金黄 `#F7B84B` + Poppins 字体。`(tabs)/_layout.tsx`
  - **Feed 首页**：全面重建 — 搜索栏 + 8 类分类胶囊（热梗/神梗/表情包等）+ 梗卡引用 `MemeCard` 组件。`(tabs)/feed.tsx`
  - **登录页**：全面重建 — 深黑氛围 + 金黄发光 Logo + 金黄 CTA + 暗色输入框（内置 +86/验证码）。`login.tsx`
  - **Metro 配置**：简化 `metro.config.js`（去掉 hacky extraNodeModules/.pnpm 扫描），适配 pnpm monorepo
  - **UI Plan 文档**：新建 `apps/mobile/UI_PLAN.md`，记录已实现/剩余 P1-P3/基于 Figma 链接
  - **语义映射**：LIVE → PK 进行中；Viewers → 参与数；Game Categories → 梗分类；Streamer → 热门梗卡作者

### 进行中 🔄

- 无（P0 Figma 视觉重构完成，等待启动 S1 T1.1）

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
| 2026-07-08 00:50 | ECC 配置全量迁移到 Cursor | 按用户"全量+项目级"要求迁移 [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) 到本项目 Cursor 原生目录（不污染全局）：**规则** 121 条 → `.cursor/rules/ecc-*.mdc`（含优先级规则 `ecc-00-precedence.mdc` 声明项目自有规则优先；语言专属规则用 globs 限定激活）；**技能** 277 个 → `.agents/skills/`（与原有 56 个无同名冲突，合计 340，.agents/ 已被 .gitignore 故不入库但 Cursor 从磁盘加载）；**MCP** 6 个无 key 服务启用到 `.cursor/mcp.json`（context7/sequential-thinking/playwright/chrome-devtools/cloudflare-docs/parallel-search），完整 30+ 模板归档到 `.cursor/ecc-reference/mcp-servers.full.json`；**Hooks** 3 个安全钩子启用到 `.cursor/hooks.json`（提交前密钥检测/敏感文件读取警告/阻断 git --no-verify），适配器+脚本树放 `.cursor/hooks/`+`.cursor/scripts/`（已补丁路径指向 .cursor/），完整模板归档；**Agents** 7 核心（planner/architect/code-reviewer/security-reviewer/build-error-resolver/refactor-cleaner/doc-updater）转技能 `ecc-agent-*`，其余 60 归档到 `.cursor/ecc-reference/agents/`；**commands(93)/contexts(3)** 归档不激活（Cursor 无等价物）；参考文档 `.cursor/ecc-reference/README.md`。未触碰任何项目源码/PRD/技术设计/DDL/openapi。⚠️ 风险：340 技能会增大每会话可用技能清单注入（~10-15k tokens），如需瘦身可按 README 的 .cursorignore 片段排除未用语言技能 |
| 2026-07-08 01:04 | 修复 Expo 真机 404 | iOS Expo Go 连 dev server 显示 "+not-found / 404 页面不存在"。根因：`app/` 和 `app/(tabs)/` 缺 `index.tsx`，启动路由 `/` 无匹配回退 `+not-found`。修复：新增 `app/(tabs)/index.tsx`（`<Redirect href="/(tabs)/feed" />`）+ `(tabs)/_layout.tsx` 加 `<Tabs.Screen name="index" options={{ href: null }} />` 隐藏空 tab。typecheck/lint 0 新增错误。 |
| 2026-07-08 01:10 | Harness 信噪比优化 P0+P1 | 审查 `.cursor`+`.agents` 后优化：**P0** skill 瘦身 340→107（236 无关归档到 `.cursor/ecc-reference/skills/`，只留项目栈+harness）；**P1** 新建 3 个项目专属 skill（`drizzle-orm`/`bullmq-queue`/`supabase-auth`，固化查询约定+异步AI契约+混合认证）；**P1** 重写 `ecc-common-agents.mdc`（`~/.claude/agents/`→Cursor `subagent_type`+`ecc-agent-*` 技能映射）；更新 `ecc-reference/README.md`。无源码/DDL/API 改动。 |
| 2026-07-08 01:29 | Harness 路由分类层 | 按技术方向把 107 skill + 6 MCP + 127 rule + 3 hook 归类到 `.cursor/routes/`（7 方向 + 3 辅助，每文件含 skill/rule/MCP/任务路由表）；新增 alwaysApply `05-harness-routes.mdc` 指引 Agent 做任务前查路由；资产保持扁平（Cursor 加载契约），路由层做分类导航。无源码/DDL/API 改动。 |
| 2026-07-08 15:11 | Mobile UI 设计系统第二期修复 | 修第一期遗留类型错误：colors.ts 加 `colorsFlat` 扁平映射（解决嵌套 `colors.brand.DEFAULT` vs 字符串 key `colors['text-muted']` 不匹配）；改 `LoadingSkeleton`/`PrimaryButton`/`UserAvatar`/`login.tsx`/`feed.tsx` 用 `colorsFlat as themeColors`；装 `@types/jest` + `@types/node`，`tsconfig.json` `types` 加 `"node"`；`tailwind.config.js` 颜色内联改为 `require('./src/theme/tailwind-colors.cjs')`（单源 truth）；`app/_layout.tsx` 删除 `headerStyle.elevation/shadowOpacity`（RN 不支持）；`(tabs)/feed.tsx` `RefreshControl tintColor` 改 `themeColors.brand!`；`create.tsx`/`profile.tsx` 删未用 import；`create.tsx` `tagBgStyleMap` 类型改 `Record<string, { backgroundColor: string }>`；`pnpm lint --fix` 清 47 个 prettier warning。**最终：typecheck=0 errors / lint=0 errors / 0 warnings**。 |
