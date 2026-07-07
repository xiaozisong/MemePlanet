# @memestar/backend

梗星球 MemeChatAI NestJS 模块化单体后端（15 个 Module 骨架）。

## 启动

```bash
pnpm --filter @memestar/backend dev
```

## 模块清单（对齐 TechnicalDesign §5.1）

| Module | 路径 | 关键职责 |
| --- | --- | --- |
| AuthModule | `modules/auth` | 登录、JWT、OAuth、RBAC |
| UserModule | `modules/user` | 资料、等级、梗力值、勋章 |
| MemeModule | `modules/meme` | 梗卡 CRUD、发布、feed |
| CreationModule | `modules/creation` | 造梗会话、候选、能量扣减 |
| VideoModule | `modules/video` | 异步任务、回调、字幕、TTS |
| RatingModule | `modules/rating` | 评分、评论、神/烂梗判定 |
| LegionModule | `modules/legion` | 军团 CRUD、成员、贡献度 |
| PKModule | `modules/pk` | PK 创建、匹配、投票、结算 |
| ChatModule | `modules/chat` | 私聊、群聊、@、通知 |
| RecommendModule | `modules/recommend` | 召回、排序、热度分 |
| AuditModule | `modules/audit` | 机审、人审队列、举报 |
| AdminModule | `modules/admin` | 审核、PK 运营、看板 |
| NotificationModule | `modules/notification` | 推送、站内信 |
| AnalyticsModule | `modules/analytics` | 事件上报、看板 |
| AIOrchModule | `modules/ai-orch` | LLM/图像/视频统一抽象 |

## 数据库

- ORM：Drizzle ORM
- 配置：`drizzle.config.ts`
- schema：`src/database/schema.ts`（引用 `docs/db/schema.sql` 的逻辑模型）
- 迁移：`drizzle/`

```bash
pnpm --filter @memestar/backend db:generate   # 生成迁移
pnpm --filter @memestar/backend db:migrate    # 跑迁移
pnpm --filter @memestar/backend db:studio     # Drizzle Studio
```

## Worker

BullMQ Worker 在 `src/workers/`，独立入口 `src/workers/main.ts`。

```bash
pnpm --filter @memestar/backend start:worker
```
