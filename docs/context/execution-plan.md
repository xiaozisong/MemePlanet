# 梗星球 MemeChatAI · 详细执行计划（Execution Plan）

> 本文件是 **M1 阶段可滚动推进的活状态排期计划**，由 `.cursor/rules/25-execution-plan.mdc` 自动加载。Cursor Agent 每次会话先读本文件确认"当前做到哪 / 下一步做什么"，每完成一个技术点就更新对应 `状态` 字段（pending → in_progress → done）。
>
> **与 `docs/M1-Sprint-Plan.md` 的关系**：M1-Sprint-Plan 是设计期 75 任务总清单 + 砍项建议（静态参考），本文件是 **砍后核心闭环的精细执行视图**（活状态，随推进更新）。

**最后更新**：2026-07-14
**当前 Sprint**：S1 用户系统 + AI 编排层（T1.1-T1.4 ✅ → T1.5 🔄 个人主页只读接口）
**总工时**：编码 ~25 人日 + 测试 ~5 人日 + 通电 1 人日 ≈ **31 人日**
**节奏**：1 周 1 Sprint（S1~S4），外加 S0 通电验证 1 天

---

## 0. 总体路线图

| Sprint | 周次 | 日期 | 主题 | 编码 | 测试 | 合计 | 状态 |
|---|---|---|---|---|---|---|---|
| S0 | D0 | 2026-07-07 | 脚手架通电验证 | 0 | 1.0 | 1.0 | ✅ 完成（S0-1~S0-7 全 done） |
| S1 | W2 | 2026-07-08 ~ 07-14 | 用户系统 + AI 编排层 | 8.2 | 1.5 | 9.7 | 🔄 进行中（T1.1-T1.4 ✅ 已完成，T1.5 🔄） |
| S2 | W3 | 2026-07-15 ~ 07-21 | 造梗工坊 + 梗卡发布 + 机审 | 7.0 | 1.5 | 8.5 | ⏳ 待启动 |
| S3 | W4 | 2026-07-22 ~ 07-28 | feed + 评分评论 + RN 基础页 | 9.5 | 1.5 | 11.0 | ⏳ 待启动 |
| S4 | W5 | 2026-07-29 ~ 08-04 | 合规草稿 + Demo + 收尾 | 4.6 | 1.0 | 5.6 | ⏳ 待启动 |
| **合计** | — | — | — | **29.3** | **5.5** | **35.8** | — |

> ⚠️ **产能警示**：个人开发者 4 周有效产能约 22~26 人日（含周末加班），本计划总量 ~36 人日仍偏高。**缓冲策略见 §6**：若 S1/S2 末进度滞后 > 1.5 天，立即触发"二次砍项"——优先砍 RN 个人主页编辑、Tracker SDK 接 RN、Admin shell、Web 落地页动画，把 S3 RN 任务压缩到核心 5 页。

### 关键路径（不可延迟，任一延迟拖累 M1 Demo）

```
S0 通电 → S1.T1.2 JWT → T1.3 登录 → T1.8 LLM Adapter →
S2.T2.2 BullMQ → T2.3 文本造梗 → T2.6 梗卡发布 → T2.7/T2.8 机审 →
S3.T3.2 feed → T3.5 评分 → T3.6 评论 → T3.12 RN 评分弹层 →
S4.T4.8 M1 Demo
```

---

## 1. S0 · 脚手架通电验证（1.0 人日，2026-07-07）

> 脚手架 215 文件已就绪（INF-01~12 大部分已通过文件建好），本 Sprint 只做"通电"验证：装依赖、起容器、跑 schema/seed、生成 API 类型、起后端验证 Swagger。

### 1.1 任务清单

| 任务ID | 任务名 | 技术点 | 工时 | 验收标准 | 状态 |
|---|---|---|---|---|---|
| S0-1 | 启动 Docker Desktop | Docker Desktop 运行 | 0.1 | `docker info` 可用 | ✅ done 完成日期: 2026-07-07 |
| S0-2 | 配置 .env | `cp .env.example .env`，改 `DATABASE_URL` host 为 `localhost`（含 POSTGRES_HOST/REDIS_HOST/REDIS_URL 共 4 处） | 0.1 | `.env` 文件存在且 host=localhost | ✅ done 完成日期: 2026-07-07 |
| S0-3 | pnpm install | pnpm workspaces 装依赖 | 0.3 | 无 fatal 错误，node_modules 生成 | ✅ done 完成日期: 2026-07-07（1921 包，1m47s） |
| S0-4 | pnpm db:init | 起 PG16+pgvector + Redis 容器 + 跑 schema.sql + seed.sql | 0.2 | 50 表 + 15 类种子数据建好 | ✅ done 完成日期: 2026-07-07（修了 4 个 schema/seed bug，详见 §1.4） |
| S0-5 | pnpm gen:api | 从 openapi.yaml 生成 `packages/shared/src/api-client/generated.ts` | 0.1 | generated.ts 含 34 操作类型 | ✅ done 完成日期: 2026-07-07 |
| S0-6 | pnpm dev:backend 验证 | 起后端 :3000 | 0.1 | TS 编译 0 errors + Nest fully 启动；`/health` 200；Swagger `/docs` 可访问 | ✅ done 完成日期: 2026-07-07（`JwtModule.registerAsync` 加 `global: true`，14 个 controller 共享全局 `JwtService`） |
| S0-7 | pnpm typecheck + lint | 全仓类型检查 + lint | 0.1 | typecheck 0 errors + lint 0 errors（T1.0 修复后） | ✅ done 完成日期: 2026-07-07 |

### 1.2 测试用例 + 测试时间（1.0 人日内含）

| 测试ID | 测试名 | 类型 | 时间 | 通过标准 |
|---|---|---|---|---|
| S0-T1 | 50 表 DDL 验证 | 手工 | 0.1d | `docker exec memestar-postgres-dev psql -U app -d meme -c "\dt"` 列出 50 张表 |
| S0-T2 | pgvector 扩展验证 | 手工 | 0.05d | `SELECT * FROM pg_extension WHERE extname='vector'` 返回一行 |
| S0-T3 | 后端健康检查 | 手工 | 0.05d | `curl localhost:3000/health` 返回 200 + `{status:"ok"}` |
| S0-T4 | Swagger UI 可访问 | 手工 | 0.05d | 浏览器 `localhost:3000/docs` 看到 34 接口 |

### 1.3 Sprint 退出标准
- [x] 7 项任务全部 done（S0-1~S0-7）
- [x] T1.0 脚手架 TS 补丁完成（~60 个编译错误全修，typecheck+lint 通过）
- [x] DB 就绪：50 表 + 5 扩展 + 种子数据建好
- [x] S0-6 后端 fully 启动 + Swagger + `/health`
- [x] `activeContext.md` 已更新 S0 完成、当前切到 S1（T1.1 起点）

### 1.4 S0 通电验证发现的脚手架缺陷（已修复 + 待修复）

**已修复（schema/seed 层，4 个 bug）**：
1. **ratings 分区表 UNIQUE 约束冲突**：`UNIQUE(meme_id, user_id)` 不含分区键 `created_at`，PG16 拒绝。→ 改为普通表（去分区），保留唯一约束。同步改 `schema.sql` + `Database-DDL.md`（§1/§4.5/§6.1/§6.2/§6.3/§6.4/§10.2/§10.3 共 8 处）。**设计变更，需用户确认**（见 §1.5）。
2. **legions.name citext GIN opclass 不存在**：`USING gin (name citext_ops)` 非法。→ 改为 `USING gin ((name::text) gin_trgm_ops)`。同步改 DDL 文档 2 处。
3. **pk_votes/ai_cost_logs 表达式索引非 IMMUTABLE**：`date_trunc('day', timestamptz)` 是 STABLE 非 IMMUTABLE，无法建表达式索引。→ 改为普通索引 `(user_id, voted_at)` / `(created_at, module)`，按天聚合走范围查询。同步改 DDL 文档 3 处。
4. **seed.sql 助记 uuid 非法**：`admin0001`/`tpl-0001-abstract`/`lg-0001-abstract` 等含非 hex 字符且末段非 12 位。→ 全部替换为合法 hex `00000000-0000-0000-0000-X0000000000Y`（X=类别 a/b/c/d/e，Y=序号）。共 11 类 uuid。

**待修复（代码层，~60 个 TS 编译错误，T1.0 已完成）**：
1. **缺依赖** ✅：`dotenv`、`socket.io` + `@types/socket.io` 已装。
2. **TS6059 rootDir 配置** ✅：保留 `rootDir: "./src"`，`paths` 改指向 `../../packages/shared/dist`，需先 `pnpm build:shared` 生成 d.ts + js。开发时改 shared 源码需重新 build shared（M1 阶段 shared 改动不频繁，可接受）。
3. **TS7006 @CurrentUser implicit any** ✅：12 个 controller 共 27 处 `@CurrentUser() user` 加 `: CurrentUser` 类型注解；装饰器 `interface CurrentUser` 改 `type CurrentUser = JwtPayload`（避免空 interface lint 报错）。
4. **TS2339 policy-engine 接口不匹配** ✅：`runChain` 泛型加 `P extends { name: string }` 保留 provider 方法；新增 `AIConfig`/`AIProviderConfig` 类型替代 `Record<string, Record<string, string>>`，`config.get<AIConfig>('ai')` 类型安全。

**T1.0 后剩余阻塞**：
- 无。原 Nest DI 失败已在 S0-6 修复：`AuthModule` 的 `JwtModule.registerAsync` 加 `global: true`，`JwtAuthGuard` 可在 14 个 controller 中解析 `JwtService`，后端已 fully 启动，`/health` 200，Swagger `/docs` 可访问。

### 1.5 待用户确认的 schema 设计变更

| 变更 | 原设计 | 新设计 | 理由 | 影响文档 |
|---|---|---|---|---|
| ratings 表去分区 | 按月分区（4 分区表之一） | 普通表，保留 UNIQUE(meme_id, user_id) | PG16 分区表唯一约束必须含分区键，与"一人一梗一评"语义冲突；MVP 数据量小不需要分区 | schema.sql + Database-DDL.md（已同步） |

> 如不认可此变更，请告知，我会回滚并改用"应用层 + Redis 锁保证唯一"方案（分区保留，但跨分区唯一约束无法在 DB 层实现）。

---

## 2. S1 · 用户系统 + AI 编排层（9.7 人日，W2：2026-07-08 ~ 07-14）

### 2.1 Sprint Goal
打通"手机号登录 → JWT 鉴权 → 兴趣/主页/能量"用户主链路 + AI 编排层真实接入 DeepSeek/GLM，为 S2 造梗提供 LLM 能力。

### 2.2 功能清单
1. **用户系统**：手机号验证码登录闭环、JWT 中间件 + RBAC、兴趣标签、个人主页只读、梗力值/能量基础计算、勋章字段就位
2. **AI 编排层**：抽象接口、LLM Adapter（DeepSeek V3 主 + GLM-4 Flash 兜底）、Policy Engine（熔断/限流/成本追踪）、Prompt 模板表 + 5 官方模板、Redis prompt 缓存
3. **埋点**：Tracker SDK 封装 + PostHog 接入（8 核心事件埋点延 S3）

### 2.3 任务清单（编码 8.2 人日 + T1.0 补丁 0.5 人日 = 8.7 人日）

#### S0 遗留：脚手架代码补丁（0.5 人日，S1 首日完成）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T1.0 | 脚手架 TS 编译错误修复 | ① backend tsconfig `rootDir` 保留 + `paths` 改指向 `packages/shared/dist` + 先 `pnpm build:shared`（解决 TS6059 ~30 处）② `@CurrentUser()` 装饰器 27 处加 `: CurrentUser` 类型注解 + 装饰器 interface 改 type alias（解决 TS7006）③ `policy-engine.ts` runChain 泛型加 `P extends {name:string}` + 定义 `AIConfig`/`AIProviderConfig` 类型（解决 TS2339）④ 装 dotenv + socket.io 依赖 | 0.5 | S0 | `pnpm typecheck` + `pnpm lint` 通过；`pnpm dev:backend` 编译 0 errors 并启动到 Nest DI 阶段（DI 装配属 S1 各 Module 编码任务） | ✅ done 完成日期: 2026-07-07 |
| T1.0b | mobile nativewind 版本对齐 | `metro.config.js`/`babel.config.js`/`tailwind.config.js`/`nativewind-env.d.ts` 全是 v4 写法（`withNativeWind`/`nativewind/metro`/`nativewind/preset`/`nativewind/types`），但 package.json 装的是 v2.0.11（无这些子路径）→ 升 `nativewind` ^2.0.11 → ^4.2.6；顺带 `pnpm lint --fix` 清 47 个 className 顺序 warning | 0.2 | S0 | `pnpm dev:mobile` expo start 成功（Metro 就绪 localhost:8081，可 Expo Go 扫码）；mobile `tsc --noEmit` 0 errors；`pnpm lint` 0 errors 0 warnings | ✅ done 完成日期: 2026-07-07 |

#### 用户系统（4.4 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T1.1 | Drizzle 用户表 schema 对齐 | `apps/backend/src/database/schema.ts` user/profile/level/badges 字段，与 `docs/db/schema.sql` 对齐 | 0.3 | S0 | Drizzle schema 与 SQL 一致；`pnpm db:generate` 生成迁移 | ✅ done 完成日期: 2026-07-10 |
| T1.2 | Supabase Auth + JWT 中间件 | Supabase JWT 校验 + 自签 JWT 双轨、AuthGuard、`@Roles` RBAC 装饰器 | 1.0 | T1.1 | 受保护接口需带 JWT；RBAC 装饰器生效 | ✅ done 完成日期: 2026-07-13 |
| T1.3 | 手机号验证码登录 | OTP 生成（6 位）/Redis 存储（5min TTL）/校验/限频（同号 60s/3 次·小时）、短信 SDK（阿里云/腾讯云）、Supabase Auth 联动 | 1.0 | T1.2 | 真机收到验证码；登录下发 JWT | ✅ done 完成日期: 2026-07-13 |
| T1.4 | 兴趣标签接口 + 冷启动 | 标签库种子（30+）、GET/PATCH `/users/me/interests`、冷启动 feed 比例配置 | 0.3 | T1.1 | 接口可读可写 `user.interest_tags` | ✅ done 完成日期: 2026-07-13 |
| T1.5 | 个人主页只读接口 | GET `/users/:id` 返回资料/等级/勋章/作品数；编辑延 M2 | 0.3 | T1.1 | 接口返回完整字段 | 🔄 in_progress |
| T1.6 | 梗力值/能量基础 service | `level = f(meme_power)` 公式、能量每日恢复 cron、衰减规则延 M2、扣减乐观锁 | 0.5 | T1.1 | 单测覆盖等级/能量计算；恢复 cron 跑通 | ⏳ pending |
| T1.7 | 勋章字段就位 | `user_badge` 表 + 字段占位，触发器框架延 M2 | 0.3 | T1.1 | 表与字段就位；可写入占位数据 | ⏳ pending |
| T1.8 | Supabase Webhook 同步（简化为轮询） | 国内 PG 定时（1min）拉取 Supabase auth.users 变更同步 user 表，Webhook M2 接 | 0.7 | T1.2 | 国内 PG user 表与 Supabase 同步 | ⏳ pending |

#### AI 编排层（3.3 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T1.9 | AIOrch 抽象接口 | `LLMProvider`/`ImageProvider`/`VideoProvider`/`TTSProvider` 接口 + Adapter 注册 + Mock adapter | 0.5 | S0 | 接口文件就位；Mock 单测通过 | ⏳ pending |
| T1.10 | LLM Adapter: DeepSeek V3 + GLM 兜底 | DeepSeek chat API、GLM-4-Flash 兜底、流式 + 非流式、function calling 占位、错误率监控 | 1.0 | T1.9 | 真实调用成功；主链失败自动切兜底 | ⏳ pending |
| T1.11 | Policy Engine | provider 错误率 > 30% 熔断 5min、日预算限流（Agent ¥80/d 占位）、`ai_cost_log` 表写入 | 1.0 | T1.9 | 熔断演练触发；cost_log 写入；超限返回 429 | ⏳ pending |
| T1.12 | Prompt 模板表 + 5 官方模板 | `prompt_template` 表 + 抽象/阴阳/谐音/反转/表情包配文 5 模板种子、变量插值 | 0.5 | T1.1 | 模板可读可渲染；变量插值正确 | ⏳ pending |
| T1.13 | Redis prompt 缓存 | md5(prompt+style) 缓存候选 24h、命中跳过 LLM 调用 | 0.3 | T1.10 | 缓存命中验证；命中跳过 API 调用 | ⏳ pending |

#### 埋点（0.5 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T1.14 | Tracker SDK 封装 + PostHog 接入 | 客户端 `track(name, props)`、双写 PostHog + 自建 analytics_event 表 | 0.5 | S0 | SDK 可调用；PostHog 收到测试事件 | ⏳ pending |

### 2.4 测试用例 + 测试时间（1.5 人日）

| 测试ID | 测试名 | 类型 | 覆盖任务 | 时间 | 通过标准 |
|---|---|---|---|---|---|
| S1-T1 | JWT 中间件 + RBAC 单测 | 单测 | T1.2 | 0.2d | 无 token/过期 token/越权访问全部 401/403 |
| S1-T2 | 能量扣减乐观锁并发测试 | 单测 | T1.6 | 0.2d | 10 并发扣减不超扣，余额准确 |
| S1-T3 | LLM Adapter mock 测试 | 单测 | T1.10 | 0.2d | Mock 主链抛错 → 自动切 GLM 兜底成功 |
| S1-T4 | Policy Engine 熔断演练 | 集成 | T1.11 | 0.3d | 错误率 > 30% 触发熔断 5min；cost_log 写入 |
| S1-T5 | Prompt 模板插值单测 | 单测 | T1.12 | 0.1d | 5 模板变量插值结果正确 |
| S1-T6 | 手机号登录端到端 | 集成 | T1.3 | 0.3d | 真机/Postman 走完：发码 → 输入 → 登录 → JWT 下发 |
| S1-T7 | LLM 真实调用 + 兜底演练 | 集成 | T1.10 | 0.2d | DeepSeek 真实 key 调用成功；手动断网触发兜底 |

### 2.5 Sprint 退出标准
- [ ] 14 项编码任务全部 done
- [ ] 7 项测试全部通过
- [ ] 手机号登录闭环 + JWT 鉴权可用
- [ ] DeepSeek 真实接入 + GLM 兜底演练通过
- [ ] Policy Engine 熔断演练触发
- [ ] `activeContext.md` 更新 S1 完成

---

## 3. S2 · 造梗工坊 + 梗卡发布 + 机审（8.5 人日，W3：2026-07-15 ~ 07-21）

### 3.1 Sprint Goal
打通"造梗任务 → 梗卡发布 → 机审 → 上架"核心闭环，AI 生成内容 100% 带标识 + 机审双重过滤（敏感词 DFA + 阿里云内容安全）。

### 3.2 功能清单
1. **造梗工坊**：creation_session 表 + 能量扣减、BullMQ 队列 + Worker、文本造梗 3 候选、造梗接口（202 + 轮询）
2. **梗卡内容流（发布侧）**：meme_card 表、发布接口、状态机 pending_audit → published
3. **内容安全**：阿里云内容安全（文本）、敏感词 DFA 库 + 热更新、机审队列、AI 生成标识、AI 调用日志
4. **图片造梗延 M2**（按砍项计划，AIO-03/CRE-04/CRE-08 全推 M2）

### 3.3 任务清单（编码 7.0 人日）

#### 造梗工坊（3.8 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T2.1 | creation_session 表 + 能量扣减乐观锁 | 表 + 索引、乐观锁扣能量、`agent_mode` 字段占位 | 0.5 | T1.6 | 并发扣能量不超扣；单测覆盖 | ⏳ pending |
| T2.2 | BullMQ 队列 + Worker 框架 | `creation_jobs` 队列、Worker 进程、重试 3 次/超时 60s/优先级、进度推送骨架 | 0.8 | S0, T2.1 | Worker 消费任务；失败重试 3 次 | ⏳ pending |
| T2.3 | 文本造梗任务（3 候选） | LLM 调用、prompt 组装（模板 + 用户输入隔离）、3 候选、24h prompt md5 去重、Redis 缓存命中 | 1.0 | T1.10, T1.12, T2.2 | 真实生成 3 候选；缓存命中跳过；去重生效 | ⏳ pending |
| T2.4 | 造梗接口 POST /creations | 同步返回 `creation_id` + 202、客户端轮询 `GET /creations/:id/status` | 0.5 | T2.2 | 接口返回 202；状态轮询通 | ⏳ pending |
| T2.5 | 造梗结果获取接口 | GET `/creations/:id` 返回候选列表、状态、能量扣减记录 | 0.5 | T2.3 | 接口返回完整候选 | ⏳ pending |
| T2.6 | 24h prompt 去重 + 限频 | 同用户同 prompt 24h 去重、单用户造梗限频（10 次/日） | 0.5 | T2.3 | 重复 prompt 命中缓存；超限返回 429 | ⏳ pending |

#### 梗卡发布（1.8 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T2.7 | meme_card 表 + 索引 | 表 + 索引（author/legion/hot_score/status/published_at/god_trash）、tsvector 全文索引、`meme_embedding` 表骨架（向量化 M2） | 0.5 | T1.1 | DDL 文档化；索引建好 | ⏳ pending |
| T2.8 | 梗卡发布接口 + 状态机 | POST `/memes`、包装（标题/标签/军团可选）、`status=pending_audit`、入审核队列 | 0.8 | T2.4, T2.7, T2.10 | 接口可发布；状态机正确流转 | ⏳ pending |
| T2.9 | 梗卡状态查询接口 | GET `/memes/:id/status`（pending_audit/under_review/published/rejected） | 0.5 | T2.8 | 状态返回正确 | ⏳ pending |

#### 内容安全（3.4 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T2.10 | 阿里云内容安全接入（文本） | 文本审核 SDK、阈值配置、结果回写 `audit_log`、图片审核 M2 接 | 0.8 | T1.9 | 真实调用成功；结果落 audit_log | ⏳ pending |
| T2.11 | 敏感词 DFA 库 + 热更新 | 开源词库 + 自建补充、DFA 匹配 + 拼音变体、运营后台热更新接口 | 1.0 | S0 | 命中敏感词秒级拦截；热更新生效 | ⏳ pending |
| T2.12 | 机审队列 + 人审入口 | BullMQ `audit_jobs`、可疑入人审队列（M2 后台完善）、违规驳回 + 通知 | 0.5 | T2.10, T2.2 | 队列流转正确；驳回通知发出 | ⏳ pending |
| T2.13 | AI 生成内容标识 | 梗卡详情页"AI 辅助创作"声明字段、图片角标占位（图 M2） | 0.3 | T2.8 | 100% AI 梗卡带标识字段 | ⏳ pending |
| T2.14 | AI 调用日志留存 | prompt + 参数 + 输出落库 6 个月、与 `ai_cost_log` 关联 | 0.3 | T1.11 | 日志可查；保留策略生效 | ⏳ pending |
| T2.15 | 发布流程串通 | 造梗 → 选候选 → 发布 → 入机审队列 → 机审 pass → published，全链路串通 | 0.5 | T2.8, T2.12 | 端到端走通 | ⏳ pending |

### 3.4 测试用例 + 测试时间（1.5 人日）

| 测试ID | 测试名 | 类型 | 覆盖任务 | 时间 | 通过标准 |
|---|---|---|---|---|---|
| S2-T1 | 能量扣减乐观锁并发测试 | 单测 | T2.1 | 0.2d | 20 并发造梗扣能量不超扣 |
| S2-T2 | BullMQ 重试 + 超时测试 | 单测 | T2.2 | 0.2d | 任务失败重试 3 次后进 dead letter；超时正确触发 |
| S2-T3 | 敏感词 DFA 命中测试 | 单测 | T2.11 | 0.3d | 100 条敏感词样本秒级拦截；拼音变体命中 |
| S2-T4 | 24h prompt 去重测试 | 单测 | T2.6 | 0.1d | 同 prompt 24h 内返回缓存候选 |
| S2-T5 | 梗卡状态机流转测试 | 单测 | T2.8 | 0.2d | pending_audit → under_review → published/rejected 状态正确 |
| S2-T6 | 阿里云内容安全真实调用 | 集成 | T2.10 | 0.3d | 真实文本样本（含违规）审核结果正确回写 |
| S2-T7 | 造梗→发布→机审端到端 | 集成 | T2.15 | 0.2d | 端到端走通：造梗 3 候选 → 选 1 发布 → 机审 pass → published |

### 3.5 Sprint 退出标准
- [ ] 15 项编码任务全部 done
- [ ] 7 项测试全部通过
- [ ] 文本造梗 3 候选真实生成（DeepSeek）
- [ ] 梗卡发布 → 机审 → published 状态机正确
- [ ] AI 生成梗卡 100% 带标识
- [ ] `activeContext.md` 更新 S2 完成

---

## 4. S3 · feed + 评分评论 + RN 基础页（11.0 人日，W4：2026-07-22 ~ 07-28）

### 4.1 Sprint Goal
打通"feed 浏览 → 梗卡详情 → 评分评论"消费侧闭环 + RN App 真机可用，M1 端到端可演示链路全通。

### 4.2 功能清单
1. **梗卡内容流（消费侧）**：热度 ZSet + cron、推荐 feed 接口（热度召回 v1）、梗卡详情 + Redis 缓存
2. **评分评论**：rating + comment 表、评分接口（加权）、评论接口（敏感词）、转发举报延 M2
3. **RN App**：5 Tab 框架、登录页、兴趣选择、文本造梗交互、feed 瀑布流、梗卡详情 + 评分弹层、个人主页只读、我的页占位、Tracker SDK 接 RN + 8 核心事件埋点

### 4.3 任务清单（编码 9.5 人日）

#### 后端：feed + 评分（3.4 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T3.1 | 热度分 Redis ZSet + cron | `recomputeHotScore` 实现、每 10min cron、实时增量 ZINCRBY | 0.5 | T2.7, S0 | ZSet 有数据；cron 跑通 | ⏳ pending |
| T3.2 | 推荐 feed 接口（热度召回 v1） | GET `/feed`、热度 ZSet Top 70% + 新品 Top 30% 混合、分页 20 条/页、多样性重排简化 | 0.8 | T3.1 | 返回 20 条/页；分页正确 | ⏳ pending |
| T3.3 | 梗卡详情接口 + 缓存 | GET `/memes/:id`、Redis 缓存 10min、CF 边缘 1min 占位、写时失效 | 0.5 | T2.7 | 详情返回完整字段；缓存生效 | ⏳ pending |
| T3.4 | rating + comment 表 + 唯一约束 | rating 表（meme_id+user_id 唯一）、comment 表（parent_id 自引用） | 0.3 | T2.7 | DDL 文档化；唯一约束生效 | ⏳ pending |
| T3.5 | 评分接口 + 加权计算 | POST `/ratings`、加权（评审官 1.5x / 新用户 0.5x / 同军团 0.8x）、24h 可改分、综合分实时更新 | 0.8 | T3.4 | 评分写入；权重计算正确；综合分更新 | ⏳ pending |
| T3.6 | 评论接口 + 敏感词过滤 | POST `/comments`、DFA 敏感词过滤、可疑走阿里云、举报触发人审 | 0.5 | T3.4, T2.11 | 评论写入；敏感词拦截 | ⏳ pending |

#### 前端 RN App（6.1 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T3.7 | RN App 框架 + 5 Tab 导航 | Expo Router 5 Tab（首页/造梗/军团占位/消息占位/我的）、Zustand 状态、TanStack Query 数据层、NativeWind 样式、API client 封装 | 0.8 | S0 | App 模拟器跑起来；5 Tab 可切换 | ⏳ pending |
| T3.8 | RN 登录页 + OTP 输入 | 手机号输入、OTP 6 位输入 + 倒计时 60s、错误态、JWT 持久化（SecureStore） | 0.8 | T1.3, T3.7 | 真机登录成功；JWT 持久化 | ⏳ pending |
| T3.9 | RN 兴趣标签选择页 | 标签瀑布选择（≥3 个）、跳过逻辑、埋点 | 0.5 | T1.4, T3.8 | 选择写入服务端；进入主页 | ⏳ pending |
| T3.10 | RN 文本造梗交互 + 候选展示 | 关键词输入、模板选择、3 候选"盲盒"展示、再来一次、挑选、提交发布、轮询状态 | 1.0 | T2.4, T3.7 | 真机生成成功；候选可挑选并发布 | ⏳ pending |
| T3.11 | RN feed 瀑布流页 | 瀑布流（图/文混合）、下拉刷新、上拉加载、骨架屏、空态 | 1.0 | T3.2, T3.8 | 真机列表渲染；下拉刷新正常 | ⏳ pending |
| T3.12 | RN 梗卡详情页 + 评分弹层 + 评论列表 | 详情页、1-5 星评分弹层、神/烂梗二元选择占位（判定 M2）、评论列表 + 发送、@占位 | 1.0 | T3.3, T3.5, T3.6 | 真机评分/评论可用 | ⏳ pending |
| T3.13 | RN 个人主页只读 + 我的页占位 | 主页只读（资料/等级进度/勋章墙占位）、我的页（设置/青少年模式入口占位） | 0.5 | T1.5, T3.8 | 主页渲染；我的页可访问 | ⏳ pending |
| T3.14 | Tracker SDK 接 RN + 8 核心事件埋点 | 接入 T1.14 的 SDK、埋 8 事件（app_launch/login_success/meme_create_start/success/meme_publish/meme_view/meme_score/meme_comment） | 0.5 | T1.14, T3.10 | 8 事件在 PostHog 看板可见 | ⏳ pending |

### 4.4 测试用例 + 测试时间（1.5 人日）

| 测试ID | 测试名 | 类型 | 覆盖任务 | 时间 | 通过标准 |
|---|---|---|---|---|---|
| S3-T1 | 热度分 cron + ZSet 测试 | 单测 | T3.1 | 0.2d | cron 跑通后 ZSet 排序正确 |
| S3-T2 | feed 分页 + 多样性测试 | 单测 | T3.2 | 0.2d | 20 条/页；不重复；热度/新品混合比例正确 |
| S3-T3 | 评分加权计算测试 | 单测 | T3.5 | 0.3d | 评审官/新用户/同军团权重正确；综合分更新；24h 改分生效 |
| S3-T4 | 评论敏感词过滤测试 | 集成 | T3.6 | 0.2d | 含敏感词评论被拦截；正常评论写入 |
| S3-T5 | RN 真机回归测试 | 手工 | T3.7~T3.13 | 0.4d | iOS/Android 模拟器走完：登录 → 兴趣 → 造梗 → 发布 → feed → 详情 → 评分评论 |
| S3-T6 | 端到端联调 | 集成 | 全 | 0.2d | 后端 + RN 联调无 fatal 错误 |

### 4.5 Sprint 退出标准
- [ ] 14 项编码任务全部 done
- [ ] 6 项测试全部通过
- [ ] feed 接口返回 20 条/页 + 热度排序正确
- [ ] 评分 + 评论接口可用
- [ ] RN App 真机走完核心闭环
- [ ] 8 核心事件在 PostHog 可见
- [ ] `activeContext.md` 更新 S3 完成

---

## 5. S4 · 合规草稿 + M1 Demo + 收尾（5.6 人日，W5：2026-07-29 ~ 08-04）

### 5.1 Sprint Goal
完成 AIGC 备案材料草稿（M3 上线 gate）+ 隐私政策 + 未成年人保护设计稿 + Web 落地页 + Admin shell 登录页 + M1 Demo 视频 + M2 backlog 初稿。

### 5.2 功能清单
1. **合规**：AIGC 备案材料草稿（≥ 80%）、隐私政策 + 用户协议 v0.1 + RN 弹窗、未成年人保护设计稿
2. **Web/Admin**：Next.js Web 落地页、Admin shell 仅登录页
3. **文档**：OpenAPI 自动生成（Swagger 已有）、DB DDL 文档对齐 M1 表、M1 Demo 视频、M2 backlog 初稿

### 5.3 任务清单（编码/文档 4.6 人日）

| 任务ID | 任务名 | 技术点 | 工时 | 依赖 | 验收 | 状态 |
|---|---|---|---|---|---|---|
| T4.1 | AIGC 备案材料草稿 | 模型来源（DeepSeek/GLM/SiliconFlow/豆包）、训练数据说明、安全评估报告、内容审核机制、用户协议与隐私政策 | 1.5 | — | 草稿完成 ≥ 80% | ⏳ pending |
| T4.2 | 隐私政策 + 用户协议 v0.1 + RN 弹窗 | 法务模板 + 项目定制、首次启动强制弹窗、AI 生成内容条款、未成年人条款 | 0.5 | T4.1 | 文档完成；RN 弹窗接入 | ⏳ pending |
| T4.3 | 未成年人保护设计稿 | 青少年模式规则（40min/22-6 禁用/禁发布评分私信）、实名年龄字段就位 | 0.3 | T1.1 | 设计稿完成；字段就位 | ⏳ pending |
| T4.4 | Next.js Web 落地页 | 首页 + 下载引导 + 隐私政策/用户协议展示页 | 0.5 | S0 | 落地页部署 Vercel | ⏳ pending |
| T4.5 | Admin shell 仅登录页 | Next.js Admin 登录页 + 基础布局占位（审核/PK/看板 M2 接） | 0.3 | T1.2 | Admin 登录通 | ⏳ pending |
| T4.6 | OpenAPI 文档自动生成对齐 | Swagger 自动生成（NestJS 已有）+ 确认覆盖 M1 全部接口 | 0.2 | S1 | Swagger UI 完整可读 | ⏳ pending |
| T4.7 | DB DDL 文档对齐 M1 表 | `Database-DDL.md` 对齐 M1 实际建的表 + 索引 + 约束 | 0.3 | T2.7, T3.4 | DDL markdown 完成 | ⏳ pending |
| T4.8 | M1 Demo 视频 + Sprint Review + M2 backlog | 端到端演示视频（登录 → 造梗 → 发布 → feed → 评分评论）、Review 记录、M2 backlog 初稿 | 1.0 | S3 | Demo 视频产出；M2 backlog 草稿 | ⏳ pending |

### 5.4 测试 + 联调（1.0 人日）

| 测试ID | 测试名 | 类型 | 时间 | 通过标准 |
|---|---|---|---|---|
| S4-T1 | M1 Exit Criteria 全量验证 | 手工 checklist | 0.5d | `M1-Sprint-Plan.md §8` 退出标准 ≥ 90% 勾选 |
| S4-T2 | 端到端 Demo 走查 | 手工 | 0.3d | Demo 视频一次拍成无 fatal |
| S4-T3 | 文档一致性校验 | `pnpm check:context` | 0.2d | exit 0 或仅警告 |

### 5.5 Sprint 退出标准
- [ ] 8 项任务全部 done
- [ ] AIGC 备案材料草稿 ≥ 80%
- [ ] 隐私政策 + 用户协议 v0.1 + RN 弹窗接入
- [ ] Web 落地页部署 + Admin 登录页可用
- [ ] M1 Demo 视频产出
- [ ] M2 backlog 初稿完成
- [ ] **M1 完成，进入 M2**

---

## 6. 风险与缓冲策略

### 6.1 高危节点（任一延迟拖累整体）

| 节点 | Sprint | 风险 | 缓解 |
|---|---|---|---|
| S0 通电 | S0 | Docker/网络问题 | 提前一天启动 Docker Desktop，预先拉镜像 |
| T1.3 短信 SDK | S1 | 阿里云/腾讯云短信签名审核 1~3 天 | S0 当天就提交签名申请 |
| T1.10 DeepSeek key | S1 | 申请/计费/限流踩坑 | S0 当天申请 DeepSeek + GLM key，先小额度跑通 |
| T2.10 阿里云内容安全 | S2 | 免费额度申请延迟 | 备选易盾免费试用 + 自建敏感词为主 |
| T3.10 RN 文本造梗 | S3 | Expo/EAS 踩坑 | S0 末先跑通 Expo hello world |
| T4.1 AIGC 备案 | S4 | 材料准备不足 | 复用豆包已备案模型作为支撑材料 |

### 6.2 二次砍项触发条件

**触发条件**：S1 或 S2 末进度滞后 > 1.5 天，或 S3 中进度滞后 > 1 天。

**二次砍项优先级（按节省工时降序）**：
1. T3.13 RN 个人主页只读 → 占位页（-0.3d）
2. T1.14 + T3.14 Tracker SDK 接 RN → 仅留后端埋点（-0.5d）
3. T4.4 Web 落地页 → 静态 HTML 占位（-0.3d）
4. T4.5 Admin shell → 推 M2（-0.3d）
5. T1.8 Supabase 轮询同步 → 推 M2，M1 用 Supabase 直读（-0.7d）
6. T3.9 RN 兴趣选择页 → 简化为弹窗（-0.2d）

**最坏情况**：S3 RN 任务压缩到 5 页（登录/造梗/feed/详情/评分），总工时压到 ~28 人日，仍保证 M1 Demo 闭环可演示。

---

## 7. Agent 推进协议（Cursor Agent 必读）

### 7.1 会话开头自检
1. 读本文件 §0 总体路线图 → 知道当前 Sprint
2. 读当前 Sprint 章节 → 找到第一个 `状态 = ⏳ pending` 的任务
3. 读 `docs/context/activeContext.md` → 确认无上下文漂移
4. 若发现代码状态与本文件 `状态` 字段不一致 → 主动向用户报告"上下文漂移"

### 7.2 推进一个任务的流程
1. 把目标任务 `状态` 从 `⏳ pending` 改为 `🔄 in_progress`
2. 同步更新 `activeContext.md` 的"进行中"区
3. 编码/测试 → 跑 `pnpm typecheck` + `pnpm lint`
4. 验收标准全部满足后，`状态` 改为 `✅ done`，并在任务行尾追加 `完成日期: YYYY-MM-DD`
5. 更新 `activeContext.md`：把该任务从"进行中"移到"已完成"，"会话历史"加一行
6. 更新 `progress.md`：勾选对应已完成项

### 7.3 完成 Sprint 的流程
1. 该 Sprint 所有任务 `状态 = ✅ done`
2. 该 Sprint 所有测试通过
3. Sprint 退出标准全部勾选
4. 更新 §0 总体路线图：该 Sprint `状态` 改为 `✅ 完成`
5. 更新 `activeContext.md`：当前 Sprint 切到下一个，"下一步"区调整
6. 更新 `progress.md`："总体进度"表对应 Sprint 状态改为"完成"

### 7.4 状态字段约定
- `⏳ pending`：未启动
- `🔄 in_progress`：进行中
- `✅ done`：已完成（追加 `完成日期`）
- `❌ blocked`：阻塞（追加 `阻塞原因`）
- `⏭️ deferred`：延后到 M2（追加 `去向`）

### 7.5 与其他上下文文件的关系
- 本文件 = **执行视图**（任务级粒度，活状态）
- `docs/M1-Sprint-Plan.md` = **设计视图**（75 任务总清单，静态参考）
- `docs/context/activeContext.md` = **会话焦点**（当前在做什么，活状态）
- `docs/context/progress.md` = **进度全景**（Sprint 级粒度，活状态）
- `docs/context/decisions.md` = **决策日志**（冻结，勿擅改）

**冲突优先级**：本文件 > activeContext.md > progress.md > M1-Sprint-Plan.md（设计期文档）

### 7.6 Definition of Done（任务完成标准）
- [ ] 代码实现通过 `pnpm typecheck` + `pnpm lint`（无新增错误）
- [ ] 任务验收标准全部满足
- [ ] 本文件 `状态` 字段已更新为 `✅ done`
- [ ] `activeContext.md` 已同步更新
- [ ] 涉及表结构变更已同步 4 处（schema.sql + Database-DDL.md + Drizzle + openapi.yaml）
- [ ] 涉及接口变更已同步 2 处（openapi.yaml + API-Spec.md）+ 跑 `pnpm gen:api`

**未更新本文件状态字段的任务不算完成**——下一会话会因找不到进度而迷失。
