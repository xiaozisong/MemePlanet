# 梗星球 MemeChatAI

> AI 造梗 + 内容评分社区 + 阵营化社交 + 实时聊天四合一，以「梗卡」为最小内容单元，构建「造梗 → 评分 → 神/烂梗判定 → 军团 PK」的内容生产与对抗闭环。

本仓库是 MemeChatAI 的 monorepo 工程脚手架，对齐 [TechnicalDesign.md](./docs/TechnicalDesign.md) v1.1.0 与 [M1-Sprint-Plan.md](./docs/M1-Sprint-Plan.md) v1.0.0。M1 第一周（S1 基础设施）即可在此脚手架之上启动开发。

> **Cursor Agent 用户**：本项目已配置 `.cursor/rules/` 项目规则（会话自动加载）+ `docs/context/` Memory Bank 活文档。新会话开始时 Agent 会自动读取项目上下文；如需查看当前进度/决策/活状态，见 [docs/context/](./docs/context/)。

---

## 技术栈总表

| 层 | 选型 | 说明 |
| --- | --- | --- |
| Monorepo | pnpm workspaces | 轻量、个人开发者首选 |
| App | React Native + Expo（Expo Router） | managed workflow，TypeScript，热更新绕过商店审核 |
| Web / 后台 | Next.js 14（App Router）+ Tailwind + shadcn/ui | 落地页 + 运营后台 |
| 后端 | NestJS 10+（TypeScript，模块化单体） | 15 个 Module 骨架 |
| 共享层 | `packages/shared` | TS 类型 / API client / 常量 / AI prompt 模板 |
| 数据库 | PostgreSQL 16 + pgvector | 已建表，DDL 见 `docs/db/schema.sql` |
| ORM | Drizzle ORM | TS 优先、轻量 |
| 缓存 / 队列 | Redis + BullMQ | ZSet 排行榜 / PK 计数 / 异步任务 |
| AI 编排 | Vercel AI SDK + 自建抽象层 | LLM / Image / Video / TTS adapter + Policy Engine |
| LLM | DeepSeek V3 主 + GLM-4 Flash 兜底 | |
| 图像 | SiliconFlow FLUX + 通义万相兜底 | |
| 视频 | 字节豆包 Seedance 2.0 mini + 兜底 | 火山方舟 API |
| TTS | 火山引擎 | |
| 认证 | Supabase Auth + 自建 JWT | |
| IM | Supabase Realtime（私聊）+ NestJS WebSocket（军团群聊） | |
| 存储 | Cloudflare R2（S3 兼容，AWS SDK for JS） | 出流量免费 |
| 监控 | Sentry + PostHog + UptimeRobot | |
| CI/CD | GitHub Actions | |
| 容器化 | Docker + docker-compose | PG + Redis + NestJS + Worker |
| 代码质量 | ESLint + Prettier + TS strict + Husky + lint-staged + commitlint | |
| API 类型生成 | openapi-typescript | 从 `docs/openapi.yaml` 生成 TS 类型 |

---

## 快速开始

### 前置依赖

- **Node.js** ≥ 20 LTS（推荐用 [nvm](https://github.com/nvm-sh/nvm) + `.nvmrc`）
- **pnpm** ≥ 9（`corepack enable && corepack prepare pnpm@9 --activate`）
- **Docker Desktop**（用于本地 PG + Redis）

### 一键启动（开发）

```bash
# 1. 安装依赖
pnpm install

# 2. 复制环境变量并填入真实值
cp .env.example .env

# 3. 初始化数据库（启动 PG 容器 + 跑 schema.sql + seed.sql）
pnpm db:init

# 4. 生成 API TS 类型（从 docs/openapi.yaml）
pnpm gen:api

# 5. 一键启动（docker-compose dev + backend + web + mobile）
pnpm dev
```

启动后访问：
- Backend: http://localhost:3000
- Swagger UI: http://localhost:3000/docs
- Web: http://localhost:3001
- Mobile (Expo): exp://localhost:8081

### 单独启动某个 app

```bash
pnpm dev:backend   # NestJS
pnpm dev:web       # Next.js（端口 3001）
pnpm dev:mobile    # Expo（按 i/a/w 选平台）
```

---

## 目录结构

```
MemeChatAI/
├── package.json                 # 根 package.json（pnpm workspaces）
├── pnpm-workspace.yaml          # workspaces 声明（apps/* + packages/*）
├── tsconfig.base.json           # TS 基础配置（strict + noUncheckedIndexedAccess）
├── tsconfig.json                # 根 TS 配置
├── .editorconfig / .gitignore / .npmrc / .nvmrc
├── .env.example                 # 环境变量模板（对齐 Tech 附录 A）
├── .prettierrc / .prettierignore
├── .eslintrc.cjs / .eslintignore
├── commitlint.config.cjs
├── husky/                       # pre-commit + commit-msg 钩子
├── .github/workflows/
│   ├── ci.yml                   # lint + typecheck + build（PR 触发）
│   └── deploy.yml               # 部署到轻量云（main 触发，占位）
├── docker-compose.yml           # 生产单机：PG + Redis + Backend + Worker
├── docker-compose.dev.yml       # 开发：仅 PG + Redis
├── Dockerfile.backend           # NestJS 多阶段构建
├── README.md
├── docs/                        # 已有文档（PRD / TechnicalDesign / M1 / DDL / OpenAPI / schema.sql / seed.sql）
├── packages/
│   └── shared/                  # @memestar/shared：types / api-client / constants / prompts
├── apps/
│   ├── backend/                 # @memestar/backend：NestJS 15 Module 骨架 + common + config + database + workers + ai-orch
│   ├── mobile/                  # @memestar/mobile：Expo Router 5 Tab 骨架
│   └── web/                     # @memestar/web：Next.js 14 App Router + admin 骨架
└── scripts/
    ├── dev.sh                   # 一键启动
    ├── gen-api-types.sh         # 从 openapi.yaml 生成 TS 类型
    └── db-init.sh               # 初始化 PG（建扩展 + 跑 schema.sql + seed.sql）
```

---

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 一键启动（PG + Redis + backend + web + mobile） |
| `pnpm dev:backend` / `dev:web` / `dev:mobile` | 单独启动某个 app |
| `pnpm build` | 构建所有 app（除 mobile） |
| `pnpm lint` | 全量 lint |
| `pnpm typecheck` | 全量类型检查 |
| `pnpm format` | Prettier 格式化 |
| `pnpm test` | 全量单测 |
| `pnpm db:init` | 初始化数据库（启动容器 + schema.sql + seed.sql） |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:migrate` | 跑 Drizzle 迁移 |
| `pnpm gen:api` | 从 `docs/openapi.yaml` 生成 `packages/shared/src/api-client/generated.ts` |
| `pnpm --filter @memestar/backend start:worker` | 启动 BullMQ Worker 进程 |

---

## 文档索引

- [PRD.md](./docs/PRD.md) v1.1.0 — 产品需求
- [TechnicalDesign.md](./docs/TechnicalDesign.md) v1.1.0 — 技术架构设计
- [M1-Sprint-Plan.md](./docs/M1-Sprint-Plan.md) v1.0.0 — M1 Sprint 计划
- [API-Spec.md](./docs/API-Spec.md) — API 规范说明
- [Database-DDL.md](./docs/Database-DDL.md) — 数据库 DDL 文档
- [openapi.yaml](./docs/openapi.yaml) — OpenAPI 契约
- [db/schema.sql](./docs/db/schema.sql) — PostgreSQL DDL（幂等）
- [db/seed.sql](./docs/db/seed.sql) — 种子数据

---

## 环境变量

完整模板见 [`.env.example`](./.env.example)，对齐 TechnicalDesign 附录 A。涵盖：

- 数据库（PG / pgvector）
- Redis
- JWT / Supabase
- AI Providers（DeepSeek / GLM / SiliconFlow / 通义 / 火山方舟 / 即梦 / 火山 TTS）
- Cloudflare R2
- 阿里云内容安全
- Sentry / PostHog / OneSignal
- 短信 / 微信支付
- AI 日预算熔断阈值
- 客户端 public 变量（Expo / Next.js）

> ⚠️ 切勿提交真实 `.env`。`.gitignore` 已忽略所有 `.env*`（保留 `.env.example`）。

---

## 贡献规范

### Commit 规范（commitlint + Conventional Commits）

```
<type>(<scope>): <subject>

feat(backend): add otp login
fix(meme): correct hot score decay
docs: update readme
refactor(ai-orch): extract policy engine
```

允许的 type：`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore` / `revert` / `wip`

### 分支策略

- `main` — 生产分支（合并触发 deploy）
- `develop` — 集成分支
- `feat/<task-id>-<short-desc>` — 功能分支
- `fix/<task-id>-<short-desc>` — 修复分支

### 钩子

- `pre-commit`：`lint-staged`（Prettier + ESLint 自动修复暂存区文件）
- `commit-msg`：`commitlint` 校验提交信息格式

---

## License

UNLICENSED · 内部使用
