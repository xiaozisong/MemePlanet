# 「梗星球」MemeChatAI — REST API 接口契约文档

> 前后端共识的接口契约权威文档。所有字段命名严格对齐 [`db/schema.sql`](../db/schema.sql) v1.0.0（snake_case）。

---

## 1. 文档信息

| 项目 | 内容 |
| --- | --- |
| 文档名称 | REST API 接口契约文档 |
| 文档版本 | v1.0.0 |
| 作者 | 后端架构 / API 设计 |
| 创建日期 | 2026-07-07 |
| 关联文档 | [PRD.md](./PRD.md) v1.1.0、[TechnicalDesign.md](./TechnicalDesign.md) v1.1.0、[M1-Sprint-Plan.md](./M1-Sprint-Plan.md) v1.0.0、[db/schema.sql](../db/schema.sql) v1.0.0 |
| 机器可读契约 | [openapi.yaml](./openapi.yaml)（OpenAPI 3.1.0，可直接导入 Swagger UI / Apifox / Postman） |
| 适用范围 | RN App（iOS/Android）+ Next.js Web + Next.js Admin |
| 后端实现 | NestJS 模块化单体（15 个 Module） |
| 当前状态 | 评审中 |

### 1.1 版本与里程碑约定

- **M1 P0**：M1 Sprint（2026-07-08 ~ 2026-08-04）必须实现的接口，对应 PRD §11.1 P0 + M1-Sprint-Plan §2.1 砍后范围。
- **M2 P0**：M2 Sprint 必须实现的接口（军团/PK/IM/视频/Agent/支付/后台等）。
- **v1.5+**：M3 之后版本，本文档列出但仅给接口签名不给完整 schema。
- 标注方式：每个接口在表格列 `版本` 标 `M1` / `M2` / `v1.5+`，OpenAPI 中用扩展字段 `x-memestar-version` 标注。

---

## 2. 全局约定

### 2.1 Base URL

| 环境 | Base URL | 用途 |
| --- | --- | --- |
| dev | `https://api.dev.memestar.cn/api/v1` | 本地开发联调 |
| staging | `https://api.staging.memestar.cn/api/v1` | 灰度前联调 + 邀请制灰度 |
| prod | `https://api.memestar.cn/api/v1` | 生产（ICP 备案后启用） |

- 所有路径本文档中以 `/api/v1` 前缀写出，OpenAPI `servers` 已含此前缀。
- 内部 Webhook 回调路径前缀为 `/api/internal/webhooks`（不走统一响应包装）。

### 2.2 认证方式

- **JWT Bearer Token**：除 `/auth/sms/send`、`/auth/sms/login`、`/auth/refresh`、`/auth/oauth/*`、`/webhooks/*`、`GET /health`、`GET /memes/feed`（游客可读）外，所有接口必须带 Header：

  ```
  Authorization: Bearer <access_token>
  ```

- **Token 类型**：
  - `access_token`：有效期 2h，Supabase Auth 签发或自签 JWT（HS256，claim 含 `user_id`、`is_pro`、`status`、`roles`）。
  - `refresh_token`：有效期 30d，仅用于 `POST /auth/refresh`。
- **多端共存**：同一用户最多 5 个有效 refresh_token（旧挤新策略）。
- **退出**：`POST /auth/logout` 撤销当前 refresh_token；管理员可强制吊销 access_token（Redis 黑名单，TTL = access 剩余有效期）。

### 2.3 统一响应结构

所有业务接口（非 Webhook）统一返回：

```json
{
  "code": 0,
  "data": { },
  "message": "ok",
  "request_id": "01HQK8X9J2RT7N1V4Y6Z3B5M6P"
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| code | int | `0` = 成功；非 0 = 业务错误码（见 §2.5） |
| data | object/array/null | 业务数据；错误时为 `null` |
| message | string | 人类可读说明，错误时为错误描述 |
| request_id | string | 32 位 ULID，用于链路追踪，回填到 Sentry/日志 |

HTTP 状态码与 `code` 的关系：

| HTTP | 含义 | code 范围 |
| --- | --- | --- |
| 200 | 成功（同步） | 0 |
| 202 | 已接受（异步任务） | 0 |
| 204 | 成功无返回体 | 0 |
| 400 | 参数错误 | 4xxx |
| 401 | 未认证 / token 失效 | 1xxx |
| 403 | 无权限 | 1xxx |
| 404 | 资源不存在 | 4xxx |
| 409 | 状态冲突 | 4xxx |
| 429 | 限流 | 9xxx |
| 5xx | 服务端错误 | 9xxx |

### 2.4 分页结构

```json
{
  "list": [ ],
  "total": 1234,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

统一 query 参数：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| page | int | 1 | 页码，从 1 起 |
| page_size | int | 20 | 每页条数，max 50 |
| sort | string | - | 排序字段，多字段逗号分隔，前缀 `-` = DESC，如 `-hot_score,created_at` |
| order | string | desc | 兼容旧客户端：asc/desc，与 sort 同时存在时 sort 优先 |
| filter | string | - | 过滤表达式，格式 `field:op:value`，多条件逗号分隔，如 `type:eq:image,legion_id:eq:abc` |
| cursor | string | - | 游标分页（推荐 feed 用），与 page 互斥；格式 base64(`created_at:last_id`) |

### 2.5 错误码总表

业务错误码区间划分：

| 区间 | 模块 | 示例 |
| --- | --- | --- |
| 1xxx | 认证 / 授权 | 1001 token 无效、1002 token 过期、1003 无权限、1010 短信发送频繁 |
| 2xxx | 用户 | 2001 用户不存在、2002 昵称违规、2003 军团已达上限、2010 兴趣标签数不足 |
| 3xxx | 内容（梗卡 / 视频） | 3001 梗卡不存在、3002 梗卡状态非法、3003 审核未通过、3101 视频生成失败、3102 视频配额耗尽 |
| 4xxx | 互动（评分 / 评论 / 转发） | 4001 已评分过、4002 评分超阈值、4003 评论敏感词命中、4004 评论楼层过深 |
| 5xxx | 军团 / PK | 5001 军团名重复、5002 军团已解散、5003 已加入军团上限、5101 PK 状态非法、5102 PK 投票次数耗尽 |
| 6xxx | AI / 创作 | 6001 能量不足、6002 prompt 命中黑名单、6003 AI 模型熔断、6004 Agent 配额耗尽、6005 prompt 24h 重复 |
| 7xxx | 商业化 | 7001 订单不存在、7002 支付失败、7003 Pro 已订阅、7004 视频按次包已用尽 |
| 9xxx | 系统 | 9001 内部错误、9002 依赖服务不可用、9003 限流、9004 参数校验失败 |

完整错误码列表见 `openapi.yaml` 的 `components/responses` 与各接口 `responses` 段。

### 2.6 限流

- **响应 Header**：

  ```
  X-RateLimit-Limit: 60
  X-RateLimit-Remaining: 59
  X-RateLimit-Reset: 1720351200
  Retry-After: 30           # 仅 429 时返回，单位秒
  ```

- **限流策略**（按 user_id 限流，未登录按 IP）：

| 接口 | 限制 | 错误码 |
| --- | --- | --- |
| `POST /auth/sms/send` | 1 次/60s/手机号，10 次/日/手机号 | 1010 |
| `POST /auth/sms/login` | 5 次/15min/IP | 1011 |
| `POST /creations/single` | 60 次/h/用户 | 9003 |
| `POST /creations/agent` | 10 次/日/Pro 用户（硬配额） | 6004 |
| `POST /videos` | 免费用户 1 次/周，Pro 3 次/日 | 3102 |
| `POST /memes` | 30 次/h/用户 | 9003 |
| `POST /memes/{id}/ratings` | 60 次/min/用户 | 9003 |
| `POST /memes/{id}/comments` | 30 次/min/用户 | 9003 |
| `POST /pk/matches/{id}/vote` | 3 票/日/PK/用户 | 5102 |
| `POST /chat/rooms/{id}/messages` | 新成员 3 条/min，老成员 30 条/min | 9003 |

### 2.7 幂等性

- 所有写操作（POST/PATCH/PUT/DELETE）支持 Header `Idempotency-Key: <uuid>`：
  - 服务端缓存 `(user_id, idempotency_key, method, path)` 24h，命中直接返回首次响应。
  - 重复请求相同 key 但 body 不同，返回 `400` + `code=9004`。
- 强烈建议 `POST /creations/*`、`POST /videos`、`POST /memes`、`POST /orders/*`、`POST /pro/subscriptions` 必带。

### 2.8 时间与 ID 格式

- 时间：ISO 8601 UTC，如 `2026-07-07T16:39:00Z`；服务端存 `timestamptz`，客户端按需转本地时区。
- ID：所有主键 `uuid` v4，字符串形式传输（如 `"01HQK8X9J2RT7N1V4Y6Z3B5M6P"` 不强制，PG 默认 gen_random_uuid 输出标准 36 位 uuid 字符串）。
- 金额：`int` 单位分（schema.sql 中 `price_cents` / `amount_cents` / `cost_cents`），避免浮点误差。

### 2.9 AI 异步任务流模式（统一）

所有"耗时 AI 生成"接口遵循 **提交-轮询/WebSocket** 模式：

1. **提交**：`POST /xxx` → HTTP `202 Accepted` + body：

   ```json
   {
     "code": 0,
     "data": { "job_id": "uuid", "creation_id": "uuid", "status": "queued" },
     "message": "accepted"
   }
   ```

2. **状态机**（统一字段 `status`）：

   ```
   queued → running → succeeded
            running → failed
            running → timeout
            failed/timeout → fallback_used（Agent/视频自动降级为单次 prompt / 图片+TTS 兜底）
   ```

3. **轮询**：`GET /agent-jobs/{id}` 或 `GET /videos/{id}/status`，建议客户端每 2s 轮询一次，最长 30s（Agent） / 3min（视频）后切 WebSocket 推送。

4. **WebSocket 推送**（可选，M2 启用）：见 §6。

5. **超时降级**：
   - Agent 任一步超时/失败 → 自动降级为单次 prompt 模式，`fallback_used=true`，退回 Agent 能量。
   - 视频额度紧张/熔断 → 降级为图片+TTS+Ken Burns 兜底，`is_fallback=true`。

6. **回调（视频生成）**：provider 支持 Webhook 时走 `POST /api/internal/webhooks/video/{job_id}`，HMAC-SHA256 签名校验（见 §7.1）。

---

## 3. 接口分组详设（按 NestJS Module）

> 每组表格列出接口签名；M1 P0 接口在 §4 给完整定义。

### 3.1 AuthModule — 认证

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/sms/send` | 发送手机号验证码 | 否 | M1 | 60s/手机号限频 |
| POST | `/auth/sms/login` | 手机号验证码登录（含注册） | 否 | M1 | 返回 access+refresh |
| POST | `/auth/refresh` | 刷新 access_token | refresh_token | M1 | 旧 refresh 即时失效 |
| POST | `/auth/logout` | 退出登录 | 是 | M1 | 撤销 refresh_token |
| GET | `/auth/oauth/{provider}/authorize` | OAuth 授权跳转（wechat/apple） | 否 | M2 | 重定向到 OAuth 提供方 |
| GET | `/auth/oauth/{provider}/callback` | OAuth 回调 | 否 | M2 | 换 JWT 并 302 回 App |
| GET | `/auth/me` | 当前登录态校验 | 是 | M1 | 返回 user 摘要 + token 过期时间 |

### 3.2 UserModule — 用户

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| GET | `/users/me` | 我的资料 | 是 | M1 | 含 level/meme_power/energy_balance |
| PATCH | `/users/me` | 编辑资料 | 是 | M1 | 昵称 30 天改 1 次 |
| GET | `/users/{id}` | 用户主页 | 是 | M1 | 含作品/神梗/军团摘要 |
| GET | `/users/me/interest-tags` | 我的兴趣标签 | 是 | M1 | |
| PUT | `/users/me/interest-tags` | 修改兴趣标签 | 是 | M1 | 3~5 个 |
| GET | `/users/me/level` | 梗力值/等级/能量详情 | 是 | M1 | 含下一等级进度 |
| GET | `/users/me/badges` | 我的勋章 | 是 | M2 | M1 仅返回字段 |
| GET | `/users/{id}/memes` | 用户作品列表 | 是 | M1 | 分页 |
| GET | `/users/{id}/god-memes` | 用户神梗合集 | 是 | M2 | |
| POST | `/users/{id}/follow` | 关注用户 | 是 | M2 | |
| DELETE | `/users/{id}/follow` | 取关 | 是 | M2 | |
| GET | `/users/{id}/followers` | 粉丝列表 | 是 | M2 | |
| GET | `/users/{id}/following` | 关注列表 | 是 | M2 | |
| GET | `/users/{id}/stats` | 创作者数据看板 | 是 | v1.5+ | 曝光/评分/转发趋势 |

### 3.3 CreationModule — 造梗工坊

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/creations/single` | 单次 prompt 造梗（文本/图片） | 是 | M1 | 同步返回 3 候选/1 候选 |
| POST | `/creations/agent` | Pro Agent 造梗（异步） | 是 + Pro | M2 | 202 + job_id |
| GET | `/agent-jobs/{id}` | Agent 任务状态查询 | 是 | M2 | 轮询 |
| GET | `/agent-jobs` | 我的 Agent 任务列表 | 是 | M2 | 分页 |
| GET | `/creations/{id}` | 造梗会话详情（候选/选中） | 是 | M1 | |
| PATCH | `/creations/{id}` | 选择候选 / 微调 | 是 | M1 | chosen_candidate |
| GET | `/prompt-templates` | Prompt 模板库 | 是 | M1 | mode/style 过滤 |
| GET | `/prompt-templates/{id}` | 模板详情 | 是 | M1 | |
| POST | `/prompt-templates` | UGC 上传模板 | 是 | v1.5+ | |
| POST | `/creations/{id}/regenerate` | 再来一次 | 是 | M1 | 限频 |

### 3.4 VideoModule — 视频生成

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/videos` | 视频生成提交（异步） | 是 | M2 | 202 + job_id |
| GET | `/videos/{id}/status` | 视频生成状态查询 | 是 | M2 | 轮询 |
| GET | `/videos/{id}` | 视频详情 | 是 | M2 | |
| PATCH | `/videos/{id}/subtitle` | 字幕编辑 | 是 | M2 | |
| GET | `/videos/voices` | TTS 音色列表 | 是 | M2 | 4 种音色 |
| POST | `/webhooks/video/{job_id}` | 视频生成 Webhook 回调 | HMAC | M2 | 见 §7.1 |
| GET | `/videos/quota` | 我的视频配额 | 是 | M2 | 免费/Pro/按次包余额 |
| POST | `/videos/image-to-video` | 图生视频 | 是 | v1.5+ | |

### 3.5 MemeModule — 梗卡

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/memes` | 发布梗卡 | 是 | M1 | 关联 creation_id |
| GET | `/memes/{id}` | 梗卡详情 | 可选 | M1 | 游客可读 |
| GET | `/memes/feed` | 推荐 feed | 可选 | M1 | 热度召回 v1 |
| GET | `/memes/hot` | 热门榜 | 可选 | M1 | 按 hot_score |
| GET | `/memes/god` | 神梗榜 | 可选 | M1 | god_trash_status=god |
| GET | `/memes/trash` | 烂梗博物馆 | 可选 | v1.5+ | |
| DELETE | `/memes/{id}` | 删除梗卡（作者/管理员） | 是 | M1 | 软删除 |
| PATCH | `/memes/{id}` | 编辑梗卡（标题/标签） | 是 | M1 | 已发布仅 24h 内可改 |
| POST | `/memes/{id}/report` | 举报梗卡 | 是 | M1 | |
| POST | `/memes/{id}/share` | 转发计数 | 是 | M1 | channel: in_app/wechat/douyin/qq/link |
| POST | `/memes/{id}/favorite` | 收藏 | 是 | M1 | |
| DELETE | `/memes/{id}/favorite` | 取消收藏 | 是 | M1 | |
| GET | `/memes/related` | 相关梗卡 | 可选 | M2 | pgvector 召回 |
| GET | `/memes/search` | 搜索 | 可选 | M1 | tsvector 全文 |

### 3.6 RatingModule — 评分与评论

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/memes/{id}/ratings` | 评分（1-5 星） | 是 | M1 | 24h 可改分 |
| GET | `/memes/{id}/ratings` | 评分列表 | 可选 | M1 | 分页 |
| GET | `/memes/{id}/rating-summary` | 评分汇总（含我的评分） | 可选 | M1 | score_avg/score_count |
| POST | `/memes/{id}/comments` | 评论 / 回复 | 是 | M1 | parent_id 楼中楼 |
| GET | `/memes/{id}/comments` | 评论列表 | 可选 | M1 | 分页，按 like_count+created_at |
| POST | `/comments/{id}/like` | 评论点赞 | 是 | M2 | |
| DELETE | `/comments/{id}/like` | 取消评论点赞 | 是 | M2 | |
| DELETE | `/comments/{id}` | 删除评论 | 是 | M2 | 作者/管理员 |
| GET | `/memes/{id}/god-comments` | 神评列表 | 可选 | v1.5+ | |
| GET | `/reviewers` | 评审官列表 | 可选 | M2 | |
| GET | `/memes/{id}/god-trash` | 神/烂梗判定结果 | 可选 | M2 | god_trash_status + judgment 记录 |

### 3.7 LegionModule — 军团

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/legions` | 创建军团 | 是 + Lv.3 | M2 | 名称唯一 |
| GET | `/legions` | 军团广场列表 | 是 | M2 | 分页 + theme_tags 过滤 |
| GET | `/legions/{id}` | 军团详情 | 是 | M2 | 含成员榜/PK 战绩 |
| PATCH | `/legions/{id}` | 编辑军团 | 是 + leader | M2 | |
| POST | `/legions/{id}/join` | 加入军团 | 是 | M2 | public/approval |
| DELETE | `/legions/{id}/join` | 退出军团 | 是 | M2 | 队长不可直接退 |
| GET | `/legions/{id}/members` | 成员列表 | 是 | M2 | 分页，按 contribution |
| PATCH | `/legions/{id}/members/{user_id}` | 成员管理（副队/踢人） | 是 + leader | M2 | |
| GET | `/legions/{id}/memes` | 军团梗卡墙 | 是 | M2 | |
| GET | `/legions/rank` | 军团排行榜 | 可选 | M2 | activity_score |
| GET | `/legions/me` | 我的军团 | 是 | M2 | ≤3 个 |
| POST | `/legions/{id}/dissolve` | 解散军团 | 是 + leader | v1.5+ | 7 天公示 |

### 3.8 PKModule — PK 大战

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| GET | `/pk/matches` | PK 大厅列表 | 可选 | M2 | status filter |
| POST | `/pk/matches` | 创建 PK（约战/官方） | 是 + leader/运营 | M2 | type: creation/vote/hotness |
| GET | `/pk/matches/{id}` | PK 详情（含实时比分） | 可选 | M2 | |
| POST | `/pk/matches/{id}/vote` | 投票 | 是 | M2 | 3 票/日/PK |
| POST | `/pk/matches/{id}/submissions` | 造梗对决提交梗卡 | 是 + 成员 | M2 | ≤20 张 |
| GET | `/pk/matches/{id}/submissions` | 双方提交列表 | 可选 | M2 | |
| GET | `/pk/matches/{id}/battle-report` | 战报 | 可选 | M2 | settled 后 |
| GET | `/pk/matches/{id}/rewards` | 我的 PK 奖励 | 是 | M2 | |
| POST | `/pk/matches/{id}/forfeit` | 弃权 | 是 + leader | v1.5+ | |
| GET | `/pk/seasons` | 赛季/锦标赛 | 可选 | v2.0+ | |

### 3.9 ChatModule — 聊天

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| GET | `/chat/rooms` | 我的会话列表 | 是 | M2 | 私聊+军团群+系统 |
| GET | `/chat/rooms/{id}/messages` | 消息列表 | 是 | M2 | 游标分页 |
| POST | `/chat/rooms/{id}/messages` | 发送消息 | 是 | M2 | msg_type: text/image/meme/voice |
| DELETE | `/chat/messages/{id}` | 撤回消息 | 是 | M2 | 2min 内 |
| POST | `/chat/rooms/{id}/read` | 标记已读 | 是 | M2 | last_read_msg_id |
| GET | `/chat/rooms/{id}/members` | 群成员（军团群） | 是 | M2 | |
| POST | `/chat/dm/{user_id}` | 发起私聊 | 是 | M2 | 返回 room_id |
| GET | `/chat/mentions` | @ 我的消息 | 是 | M2 | |

### 3.10 RecommendModule — 推荐

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| GET | `/recommend/feed` | 个性化 feed | 可选 | M1 | 热度召回 v1，20/页 |
| GET | `/recommend/hot` | 热门推荐 | 可选 | M1 | |
| GET | `/recommend/personalized` | 强个性化 | 是 | M2 | 双塔召回 |
| GET | `/recommend/related/{meme_id}` | 相关梗卡 | 可选 | M2 | pgvector |
| GET | `/recommend/cold-start` | 冷启动 feed | 否 | M1 | 兴趣标签未选时 |

### 3.11 NotificationModule — 通知

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| GET | `/notifications` | 通知列表 | 是 | M1 | type filter |
| POST | `/notifications/read` | 批量已读 | 是 | M1 | notif_ids[] |
| GET | `/notifications/unread-count` | 未读数 | 是 | M1 | |
| GET | `/notifications/push-settings` | 推送偏好 | 是 | M2 | |
| PUT | `/notifications/push-settings` | 编辑推送偏好 | 是 | M2 | |
| POST | `/notifications/device-token` | 注册设备 token | 是 | M2 | OneSignal |

### 3.12 Pro / Order — 商业化

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| GET | `/pro/plans` | Pro 套餐列表 | 否 | M2 | monthly ¥18 / yearly |
| POST | `/pro/subscriptions` | 订阅 Pro | 是 | M2 | 创建订单 + 拉起支付 |
| GET | `/pro/me` | 我的 Pro 权益 | 是 | M2 | 含到期/视频配额/Agent 配额 |
| POST | `/pro/cancel` | 取消自动续费 | 是 | M2 | |
| GET | `/video-packages` | 视频按次包 SKU | 否 | M2 | pkg_10 ¥9.9 / pkg_50 ¥29.9 |
| POST | `/video-packages` | 购买按次包 | 是 | M2 | |
| GET | `/orders` | 我的订单 | 是 | M2 | 分页 |
| GET | `/orders/{id}` | 订单详情 | 是 | M2 | |
| POST | `/orders/wx-pay/callback` | 微信支付回调 | HMAC | M2 | 见 §7.2 |
| GET | `/orders/wx-pay/status/{order_id}` | 主动查支付结果 | 是 | M2 | 兜底（防丢回调） |
| POST | `/orders/refund` | 申请退款 | 是 | v1.5+ | |

### 3.13 AdminModule — 运营后台

> M1 仅 Admin shell 登录页 + 用户管理 v0；详细审核/PK/看板 M2。

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/admin/auth/login` | 管理员登录 | 否 | M1 | 用户名密码 + 2FA |
| GET | `/admin/audit/queue` | 审核队列 | 是 + admin | M2 | target_type filter |
| PATCH | `/admin/audit/{audit_id}` | 审核动作 | 是 + admin | M2 | pass/reject/hide/delete |
| GET | `/admin/users` | 用户列表 | 是 + admin | M1 | 分页 + 搜索 |
| POST | `/admin/users/{id}/ban` | 封禁用户 | 是 + admin | M1 | ban_until |
| DELETE | `/admin/users/{id}/ban` | 解禁 | 是 + admin | M1 | |
| POST | `/admin/pk/matches` | 官方 PK 创建 | 是 + 运营 | M2 | is_official=true |
| GET | `/admin/dashboard/overview` | 数据看板 | 是 + admin | M2 | DAU/造梗率/留存 |
| GET | `/admin/dashboard/ai-cost` | AI 成本看板 | 是 + admin | M2 | 日/月成本 |

### 3.14 AIOrchModule — AI 编排（内部 + 管理员）

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| GET | `/admin/ai/health` | 各 provider 健康状态 | 是 + admin | M2 | deepseek/glm/siliconflow/... |
| GET | `/admin/ai/cost` | AI 成本看板（按模块/provider） | 是 + admin | M2 | ai_cost_logs 聚合 |
| POST | `/admin/ai/circuit-breaker/{provider}` | 手动熔断 | 是 + admin | M2 | |
| GET | `/admin/ai/prompts` | Prompt 模板管理 | 是 + admin | M2 | 含 UGC 审核 |
| PATCH | `/admin/sensitive-words` | 敏感词热更新 | 是 + admin | M1 | DFA 库 |

### 3.15 AnalyticsModule — 埋点

| Method | Path | Summary | 鉴权 | 版本 | 备注 |
| --- | --- | --- | --- | --- | --- |
| POST | `/analytics/event` | 客户端埋点上报 | 是 | M1 | 关键事件双写 PostHog + 自建 |
| POST | `/analytics/batch` | 批量上报 | 是 | M1 | 弱网缓存重传 |
| GET | `/admin/analytics/funnel` | 漏斗分析 | 是 + admin | M2 | |

### 3.16 公共

| Method | Path | Summary | 鉴权 | 版本 |
| --- | --- | --- | --- | --- |
| GET | `/health` | 健康检查 | 否 | M1 |
| GET | `/version` | 版本信息 | 否 | M1 |
| POST | `/uploads/sign` | R2 上传签名（直传） | 是 | M2 |

---

## 4. 重点接口详设（M1 P0 + M2 关键）

> 本节给出 M1 P0 必须实现的接口完整 OpenAPI 风格定义。M2 标的接口同步在 `openapi.yaml` 中给完整 schema。

### 4.1 POST /auth/sms/send — 发送手机号验证码

| 项 | 值 |
| --- | --- |
| Tags | Auth |
| Summary | 发送手机号验证码 |
| Description | 向指定手机号发送 6 位数字验证码，60s 内不可重发。验证码存 Redis（key=`otp:{phone}`，TTL=5min），登录时校验。 |
| 鉴权 | 否 |
| 版本 | M1 |
| 限流 | 1/60s/手机号；10/日/手机号；5/15min/IP |
| 幂等 | 支持（相同 Idempotency-Key+phone 60s 内复用） |

**请求体** `SmsSendRequest`：

```json
{ "phone": "+8613800000000", "scene": "login" }
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| phone | string | 是 | E.164 格式，含国家码 |
| scene | string | 否 | login / bind / reset，默认 login |

**成功响应** `200` `ApiResponse<SmsSendResponse>`：

```json
{
  "code": 0,
  "data": { "sent": true, "expire_in": 300, "next_send_in": 60 },
  "message": "ok",
  "request_id": "..."
}
```

**主要错误码**：

| HTTP | code | 说明 |
| --- | --- | --- |
| 400 | 9004 | phone 格式错误 |
| 429 | 1010 | 同手机号 60s 内已发送 |
| 429 | 1012 | 同手机号当日已达上限 |
| 429 | 9003 | IP 限流 |

**curl 示例**：

```bash
curl -X POST https://api.dev.memestar.cn/api/v1/auth/sms/send \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: 9b1f2c4e-8a7d-4f3b-9c2e-1a5b6c7d8e9f" \
  -d '{"phone":"+8613800000000","scene":"login"}'
```

### 4.2 POST /auth/sms/login — 手机号验证码登录

| 项 | 值 |
| --- | --- |
| Summary | 手机号验证码登录（新用户自动注册） |
| 鉴权 | 否 |
| 版本 | M1 |
| 限流 | 5/15min/IP |

**请求体** `SmsLoginRequest`：

```json
{ "phone": "+8613800000000", "code": "123456", "device_id": "canvas-hash-xxx" }
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| phone | string | 是 | E.164 |
| code | string | 是 | 6 位数字 |
| device_id | string | 否 | 设备指纹，用于风控 |

**成功响应** `200` `ApiResponse<AuthToken>`：

```json
{
  "code": 0,
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "uuid-...",
    "expires_in": 7200,
    "token_type": "Bearer",
    "user": {
      "user_id": "01HQK...",
      "nickname": "整活新秀_88",
      "avatar_url": null,
      "level": 1,
      "meme_power": 0,
      "is_pro": false,
      "is_new_user": true,
      "need_interest_tags": true
    }
  },
  "message": "ok"
}
```

**主要错误码**：

| HTTP | code | 说明 |
| --- | --- | --- |
| 400 | 1013 | 验证码错误 |
| 400 | 1014 | 验证码已过期 |
| 403 | 2004 | 用户已被封禁（status=banned） |
| 429 | 1011 | IP 限流 |

### 4.3 POST /auth/refresh — 刷新 token

**请求体** `RefreshRequest`：

```json
{ "refresh_token": "uuid-..." }
```

**响应** `200` `ApiResponse<AuthToken>`（同登录，`is_new_user=false`）。

**错误**：401 / `code=1002`（refresh 过期或已撤销）。

### 4.4 POST /auth/logout

**鉴权**：是（撤销当前 refresh_token + 将 access_token 加入 Redis 黑名单）。

**请求体**：

```json
{ "refresh_token": "uuid-..." }
```

**响应**：`204 No Content`。

### 4.5 GET /users/me — 我的资料

**鉴权**：是。**响应** `200` `ApiResponse<UserProfile>`：

```json
{
  "code": 0,
  "data": {
    "user_id": "01HQK...",
    "nickname": "整活新秀_88",
    "avatar_url": "https://cdn.memestar.cn/avatars/xxx.png",
    "gender": "unknown",
    "bio": "脑洞很大，钱包很小",
    "level": 5,
    "meme_power": 320,
    "defense_value": 12,
    "energy_balance": 80,
    "legion_count": 1,
    "is_pro": true,
    "interest_tags": ["抽象", "谐音梗", "反转"],
    "badges": ["first_god_meme", "7day_streak"],
    "status": "active",
    "last_login_at": "2026-07-07T08:00:00Z",
    "created_at": "2026-06-01T03:20:00Z"
  }
}
```

字段严格对齐 `users` + `user_profiles` 表。

### 4.6 PATCH /users/me — 编辑资料

**请求体** `UpdateUserRequest`（部分字段可选）：

```json
{
  "nickname": "新昵称",
  "avatar_url": "https://...",
  "gender": "male",
  "bio": "新签名",
  "birthday": "2000-01-01"
}
```

- 昵称修改受 `user_profiles.nickname_changed_at` 控制，30 天 1 次，违反返回 `code=2002`。
- 昵称走敏感词 DFA + 阿里云审核，命中返回 `code=4003`。

**响应**：`200` `ApiResponse<UserProfile>`（更新后）。

### 4.7 GET /users/{id} — 用户主页

**Path**：`id` = uuid。**Query**：无。**响应** `200` `ApiResponse<UserHome>`：

```json
{
  "code": 0,
  "data": {
    "user_id": "...",
    "nickname": "...",
    "avatar_url": "...",
    "bio": "...",
    "level": 5,
    "meme_power": 320,
    "defense_value": 12,
    "is_pro": true,
    "is_following": false,
    "legion_ids": ["legion-uuid-1"],
    "stats": {
      "meme_count": 23,
      "god_meme_count": 2,
      "avg_score": 4.1,
      "pk_wins": 3
    },
    "badges": ["first_god_meme"]
  }
}
```

**错误**：404 / `code=2001`。

### 4.8 POST /creations/single — 单次 prompt 造梗

| 项 | 值 |
| --- | --- |
| Summary | 单次 prompt 造梗（文本/图片） |
| 鉴权 | 是 |
| 版本 | M1（文本）/ M1 砍后延 M2（图片，详见 M1-Sprint-Plan §7.3） |
| 限流 | 60/h/用户 |
| 超时 | 35s |
| 能量扣减 | 文本 1，图片 5 |

**请求体** `CreationSingleRequest`：

```json
{
  "mode": "text",
  "prompt": "如果古代人有微信",
  "style": "abstract",
  "template_id": "uuid-template-1",
  "regenerate_from": null
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| mode | string | 是 | text / image（script v1.5+） |
| prompt | string | 是 | 1~500 字，命中黑名单返回 6002 |
| style | string | 否 | abstract/yin_yang/pun/twist/meme_caption（text）；realistic/anime/expression_pack/oil_paint（image） |
| template_id | string(uuid) | 否 | 关联 prompt_templates |
| regenerate_from | string(uuid) | 否 | 基于 creation_id 重新生成（再来一次） |

**成功响应** `200` `ApiResponse<CreationResult>`（同步）：

```json
{
  "code": 0,
  "data": {
    "creation_id": "uuid-creation-1",
    "status": "ready",
    "mode": "text",
    "candidates": [
      {
        "candidate_id": "uuid-c0",
        "idx": 0,
        "content": "李白发朋友圈：今晚月色真美。杜甫评论：你这是要修仙啊？",
        "image_url": null,
        "self_score": null
      },
      { "candidate_id": "uuid-c1", "idx": 1, "content": "...", "image_url": null, "self_score": null },
      { "candidate_id": "uuid-c2", "idx": 2, "content": "...", "image_url": null, "self_score": null }
    ],
    "energy_cost": 1,
    "model_version": "deepseek-v3",
    "cached": false
  }
}
```

图片 mode 时 `candidates` 仅 1 条且 `image_url` 非空。

**主要错误码**：

| HTTP | code | 说明 |
| --- | --- | --- |
| 400 | 6005 | 24h 内同 prompt+style 已生成过（去重命中，返回原 creation_id） |
| 402 | 6001 | 能量不足（Payment Required 语义，本文档统一用 400 + code） |
| 429 | 6003 | AI 模型熔断，请稍后再试 |
| 429 | 9003 | 接口限流 |

### 4.9 POST /creations/agent — Pro Agent 造梗（异步）

| 项 | 值 |
| --- | --- |
| Summary | Pro 造梗 Agent 提交（3 步精简版：RAG→3 候选→自评） |
| 鉴权 | 是 + Pro |
| 版本 | M2 |
| 限流 | 10/日/Pro 用户（硬配额）+ 日预算 ¥80 熔断 |
| 模式 | 异步提交-轮询/WS |

**请求体** `AgentSubmitRequest`：

```json
{
  "mode": "text",
  "prompt": "如果社畜有超能力",
  "style": "abstract",
  "template_id": null
}
```

**成功响应** `202 Accepted` `ApiResponse<AgentJobAck>`：

```json
{
  "code": 0,
  "data": {
    "job_id": "uuid-job-1",
    "creation_id": "uuid-creation-2",
    "status": "queued",
    "poll_url": "/api/v1/agent-jobs/uuid-job-1",
    "estimated_seconds": 25
  },
  "message": "accepted"
}
```

**错误**：

| HTTP | code | 说明 |
| --- | --- | --- |
| 403 | 1003 | 非 Pro 用户不可使用 Agent |
| 429 | 6004 | Agent 日配额耗尽 |
| 429 | 6003 | 日预算熔断，自动降级，建议改用 /creations/single |

### 4.10 GET /agent-jobs/{id} — Agent 任务状态查询

**鉴权**：是（仅任务 owner）。**响应** `200` `ApiResponse<AgentJob>`：

```json
{
  "code": 0,
  "data": {
    "job_id": "uuid-job-1",
    "creation_id": "uuid-creation-2",
    "status": "succeeded",
    "steps_total": 3,
    "steps_done": 3,
    "fallback_used": false,
    "cost_estimate": 0.07,
    "started_at": "2026-07-07T08:00:00Z",
    "finished_at": "2026-07-07T08:00:25Z",
    "candidates": [
      { "candidate_id": "uuid-c0", "idx": 0, "content": "...", "self_score": 8.5, "self_reason": "反转强、有共鸣" },
      { "candidate_id": "uuid-c1", "idx": 1, "content": "...", "self_score": 7.2, "self_reason": "..." },
      { "candidate_id": "uuid-c2", "idx": 2, "content": "...", "self_score": 6.8, "self_reason": "..." }
    ],
    "chosen_idx": 0,
    "error": null
  }
}
```

`status` 状态机：`queued` / `running` / `succeeded` / `failed` / `timeout`（含 `fallback_used=true` 时降级已触发，`candidates` 来自单次 prompt 兜底）。

### 4.11 GET /prompt-templates — Prompt 模板库

**Query**：`mode`、`style`、`is_official=true`、`page`、`page_size`。

**响应** `200` `ApiResponse<Paged<PromptTemplate>>`：

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "template_id": "uuid-tpl-1",
        "mode": "text",
        "name": "抽象段子模板",
        "style": "abstract",
        "is_official": true,
        "use_count": 1234,
        "variables": ["keyword", "style"],
        "example_output": { "content": "..." }
      }
    ],
    "total": 5, "page": 1, "page_size": 20, "has_more": false
  }
}
```

### 4.12 POST /videos — 视频生成提交（异步）

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 |
| 版本 | M2 |
| 限流 | 免费 1/周（需任务解锁）/ Pro 3/日 |
| 模式 | 异步提交-轮询/Webhook |

**请求体** `VideoSubmitRequest`：

```json
{
  "creation_id": "uuid-creation-3",
  "source_type": "text_to_video",
  "duration": 5,
  "voice_id": "funny",
  "subtitle_text": "可选字幕"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| creation_id | string(uuid) | 否 | 关联造梗会话；source_type=text_to_video 时必填 |
| source_type | string | 是 | text_to_video / image_to_video / fallback_image_tts |
| duration | int | 是 | 5 / 10 / 15（Pro 高端可 10/15） |
| voice_id | string | 否 | funny/northeast/queen/robot |
| subtitle_text | string | 否 | 字幕文本，留空自动生成 |

**成功响应** `202` `ApiResponse<VideoJobAck>`：

```json
{
  "code": 0,
  "data": {
    "job_id": "uuid-vjob-1",
    "video_id": "uuid-video-1",
    "status": "queued",
    "poll_url": "/api/v1/videos/uuid-video-1/status",
    "is_fallback": false,
    "estimated_seconds": 90
  }
}
```

**错误**：

| HTTP | code | 说明 |
| --- | --- | --- |
| 402 | 6001 | 能量不足 |
| 429 | 3102 | 视频配额耗尽 |
| 429 | 6003 | 日预算熔断，已自动转兜底 |

### 4.13 GET /videos/{id}/status — 视频生成状态查询

**鉴权**：是。**响应** `200` `ApiResponse<VideoStatus>`：

```json
{
  "code": 0,
  "data": {
    "video_id": "uuid-video-1",
    "status": "published",
    "progress": 100,
    "is_fallback": false,
    "model_version": "seedance-2-mini",
    "file_url": "https://cdn.memestar.cn/videos/xxx.mp4",
    "cover_url": "https://cdn.memestar.cn/covers/xxx.jpg",
    "duration": 5,
    "voice_id": "funny",
    "subtitle_text": "...",
    "ai_cost": 2.5,
    "error": null
  }
}
```

`status`：`generating` / `reviewing` / `published` / `rejected` / `timeout`。

### 4.14 POST /memes — 发布梗卡

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 |
| 版本 | M1 |
| 限流 | 30/h/用户 |
| 后置流程 | 入审核队列，status=pending_audit → published/rejected |

**请求体** `MemePublishRequest`：

```json
{
  "creation_id": "uuid-creation-1",
  "video_id": null,
  "type": "text",
  "title": "李白的微信朋友圈",
  "tags": ["古代", "微信", "诗人"],
  "legion_id": null,
  "cover_url": null,
  "is_ai_generated": true
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| creation_id | string(uuid) | 否* | type=text/image 时关联造梗会话 |
| video_id | string(uuid) | 否* | type=video 时必填 |
| type | string | 是 | text / image / video |
| title | string | 是 | 1~140 字 |
| tags | string[] | 否 | ≤5 个，每个 ≤16 字 |
| legion_id | string(uuid) | 否 | 军团归属 |
| cover_url | string | 否* | type=image/video 时必填 |
| is_ai_generated | bool | 是 | 强制 true（合规标识） |

**响应** `201` `ApiResponse<MemeCard>`：

```json
{
  "code": 0,
  "data": {
    "meme_id": "uuid-meme-1",
    "author_id": "uuid-user-1",
    "creation_id": "uuid-creation-1",
    "type": "text",
    "title": "李白的微信朋友圈",
    "tags": ["古代", "微信", "诗人"],
    "legion_id": null,
    "status": "pending_audit",
    "god_trash_status": "pending",
    "is_ai_generated": true,
    "watermarked": true,
    "created_at": "2026-07-07T08:00:00Z"
  }
}
```

**错误**：

| HTTP | code | 说明 |
| --- | --- | --- |
| 400 | 9004 | 参数错误（如 type=image 但 cover_url 缺失） |
| 409 | 3002 | creation 已发布过 |
| 429 | 9003 | 限流 |

### 4.15 GET /memes/{id} — 梗卡详情

**鉴权**：可选（游客可读 published 状态）。**响应** `200` `ApiResponse<MemeDetail>`：

```json
{
  "code": 0,
  "data": {
    "meme_id": "uuid-meme-1",
    "author_id": "uuid-user-1",
    "author": { "user_id": "...", "nickname": "...", "avatar_url": "...", "level": 5 },
    "type": "text",
    "cover_url": null,
    "title": "李白的微信朋友圈",
    "tags": ["古代", "微信"],
    "legion_id": null,
    "legion": null,
    "score_avg": 4.20,
    "score_count": 233,
    "comment_count": 18,
    "share_count": 12,
    "favorite_count": 5,
    "view_count": 1200,
    "completion_rate": 0,
    "hot_score": 88.5,
    "god_trash_status": "god",
    "status": "published",
    "is_ai_generated": true,
    "watermarked": true,
    "video": null,
    "my_rating": null,
    "my_favorite": false,
    "published_at": "2026-07-07T08:01:00Z",
    "created_at": "2026-07-07T08:00:00Z"
  }
}
```

**错误**：404 / `code=3001`。

### 4.16 GET /memes/feed — 推荐 feed

| 项 | 值 |
| --- | --- |
| 鉴权 | 可选（登录后个性化） |
| 版本 | M1（热度召回 v1） |
| 分页 | 游标分页（cursor） |

**Query**：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| cursor | string | - | base64(`published_at:last_meme_id`) |
| page_size | int | 20 | max 50 |
| feed_type | string | hot | hot / new / personalized / god |
| legion_id | string | - | 军团墙过滤 |
| tag | string | - | 标签过滤 |

**响应** `200` `ApiResponse<Paged<MemeCardSummary>>`：

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "meme_id": "uuid-1",
        "author_id": "uuid-u1",
        "author_nickname": "梗王",
        "author_avatar_url": "...",
        "type": "image",
        "cover_url": "https://cdn.memestar.cn/covers/x.jpg",
        "title": "...",
        "tags": ["抽象"],
        "legion_id": null,
        "score_avg": 4.5,
        "score_count": 280,
        "comment_count": 30,
        "share_count": 25,
        "hot_score": 92.1,
        "god_trash_status": "god",
        "is_ai_generated": true,
        "published_at": "2026-07-07T07:00:00Z"
      }
    ],
    "total": 0,
    "page": 1,
    "page_size": 20,
    "has_more": true,
    "next_cursor": "YXNkZmFzZGZhc2Rm"
  }
}
```

### 4.17 DELETE /memes/{id} — 删除梗卡

**鉴权**：是（作者或管理员）。**响应**：`204 No Content`。**错误**：403 / `code=1003`（非作者非管理员）；404 / `code=3001`。

### 4.18 POST /memes/{id}/ratings — 评分

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 |
| 版本 | M1 |
| 限流 | 60/min/用户 |
| 业务 | 一人一梗一评，24h 内可改分 |

**请求体** `RatingCreateRequest`：

```json
{
  "star": 5,
  "dimensions": { "laugh": 5, "creative": 4, "spread": 5 },
  "is_god_trash_vote": true,
  "comment": "笑死，转发了"
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| star | int | 是 | 1~5 |
| dimensions | object | 否 | M1 可不传，仅记总分 |
| is_god_trash_vote | bool | 否 | 二元判定（神/烂梗） |
| comment | string | 否 | ≤200 字，走敏感词 |

**响应** `200` `ApiResponse<RatingResult>`：

```json
{
  "code": 0,
  "data": {
    "score_id": "uuid-score-1",
    "meme_id": "uuid-meme-1",
    "user_id": "uuid-user-2",
    "star": 5,
    "is_judge": false,
    "weight": 1.0,
    "meme_score_avg": 4.21,
    "meme_score_count": 234,
    "god_trash_triggered": false,
    "created_at": "2026-07-07T08:05:00Z"
  }
}
```

**错误**：

| HTTP | code | 说明 |
| --- | --- | --- |
| 409 | 4001 | 已评分过（24h 外不可再评，需走 PATCH /ratings/{id}） |
| 400 | 4003 | 评论含敏感词 |
| 403 | 2004 | 青少年模式不可评分 |

### 4.19 GET /memes/{id}/ratings — 评分列表

**Query**：`page` / `page_size` / `sort=-created_at`。**响应** `200` `ApiResponse<Paged<Rating>>`：

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "score_id": "uuid-s1",
        "user_id": "uuid-u1",
        "user_nickname": "路人甲",
        "user_avatar_url": "...",
        "star": 5,
        "is_judge": false,
        "is_god_trash_vote": true,
        "comment": "笑死",
        "created_at": "2026-07-07T08:05:00Z"
      }
    ],
    "total": 234, "page": 1, "page_size": 20, "has_more": true
  }
}
```

### 4.20 POST /memes/{id}/comments — 评论 / 回复

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 |
| 限流 | 30/min/用户 |
| 业务 | 敏感词 DFA + 可疑走阿里云 |

**请求体** `CommentCreateRequest`：

```json
{
  "content": "这就是李白本人吧",
  "parent_id": null,
  "ref_meme_id": null,
  "is_meme_card": false
}
```

**响应** `201` `ApiResponse<Comment>`：

```json
{
  "code": 0,
  "data": {
    "comment_id": "uuid-c1",
    "meme_id": "uuid-meme-1",
    "user_id": "uuid-user-2",
    "parent_id": null,
    "content": "这就是李白本人吧",
    "like_count": 0,
    "is_god_comment": false,
    "status": "published",
    "created_at": "2026-07-07T08:10:00Z"
  }
}
```

**错误**：400 / `code=4003`（敏感词命中）；400 / `code=4004`（楼层 > 3 层）。

### 4.21 GET /memes/{id}/comments — 评论列表

**Query**：`page` / `page_size` / `sort=-like_count,-created_at`。**响应** `200` `ApiResponse<Paged<Comment>>`，`Comment` 同上。

### 4.22 POST /legions — 创建军团

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 + Lv.3+ |
| 版本 | M2 |
| 业务 | 名称唯一（citext），创建时人审 |

**请求体** `LegionCreateRequest`：

```json
{
  "name": "抽象派整活大队",
  "slogan": "我们都是抽象的化身",
  "avatar_url": "https://...",
  "theme_tags": ["抽象", "段子"],
  "join_mode": "approval"
}
```

**响应** `201` `ApiResponse<Legion>`：

```json
{
  "code": 0,
  "data": {
    "legion_id": "uuid-legion-1",
    "name": "抽象派整活大队",
    "slogan": "我们都是抽象的化身",
    "avatar_url": "...",
    "theme_tags": ["抽象", "段子"],
    "leader_id": "uuid-user-1",
    "level": 1,
    "activity_score": 0,
    "member_count": 1,
    "member_cap": 500,
    "join_mode": "approval",
    "badges": [],
    "pk_wins": 0,
    "pk_losses": 0,
    "status": "active",
    "created_at": "2026-07-07T08:00:00Z"
  }
}
```

**错误**：409 / `code=5001`（名称重复）；403 / `code=1003`（等级不足 / 军团数已达 3）。

### 4.23 GET /legions — 军团广场列表

**Query**：`page` / `page_size` / `filter=theme_tags:contains:抽象` / `sort=-activity_score`。**响应** `200` `ApiResponse<Paged<Legion>>`。

### 4.24 POST /legions/{id}/join — 加入军团

**请求体**：

```json
{ "message": "求带，我会整活" }
```

- `join_mode=public` 立即加入；`approval` 创建 join_request，等待队长审批。
- 用户已加入军团数 ≤ 3，违反返回 `code=5003`。

**响应** `200` `ApiResponse<LegionJoinResult>`：

```json
{
  "code": 0,
  "data": {
    "membership_id": "uuid-mem-1",
    "legion_id": "uuid-legion-1",
    "user_id": "uuid-user-2",
    "role": "member",
    "contribution": 0,
    "joined_at": "2026-07-07T08:15:00Z",
    "status": "joined"
  }
}
```

`status`：`joined`（直接加入）/ `pending`（待审批）。

### 4.25 GET /legions/{id} — 军团详情

**响应** `200` `ApiResponse<LegionDetail>`：含基础字段 + 成员榜 Top10 + 今日战报 + PK 战绩摘要。字段对齐 `legions` 表。

### 4.26 GET /pk/matches — PK 大厅

**Query**：`status=battling,preparing` / `type=vote` / `is_official=true` / `page` / `page_size`。**响应** `200` `ApiResponse<Paged<PkMatch>>`：

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "pk_id": "uuid-pk-1",
        "type": "vote",
        "legion_a": { "legion_id": "...", "name": "抽象派", "avatar_url": "..." },
        "legion_b": { "legion_id": "...", "name": "反转派", "avatar_url": "..." },
        "theme": "如果程序员有超能力",
        "start_at": "2026-07-07T00:00:00Z",
        "end_at": "2026-07-08T00:00:00Z",
        "status": "battling",
        "score_a": 1234.5,
        "score_b": 1100.0,
        "winner_id": null,
        "mvp_user_id": null,
        "is_official": false,
        "my_votes_today": 1
      }
    ],
    "total": 8, "page": 1, "page_size": 20, "has_more": false
  }
}
```

### 4.27 POST /pk/matches — 创建 PK

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 + leader / 运营 |
| 版本 | M2 |
| 业务 | 单军团同时最多 1 场进行中 PK |

**请求体** `PkCreateRequest`：

```json
{
  "type": "creation",
  "legion_a": "uuid-legion-1",
  "legion_b": "uuid-legion-2",
  "theme": "如果古人会玩狼人杀",
  "start_at": "2026-07-08T00:00:00Z",
  "end_at": "2026-07-09T00:00:00Z",
  "is_official": false
}
```

- `legion_b` 可为空：表示系统匹配，进入 `challenged` 等待。
- 跨段位保护：低 2 段以上不可挑战，返回 `code=5101`。

**响应** `201` `ApiResponse<PkMatch>`。

### 4.28 POST /pk/matches/{id}/vote — 投票

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 |
| 限流 | 3 票/日/PK/用户 |
| 业务 | Redis 实时计数 + DB 异步落盘 |

**请求体**：

```json
{ "legion_id": "uuid-legion-1" }
```

**响应** `200` `ApiResponse<PkVoteResult>`：

```json
{
  "code": 0,
  "data": {
    "vote_id": "uuid-vote-1",
    "pk_id": "uuid-pk-1",
    "legion_id": "uuid-legion-1",
    "my_votes_today": 2,
    "votes_remaining_today": 1,
    "current_scores": { "legion_a": 1235.5, "legion_b": 1100.0 },
    "voted_at": "2026-07-07T08:20:00Z"
  }
}
```

**错误**：429 / `code=5102`（今日票数耗尽）；409 / `code=5101`（PK 状态非 battling）。

### 4.29 POST /chat/rooms/{id}/messages — 发送消息

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 |
| 版本 | M2 |
| 限流 | 新成员 3/min，老成员 30/min |
| 业务 | 走自建 WebSocket（军团群）/ Supabase Realtime（私聊） |

**请求体** `MessageSendRequest`：

```json
{
  "msg_type": "text",
  "content": "在吗",
  "extra": { "ref_message_id": "uuid-msg-1", "mentions": ["uuid-user-3"] }
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| msg_type | string | 是 | text / image / meme / voice / system |
| content | string | 否* | text/voice 时必填（voice 为 URL） |
| extra | object | 否 | 引用 / @ / 梗卡引用 ref_meme_id |

**响应** `201` `ApiResponse<Message>`：

```json
{
  "code": 0,
  "data": {
    "message_id": "uuid-msg-2",
    "room_id": "uuid-room-1",
    "sender_id": "uuid-user-2",
    "msg_type": "text",
    "content": "在吗",
    "extra": { "mentions": ["uuid-user-3"] },
    "created_at": "2026-07-07T08:25:00Z"
  }
}
```

### 4.30 GET /chat/rooms/{id}/messages — 消息列表

**Query**：`cursor` / `page_size`（游标分页，30 天前数据归档不可查）。**响应** `200` `ApiResponse<Paged<Message>>`。

### 4.31 GET /recommend/feed — 推荐 feed（个性化）

`/memes/feed` 的个性化版本，鉴权为 `是`。M2 起走双塔召回 + LightGBM 排序。

### 4.32 POST /pro/subscriptions — 订阅 Pro

| 项 | 值 |
| --- | --- |
| 鉴权 | 是 |
| 版本 | M2 |
| 业务 | 创建订单 → 拉起微信支付 → 回调激活 |

**请求体** `ProSubscribeRequest`：

```json
{ "plan": "monthly", "auto_renew": true, "channel": "wechat" }
```

**响应** `201` `ApiResponse<OrderCreated>`：

```json
{
  "code": 0,
  "data": {
    "order_id": "uuid-order-1",
    "sub_id": "uuid-sub-1",
    "product_type": "pro",
    "amount_cents": 1800,
    "channel": "wechat",
    "status": "pending",
    "wx_pay_params": {
      "appid": "wx...",
      "timestamp": "1720351200",
      "noncestr": "...",
      "package": "prepay_id=...",
      "sign_type": "RSA",
      "pay_sign": "..."
    },
    "created_at": "2026-07-07T08:30:00Z"
  }
}
```

**错误**：409 / `code=7003`（已订阅且未过期）。

### 4.33 POST /orders/wx-pay/callback — 微信支付回调

| 项 | 值 |
| --- | --- |
| 鉴权 | 否（HMAC-SHA256 签名校验） |
| 版本 | M2 |
| 路径 | `/api/internal/webhooks/orders/wx-pay`（不走红框包装） |
| 业务 | 验签 → 更新 order/sub/video_package 状态 → 触发权益 |

**请求**：微信支付 v3 API 回调格式，Header `Wechatpay-Signature` + body JSON。**响应**：`200` + `{"code":"SUCCESS","message":"OK"}`（微信规范）。**详细**见 §7.2。

### 4.34 GET /notifications — 通知列表

**鉴权**：是。**Query**：`type` / `is_read` / `page` / `page_size`。**响应** `200` `ApiResponse<Paged<Notification>>`：

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "notif_id": "uuid-n1",
        "type": "god_meme",
        "title": "你的梗卡成神了！",
        "body": "「李白的微信朋友圈」被评为神梗",
        "payload": { "meme_id": "uuid-meme-1" },
        "is_read": false,
        "created_at": "2026-07-07T09:00:00Z"
      }
    ],
    "total": 23, "page": 1, "page_size": 20, "has_more": true
  }
}
```

`type` 枚举：`rating` / `god_meme` / `pk` / `reward` / `violation` / `pro` / `agent_done` / `comment` / `follow`。

---

## 5. AI 异步任务流模式说明

### 5.1 适用接口

- `POST /creations/agent`（Agent 造梗）
- `POST /videos`（视频生成）
- 未来：批量图生视频、批量 Agent 等

### 5.2 统一状态机

```
        submit                 dequeue
queued ────────► running ──────────► succeeded
                    │
                    ├──► failed       (业务错误，可重试或降级)
                    ├──► timeout      (超时，触发降级)
                    └──► fallback_used (Agent→single / video→image+tts)
```

| status | 含义 | 客户端动作 |
| --- | --- | --- |
| queued | 已入队，等待 worker 拉取 | 继续轮询 |
| running | worker 执行中 | 继续轮询，显示进度 |
| succeeded | 成功完成 | 拉取结果，UI 进入下一步 |
| failed | 失败（最终态） | 提示用户重试 |
| timeout | 超时（最终态，已触发降级） | 检查 `fallback_used`，按降级结果展示 |
| fallback_used | 降级完成（合并到 succeeded/failed 上） | `fallback_used=true` 时按单次 prompt / 图片+TTS 结果展示 |

### 5.3 轮询建议

| 任务 | 轮询间隔 | 最长轮询 | 超时动作 |
| --- | --- | --- | --- |
| Agent 造梗 | 2s | 60s | 切 WebSocket 推送（M2 启用） |
| 视频生成 | 3s | 180s | 切 Webhook（M2 启用） |

### 5.4 WebSocket 推送（可选）

订阅 channel：`job:{job_id}`，事件 `job.progress` / `job.done`，payload 同 `GET /agent-jobs/{id}` 响应。详见 §6。

### 5.5 失败补偿

- Agent 失败/超时：自动退回 Agent 能量（`energy_balance += agent_cost`），并发系统通知 `type=agent_done` + `payload.error`。
- 视频失败/超时：自动退能量 + 赠送 1 次补偿生成（Redis 计数 `video:compensate:{user_id}`，TTL 7d）。

---

## 6. WebSocket 事件契约

### 6.1 连接

- **URL**：`wss://api.memestar.cn/ws?token=<access_token>`
- **协议**：基于 `socket.io`（v4）兼容，或原生 `ws`。
- **鉴权**：连接时 query 带 `token`，校验失败 close `4001`。
- **心跳**：客户端每 25s 发 `ping`，服务端 `pong`；30s 无心跳断连。
- **重连**：指数退避 1s/2s/4s/8s/16s，max 30s。

### 6.2 事件定义

| 事件名 | 方向 | payload | 说明 |
| --- | --- | --- | --- |
| `chat.message` | server→client | `Message` | 新消息（私聊/军团群） |
| `chat.read` | server→client | `{room_id, user_id, last_read_msg_id}` | 对方已读 |
| `chat.typing` | client→server / server→client | `{room_id, user_id, is_typing}` | 正在输入 |
| `pk.score.update` | server→client | `{pk_id, score_a, score_b}` | PK 实时比分 |
| `pk.status.change` | server→client | `{pk_id, status}` | PK 状态变更 |
| `job.progress` | server→client | `{job_id, status, progress}` | Agent/视频任务进度 |
| `job.done` | server→client | `{job_id, status, result_url?}` | 任务完成 |
| `notification.new` | server→client | `Notification` | 新通知 |
| `meme.score.update` | server→client | `{meme_id, score_avg, score_count}` | 梗卡评分实时更新 |
| `subscribe` | client→server | `{channel: "room:uuid"}` | 订阅频道 |
| `unsubscribe` | client→server | `{channel}` | 取消订阅 |

### 6.3 Message payload schema

```json
{
  "message_id": "uuid",
  "room_id": "uuid",
  "sender_id": "uuid",
  "sender_nickname": "梗王",
  "sender_avatar_url": "...",
  "msg_type": "text",
  "content": "在吗",
  "extra": { "mentions": ["uuid-u1"], "ref_message_id": "uuid-m1" },
  "created_at": "2026-07-07T08:25:00Z"
}
```

---

## 7. Webhook 契约

### 7.1 视频生成回调

| 项 | 值 |
| --- | --- |
| Path | `POST /api/internal/webhooks/video/{job_id}` |
| 来源 | 火山方舟 / SiliconFlow / 即梦 |
| 鉴权 | HMAC-SHA256 签名 + timestamp 防重放 |

**签名校验**：

```
signature = HMAC-SHA256(webhook_secret, "{timestamp}.{body}")
```

Header：

```
X-MemeStar-Signature: sha256=<hex>
X-MemeStar-Timestamp: 1720351200
```

**Payload**（火山方舟格式，由 Webhook Handler 适配层归一化）：

```json
{
  "job_id": "uuid-vjob-1",
  "external_task_id": "volcano-task-xxx",
  "status": "succeeded",
  "video_url": "https://...",
  "cover_url": "https://...",
  "duration": 5,
  "metadata": { "model": "seedance-2-mini" }
}
```

**响应**：`200` + `{"code":0,"message":"ok"}`（非红框包装，Webhook 不走统一响应）。

**重试**：服务端返回非 2xx 时，provider 按 5s/30s/2min/10min/1h 重试 5 次。

**防重放**：`timestamp` 与服务器时间差 > 5min 拒绝；`(job_id, external_task_id)` Redis SETNX 24h 防重。

### 7.2 微信支付回调

| 项 | 值 |
| --- | --- |
| Path | `POST /api/internal/webhooks/orders/wx-pay` |
| 来源 | 微信支付 v3 |
| 鉴权 | 微信支付平台证书 + RSA-SHA256 验签 |

**校验流程**（微信支付 v3 规范）：

1. 从 Header `Wechatpay-Timestamp` / `Wechatpay-Nonce` / `Wechatpay-Signature` / `Wechatpay-Serial` 取参数。
2. 用平台证书（按 serial 查缓存）验签 `"{timestamp}\n{nonce}\n{body}\n"`。
3. 解密 AES-256-GCM `resource.ciphertext`（APIv3 key）。
4. 处理业务：更新 `orders.status=paid` + `payments` 流水 + `pro_subscriptions.status=active` 或 `video_packages.used_quota` 重置。
5. 返回 `200` + `{"code":"SUCCESS","message":"OK"}`。

**幂等**：`(order_id, channel_txn_id)` 唯一约束防重。

**回调失败**：微信按 15s/15s/30s/3m/10m/20m/30m/30m/1h/2h/6h/6h 重试 12 次。

---

## 8. 分页、排序、过滤约定

### 8.1 分页

- **offset 分页**（默认）：`page` + `page_size`，max page_size = 50，适合管理员列表、评论等顺序数据。
- **游标分页**（推荐 feed）：`cursor` + `page_size`，适合高并发、深分页场景，`/memes/feed` / `/chat/rooms/{id}/messages` / `/recommend/feed` 使用。
  - `cursor` 格式：base64(`{published_at}:{meme_id}`) 或 base64(`{created_at}:{message_id}`)。
  - 响应中带 `next_cursor`，无更多数据时为 `null`。

### 8.2 排序

- `sort` 参数：多字段逗号分隔，前缀 `-` 表示 DESC，如 `sort=-hot_score,-created_at`。
- `order` 参数：兼容旧客户端 `asc` / `desc`，与 `sort` 同时存在时 `sort` 优先。
- 默认排序：每个接口在 OpenAPI 中显式声明。

### 8.3 过滤

- `filter` 参数：`field:op:value`，多条件逗号分隔。
- 支持的 op：`eq` / `ne` / `gt` / `gte` / `lt` / `lte` / `in` / `contains` / `between`。
- 示例：`filter=type:eq:image,score_count:gte:50,created_at:between:2026-07-01,2026-07-31`。
- 复杂过滤（如 OR）走专用查询接口，不走 `filter`。

### 8.4 字段投影

- `fields` 参数：`fields=meme_id,title,score_avg`，仅返回指定字段，减少流量。
- 默认每个接口在 OpenAPI 中声明完整字段集。

---

## 9. 版本化策略

- **URL 版本**：`/api/v1`，破坏性变更走 `/api/v2`，老版本并行维护 6 个月。
- **向后兼容变更**（无需升大版本）：
  - 新增可选字段 / 新增接口 / 新增枚举值（客户端需容忍未知枚举）。
  - 改变错误码 `message` 文案（不改 `code`）。
  - 改变限流阈值。
- **破坏性变更**（必须升大版本）：
  - 删除字段 / 改字段类型 / 改字段语义 / 改必填性 / 删除接口 / 改鉴权要求。
- **OpenAPI 中标注**：`x-memestar-version: M1` / `M2` / `v1.5+` / `deprecated`。

---

## 10. SDK 与 Mock

### 10.1 前端类型生成

- 推荐 `openapi-typescript`（轻量）或 `orval`（含 React Query hooks 生成）：

  ```bash
  npx openapi-typescript ./docs/openapi.yaml -o packages/shared/src/api/types.gen.ts
  npx orval --input ./docs/openapi.yaml --output packages/shared/src/api/client.gen.ts
  ```

- 三端（App/Web/Admin）统一引用 `packages/shared`，避免类型漂移。

### 10.2 Mock

- **Prism**：`npx prism mock ./docs/openapi.yaml -p 4010`，启动本地 mock server，支持请求校验 + 动态响应。
- **Apifox**：导入 `openapi.yaml` → 一键 Mock + 团队协作 + 自动用例。
- **Postman**：导入 `openapi.yaml` → 生成集合 + 环境变量 + 自动化测试。
- 建议前端开发默认连 Prism Mock，联调切 staging，避免互相阻塞。

### 10.3 灰度发布

- 客户端通过 `Expo Update` 动态切换 Base URL（dev / staging / prod）。
- 新接口灰度：先在 staging 验证 → 灰度 5% 用户（按 user_id hash）→ 全量。

---

## 11. 关键设计取舍

| 决策 | 选择 | 理由 |
| --- | --- | --- |
| 响应包装 | 统一 `{code,data,message,request_id}` | 前端统一处理错误，code 不依赖 HTTP 状态；HTTP 状态仍保留用于网关/CDN 路由 |
| 异步任务模式 | 202 + job_id + 轮询/WS | AI 生成耗时 15-180s，HTTP 长连接不可靠；轮询简单兜底，WS 体验更好 |
| 字段命名 | snake_case 严格对齐 schema.sql | 避免后端 ORM 转换层；TS 客户端用 snake_case 也无障碍 |
| 错误码 | 1xxx-9xxx 区间划分 | 便于客户端按区间做错误兜底（1xxx 跳登录、7xxx 跳订阅） |
| 分页 | offset + 游标双模式 | 管理员列表简单用 offset，feed 高并发用游标 |
| Pro Agent 路径 | 单独 `/creations/agent` 而非 query 参数 | 异步模式与同步 `/creations/single` 响应结构差异大，分离更清晰 |
| 视频 Webhook | 不走统一响应包装 | 遵循 provider 规范（火山/微信），适配层归一化后再入业务流 |
| Admin 接口路径 | `/admin/*` 单独前缀 | 便于网关层 RBAC + IP 白名单 + 强制 2FA |
| M1 不做接口 | 标 `v1.5+` 而非删除 | 文档为产品全景，避免 M2 重复设计；前端可提前预留 UI |

---

## 12. 附录

### 12.1 完整错误码速查

| code | HTTP | 名称 |
| --- | --- | --- |
| 0 | 200/202/204 | OK |
| 1001 | 401 | token 无效 |
| 1002 | 401 | token 过期 |
| 1003 | 403 | 无权限 |
| 1010 | 429 | 短信发送频繁 |
| 1011 | 429 | 登录 IP 限流 |
| 1012 | 429 | 短信日上限 |
| 1013 | 400 | 验证码错误 |
| 1014 | 400 | 验证码过期 |
| 2001 | 404 | 用户不存在 |
| 2002 | 400 | 昵称违规/未到改昵称时间 |
| 2004 | 403 | 用户被封禁 |
| 2010 | 400 | 兴趣标签数不足 |
| 3001 | 404 | 梗卡不存在 |
| 3002 | 409 | 梗卡状态非法 |
| 3003 | 403 | 审核未通过 |
| 3101 | 500 | 视频生成失败 |
| 3102 | 429 | 视频配额耗尽 |
| 4001 | 409 | 已评分过 |
| 4002 | 400 | 评分超阈值 |
| 4003 | 400 | 敏感词命中 |
| 4004 | 400 | 评论楼层过深 |
| 5001 | 409 | 军团名重复 |
| 5002 | 403 | 军团已解散 |
| 5003 | 403 | 已加入军团上限 |
| 5101 | 409 | PK 状态非法 |
| 5102 | 429 | PK 投票次数耗尽 |
| 6001 | 400 | 能量不足 |
| 6002 | 400 | prompt 命中黑名单 |
| 6003 | 429 | AI 模型熔断 |
| 6004 | 429 | Agent 配额耗尽 |
| 6005 | 400 | prompt 24h 重复 |
| 7001 | 404 | 订单不存在 |
| 7002 | 400 | 支付失败 |
| 7003 | 409 | Pro 已订阅 |
| 7004 | 429 | 视频按次包已用尽 |
| 9001 | 500 | 内部错误 |
| 9002 | 503 | 依赖服务不可用 |
| 9003 | 429 | 限流 |
| 9004 | 400 | 参数校验失败 |

### 12.2 术语对齐

详见 PRD §3 术语表。本接口文档中 `meme_power` / `god_trash_status` / `legion_id` / `hot_score` / `agent_mode` 等字段严格对齐 schema.sql。

### 12.3 字段命名规范

- 数据库字段：snake_case（schema.sql 权威）。
- JSON 字段：snake_case（与 DB 一致，避免转换层）。
- 枚举值：snake_case 字符串（如 `god_trash_status: "god"`）。
- 时间字段：`*_at` 后缀，ISO 8601 UTC。
- 布尔字段：`is_*` / `has_*` 前缀。

---

> 本文档为前后端共识接口契约权威，所有改动需经评审后同步更新本文档与 `openapi.yaml`。
