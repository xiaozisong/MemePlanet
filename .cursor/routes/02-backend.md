# 02 · 后端开发路由

> 覆盖：**apps/backend（NestJS 10 模块化单体，15 Module）** + **数据层（Drizzle ORM + PostgreSQL 16 + pgvector + Redis + BullMQ）** + **认证（Supabase Auth + 自建 JWT）** + **API 契约**。

## Skills（按需 Read `.agents/skills/<name>/SKILL.md`）

### 框架与模式
| skill | 用途 | 何时读 |
|---|---|---|
| `nestjs-patterns` | NestJS Module/Controller/Provider、DTO、Guard、Interceptor | 写 NestJS 任何代码 |
| `backend-patterns` | 后端通用模式（仓储、分层、错误处理） | 设计后端结构 |
| `api-design` | REST API 设计、响应契约、错误码 | 设计/改接口 |
| `error-handling` | 错误处理模式 | 写异常过滤器/业务异常 |

### 数据层
| skill | 用途 | 何时读 |
|---|---|---|
| `drizzle-orm` ⭐项目专属 | Drizzle 查询构建器、迁移、pgvector HNSW、4 表软删除、`@Inject(DRIZZLE)` | **写任何数据库访问/改表** |
| `postgresql` | PG 特性、索引、分区、扩展 | 调 PG 性能/特性 |
| `postgres-patterns` | PG 项目模式 | 设计 PG schema |
| `redis` | Redis 数据结构、持久化 | 写缓存/队列/限流 |
| `redis-patterns` | Redis 项目模式 | 组织 Redis 用法 |
| `database-migrations` | 迁移策略、回滚 | 写/跑迁移 |

### 队列与认证
| skill | 用途 | 何时读 |
|---|---|---|
| `bullmq-queue` ⭐项目专属 | 异步 AI 任务契约（POST→202+job_id→轮询/WS）、5 态状态机、降级链、配额 | **写任何 AI 生成接口/Worker** |
| `supabase-auth` ⭐项目专属 | 手机号 OTP + 自建 JWT + Realtime 私聊 + 自建群聊 WS | **写登录/IM/鉴权** |

> ⭐ = P1 新建的项目专属 skill，固化项目约定，优先读。

## Rules（自动加载）

### TypeScript 通用（前后端共用，globs `**/*.ts,**/*.tsx`）
| rule | 路径 | 用途 |
|---|---|---|
| ecc-typescript-coding-style | `.cursor/rules/ecc-typescript-coding-style.mdc` | TS 代码风格 |
| ecc-typescript-hooks | `.cursor/rules/ecc-typescript-hooks.mdc` | TS hooks 规范 |
| ecc-typescript-patterns | `.cursor/rules/ecc-typescript-patterns.mdc` | TS 模式 |
| ecc-typescript-security | `.cursor/rules/ecc-typescript-security.mdc` | TS 安全 |
| ecc-typescript-testing | `.cursor/rules/ecc-typescript-testing.mdc` | 测 TS |

### 项目自有（alwaysApply 或 globs `apps/**,packages/**`）
| rule | 路径 | 加载 | 用途 |
|---|---|---|---|
| `10-coding-conventions.mdc` | `.cursor/rules/` | globs `apps/**,packages/**` | **后端编码强约束**：统一响应拦截器、全局异常过滤器、JWT 鉴权、DTO zod、AI 必走 AIOrchModule、Drizzle 注入、成本追踪 |
| `00-project-context.mdc` | `.cursor/rules/` | alwaysApply | 技术栈、约定、快速启动 |
| ecc-common-patterns | `.cursor/rules/` | alwaysApply | 仓储模式、API 响应封装 |

## MCP / 工具

- 暂无 DB 直连 MCP（可选增强：postgres MCP，需 key）。改表后用 `pnpm --filter @memestar/backend db:generate` 生成迁移验证。

## 典型任务 → 工具选择

| 任务 | 用什么 |
|---|---|
| 写新 NestJS Module | `nestjs-patterns` + `10-coding-conventions.mdc` §后端（Module 含 .module/.controller/.service/.dto） |
| 改表结构 | `drizzle-orm` skill + **4 处同步**（schema.sql + Database-DDL.md + schema.ts + openapi.yaml）+ `database-migrations` |
| 写数据库查询 | `drizzle-orm` skill（禁裸 SQL，用查询构建器） |
| 写 pgvector 推荐/检索 | `drizzle-orm` skill §pgvector（HNSW + `vector_cosine_ops`）+ `postgres-patterns` |
| 写 AI 生成接口 | `bullmq-queue` skill（POST→202+job_id）+ `nestjs-patterns` + 必走 `AIOrchestrator` |
| 写登录闭环 | `supabase-auth` skill（OTP + 自建 JWT + Guard） |
| 写私聊/群聊 | `supabase-auth` skill §IM（私聊 Realtime / 群聊自建 WS） |
| 设计/改 REST 接口 | `api-design` skill + 改 `openapi.yaml` + `API-Spec.md` + 跑 `pnpm gen:api` |
| 写缓存/限流 | `redis` + `redis-patterns` skill |

## 项目硬约定（见 `10-coding-conventions.mdc`，勿违反）

- Controller 直接 return data，不要手动包 `{code,data,message}`（`ResponseInterceptor` 全局）。
- Service 抛 NestJS 内置异常或自定义业务异常（`AllExceptionsFilter` 全局）。
- JWT：`@UseGuards(JwtAuthGuard)` + `@CurrentUser()`，公开接口 `@Public()`。
- DTO：zod schema + `ZodValidationPipe`，禁裸接 req.body。
- **AI 调用必走 `AIOrchModule`**，禁业务 Service 直接调 provider（见 `03-ai-orchestration.md`）。
- 数据库：`@Inject(DRIZZLE)`，禁 `pg.Pool` 拼 SQL。
- 每次 AI 调用写 `ai_cost_logs`，Policy Engine 按日预算熔断。
- 字段命名以 `docs/db/schema.sql` 为权威；改表同步 4 处。
- pgvector 用 HNSW（非 IVFFlat），余弦距离；软删除仅 `users/meme_cards/legions/comments`。
