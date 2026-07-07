# 「梗星球」MemeChatAI — M1 Sprint 计划（第 1 个月）

> 内部执行文档 · 个人开发者视角 · 与 PRD v1.1.0 / TechnicalDesign v1.1.0 对应

---

## 1. 文档信息

| 项目 | 内容 |
| --- | --- |
| 文档名称 | M1 Sprint 计划（M1 = 第 1 个月，4 周拆分） |
| 文档版本 | v1.0.0 |
| 作者 | 技术架构 / 项目负责人 |
| 创建日期 | 2026-07-07 |
| 关联文档 | [PRD.md](./PRD.md) v1.1.0、[TechnicalDesign.md](./TechnicalDesign.md) v1.1.0 |
| Sprint 周期 | M1 = 4 周（2026-07-08 ~ 2026-08-04，按周拆 4 个 Sprint） |
| 适用对象 | 个人全栈开发者（熟练 TS / NestJS / PG / RN，AI Agent 工程化经验中等） |
| 节奏选择 | **1 周 1 个 Sprint**（共 4 个：S1 / S2 / S3 / S4），详见 §3 |

---

## 2. M1 目标与范围

### 2.1 M1 必须交付（对齐 PRD §11.1 P0 + TechnicalDesign §16.1）

M1 的目标定位是 **"打地基 + 跑通最小造梗闭环"**——把基础设施、用户系统、AI 编排层、造梗工坊（文本/图片）、梗卡 feed、评分评论、内容安全机审打通，形成"登录 → 造梗 → 发布 → 评分 → 神/烂梗判定"的端到端可演示链路，为 M2 引入视频/军团/PK/IM/Agent/支付打下地基。

**M1 必交付项（P0）**：

- **基础设施**：域名 + ICP 备案启动、轻量云、Docker、PG16+pgvector、Redis、Cloudflare（CDN+R2+WAF）、CI/CD、监控（Sentry/UptimeRobot/PostHog）、Supabase 项目 + Auth。
- **后端骨架**：NestJS 模块化单体（15 个 Module 骨架）、TypeORM/Prisma、JWT 中间件、统一响应/错误码、配置管理。
- **用户系统**：手机号验证码登录、微信/Apple OAuth、兴趣标签、个人主页、梗力值/等级、能量、3 个基础勋章。
- **AI 编排层**：LLM Adapter（DeepSeek V3 主 + GLM-4 Flash 兜底）、Image Adapter（SiliconFlow FLUX 主 + 通义万相兜底）、Policy Engine（降级/熔断/限流/成本追踪）、Prompt 模板表 + 5 个官方模板、Redis prompt 缓存。
- **造梗工坊（MVP 子集）**：文本造梗（单次 prompt，3 候选）+ 图片造梗（默认 1 候选 + "再来一次"）、BullMQ 异步任务、能量扣减乐观锁、24h prompt 去重。
- **梗卡内容流**：meme_card 表 + 向量表骨架、发布接口、热度召回 feed（v1 简化）、梗卡详情、热度分 Redis ZSet + 定时 cron。
- **评分评论体系**：评分接口 + 加权计算（评审官/新用户/同军团权重）、神/烂梗判定 job（阈值 200）、评论接口 + 敏感词过滤、转发/举报。
- **内容安全**：阿里云内容安全接入（文本/图片）、敏感词 DFA 库、机审队列、AI 生成内容标识（角标 + 详情页声明）。
- **合规**：AIGC 备案材料准备启动（M1 启动，M2 提交，M3 取得备案号）、隐私政策 + 用户协议草稿、未成年人保护设计稿。
- **客户端 RN App**：5 Tab 信息架构、登录页、兴趣选择页、个人主页、造梗工坊（文本/图片）、推荐 feed、梗卡详情、评分/评论/转发面板。
- **Web/后台**：Next.js Web 落地页 + Admin shell（仅登录与基础布局，详细审核/PK 看板 M2）。
- **埋点**：Tracker SDK 封装 + PostHog 接入 + 17 个关键事件埋点（PRD §10.3）。

### 2.2 M1 不交付（明确延后到 M2 / M3）

| 延后项 | 去向 | 理由 |
| --- | --- | --- |
| AI 视频生成（豆包 Seedance + 兜底） | M2 | 成本最敏感、依赖造梗闭环稳定，M2 单独重点攻坚 |
| Pro 造梗 Agent（3 步精简版） | M2 | 依赖 RAG 知识库与造梗数据沉淀，M1 没有神梗向量可用 |
| RAG 造梗知识库（pgvector 检索神梗） | M2 | 需 M1 先产出"神梗"数据 |
| 梗大军（Legion）CRUD + 成员 + 群聊 | M2 | 依赖用户系统稳定，且群聊自建 WebSocket 工作量大 |
| PK（投票 PK + 造梗对决） | M2 | 依赖军团就位 |
| 私聊 + 军团群聊（IM） | M2 | Supabase Realtime + 自建 WebSocket 双轨，单独 Sprint |
| Pro 会员 + 微信支付 + 视频按次包 | M2 | MVP 即开但放到 M2，先验证核心闭环 |
| 完整运营后台（审核队列/PK 运营/数据看板） | M2 | M1 仅 Admin shell |
| 推荐：向量召回 + LR 排序 | M2 | M1 仅热度召回 v1，向量召回依赖神梗数据 |
| 神评系统 / 评审官竞选 / 烂梗博物馆 | M3+ | 非闭环必需 |
| 灰度上线 / 邀请制基础设施 | M3 | M1/M2 不上线 |
| AIGC 备案号取得 | M3 | 备案材料 M1 启动、M2 提交、M3 取得（上线 gate） |

### 2.3 M1 成功标准（Exit Criteria，可量化）

1. **端到端可演示**：从 RN App 登录 → 选兴趣 → 文本造梗 3 候选 → 包装发布 → 进 feed → 评分/评论/转发 → 达阈值触发神/烂梗判定，全链路在 staging 环境跑通。
2. **图片造梗**：SiliconFlow FLUX 主链路成功率 ≥ 90%，平均耗时 < 5s；通义万相兜底链路验证可用。
3. **AI 编排层**：DeepSeek → GLM 自动降级链路验证通过；Policy Engine 日预算熔断触发一次演练。
4. **内容安全**：所有梗卡发布走"敏感词 DFA + 阿里云机审"双重审核，违规拦截率验证；AI 生成内容 100% 带"AI 生成"角标。
5. **基础设施**：CI/CD 自动构建镜像 + 部署 staging；Sentry/PostHog 接收真实事件；PG 每日备份脚本运行。
6. **合规**：AIGC 备案材料草稿（模型来源、训练数据说明、安全评估报告、内容审核机制、用户协议与隐私政策）完成 ≥ 80%；隐私政策 + 用户协议 v0.1 完成。
7. **埋点**：17 个关键事件中至少 12 个（login、meme_create_start/success、meme_publish、meme_view、meme_score、meme_comment、meme_share、app_launch、god_meme_trigger、trash_meme_trigger、legion 相关延后）在 PostHog 看到真实事件。
8. **工时**：M1 P0 任务完成 ≥ 90%；P1 stretch 完成度不限。
9. **文档**：API 接口文档（OpenAPI）覆盖 M1 全部接口；DB DDL 文档化。

### 2.4 与 M2 / M3 的衔接关系

- **M2（第 2 个月）目标预告**：在 M1 闭环之上叠加"军团 + PK + IM + 视频生成 + Pro 造梗 Agent + RAG 知识库 + Pro 会员支付 + 完整运营后台 + 推荐向量召回"，形成 MVP 全功能集（除灰度上线外）。
- **M3（第 3 个月）目标预告**：完成 AIGC 备案号取得（上线 gate）、ICP 备案号取得、灰度上线基础设施（邀请制 DAU ≤ 500~2000）、数据看板完善、AB 实验框架准备、性能/安全加固、Bug 修复 + 灰度发布。

---

## 3. Sprint 节奏

**选择：1 周 1 个 Sprint，共 4 个（S1 ~ S4）。**

**理由**：

1. M1 任务密度高、依赖链复杂，**周级别 checkpoint** 强制个人开发者每周自检进度，避免月度瀑布式失控。
2. 个人开发者无团队对齐成本，周会改成"周五 30min 自评审 + 调整下周计划"，开销可控。
3. 4 周恰好对应 4 个主题阶段（基础设施 / 用户+AI 编排 / 造梗+梗卡+审核 / 评分+收尾），自然成 Sprint 边界。
4. 2 周 1 Sprint 在个人开发场景下粒度太粗，进度偏移难以及时纠正。

**每周节奏（建议）**：

- 周一：明确本周 Sprint Goal + 拉任务到 in_progress。
- 周二 ~ 周四：执行（编码 + 自测）。
- 周五上午：联调 + 自测 + 写 demo；下午：Sprint Review + Retrospective + 调整下周 backlog。
- 周末：休息 / 缓冲 / 文档补完。

**Sprint 主题**：

| Sprint | 周次 | 主题 | 核心交付 |
| --- | --- | --- | --- |
| S1 | W1（07-08 ~ 07-14） | 基础设施 + 脚手架 | 服务器/DB/Redis/R2/CF/CI/CD/监控/Supabase/NestJS 骨架/DB schema 设计 |
| S2 | W2（07-15 ~ 07-21） | 用户系统 + AI 编排层 | 登录/兴趣/主页/等级 + LLM/Image Adapter/Policy/Prompt 模板 |
| S3 | W3（07-22 ~ 07-28） | 造梗工坊 + 梗卡 + 审核 | 文本/图片造梗 + 梗卡发布/feed/详情 + 机审管线 + RN 造梗/feed 页 |
| S4 | W4（07-29 ~ 08-04） | 评分评论 + 收尾 + M1 Demo | 评分/神烂梗判定/评论/转发 + RN 评分页 + 埋点收口 + 合规文档 + M1 Demo |

---

## 4. 任务分解（核心）

> 字段：`任务ID`、`任务名`、`描述`、`类型`、`优先级`、`工时(人日)`、`依赖`、`验收标准`、`所属 Sprint`。
> 类型：后端 / 前端 / 全栈 / 运维 / 合规 / 运营。
> 优先级：P0 = M1 必做；P1 = M1 stretch（可延 M2）。
> 工时按个人全栈开发者水平估，0.5 ~ 3 人日/任务。

### 4.1 基础设施（INF）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INF-01 | 域名注册 + ICP 备案启动 | 注册 .com/.cn 主域名，提交个人 ICP 备案（7~20 天） | 运维 | P0 | 0.5 | — | 域名持有；备案受理回执 | S1 |
| INF-02 | 轻量云采购 + 初始化 | 腾讯云/阿里云 2C2G 50GB，OS 初始化、SSH 密钥、防火墙 | 运维 | P0 | 0.5 | — | 可 SSH 登录；安全组仅放 22/443 | S1 |
| INF-03 | Docker + docker-compose 环境 | 安装 Docker、compose、网络配置、镜像加速 | 运维 | P0 | 1 | INF-02 | `docker compose version` 可用；镜像拉取流畅 | S1 |
| INF-04 | PG16 + pgvector 部署 | pgvector/pgvector:pg16 镜像、库初始化、用户、扩展启用、每日备份脚本 | 后端 | P0 | 1 | INF-03 | `CREATE EXTENSION vector` 成功；备份脚本 cron 跑通 | S1 |
| INF-05 | Redis 7 部署 + 持久化 | redis:7-alpine，AOF 开启，密码 | 运维 | P0 | 0.5 | INF-03 | `redis-cli ping` 返回 PONG；AOF 文件生成 | S1 |
| INF-06 | Cloudflare 账户 + R2 桶 + CDN | 注册 CF、创建 R2 桶（images/videos/covers）、配置 CDN 域名、WAF Bot Fight | 运维 | P0 | 1 | INF-01 | R2 桶可上传；CDN 域名可访问；WAF 启用 | S1 |
| INF-07 | GitHub Actions CI/CD | lint+typecheck+test、构建镜像、SSH 部署 staging、Vercel/CF Pages 预览 | 运维 | P0 | 1.5 | INF-03 | PR 触发 CI；main push 自动部署 staging | S1 |
| INF-08 | 监控接入 | Sentry（错误）、UptimeRobot（拨测）、PostHog（埋点）账户 + SDK 集成 | 运维 | P0 | 0.5 | — | Sentry 收到测试错误；PostHog 收到测试事件 | S1 |
| INF-09 | Supabase 项目 + Auth 配置 | 创建 Supabase 项目（新加坡/东京区）、启用手机号/邮箱/微信/Apple OAuth、Webhook 准备 | 后端 | P0 | 1 | — | OAuth redirect 可用；Auth 用户表可写 | S1 |
| INF-10 | NestJS 模块化单体脚手架 | 15 个 Module 骨架（Auth/User/Meme/Creation/Video/Rating/Legion/PK/Chat/Recommend/Audit/Admin/Notification/Analytics/AIOrch）、TypeORM、统一响应/错误码、Swagger | 后端 | P0 | 1.5 | INF-04, INF-05 | `/health` 200；Swagger UI 可访问；15 Module 文件就位 | S1 |
| INF-11 | 共享层 packages/shared | TS 类型、API client、常量、AI prompt 模板三端共享包 | 全栈 | P0 | 1 | INF-10 | `packages/shared` 可被 app/web 引用 | S1 |
| INF-12 | .env 模板 + Secrets 管理 | 整理 TechnicalDesign 附录 A 的 .env 模板，GitHub Secrets 注入 | 运维 | P0 | 0.5 | INF-07 | staging/prod .env 不入仓；Secrets 已配置 | S1 |

**小计：10.0 人日**

### 4.2 用户系统（USER）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| USER-01 | DB schema: user/profile/level/badges | user 表 + 索引、interest_tags jsonb、level/meme_power/energy_balance 字段 | 后端 | P0 | 1 | INF-10 | DDL 文档化；migration 跑通；索引建好 | S2 |
| USER-02 | Supabase Auth 集成 + JWT 中间件 | Supabase JWT 校验 + 自签 JWT 双轨、AuthGuard、RBAC 装饰器 | 后端 | P0 | 1.5 | INF-09, USER-01 | 受保护接口需带 JWT；RBAC `@Roles` 生效 | S2 |
| USER-03 | 手机号验证码登录 | 阿里云/腾讯云短信、OTP 生成/校验、限频、Supabase Auth 联动 | 后端 | P0 | 1.5 | USER-02 | 真实手机收到验证码；登录成功下发 JWT | S2 |
| USER-04 | 微信/Apple OAuth 登录 | Supabase OAuth 重定向 + 回调 + 用户表同步到国内 PG | 后端 | P0 | 1.5 | USER-02 | 微信/Apple 登录链路通；用户表写入国内 PG | S2 |
| USER-05 | 用户表 Supabase Webhook 同步 | Supabase auth.users 变更 Webhook 同步到国内 PG user 表（仅必要字段） | 后端 | P0 | 1 | USER-02 | Webhook 触发后国内 PG 有对应行 | S2 |
| USER-06 | 兴趣标签接口 + 冷启动 | 标签库种子（30+ 标签）、选择/修改接口、冷启动 feed 比例配置 | 后端 | P0 | 0.5 | USER-01 | 标签库可读；选择接口写入 user.interest_tags | S2 |
| USER-07 | 个人主页 GET/编辑接口 | 资料 GET/PATCH、昵称敏感词校验、30 天改一次限制 | 后端 | P0 | 1 | USER-01 | 主页接口返回完整字段；编辑校验生效 | S2 |
| USER-08 | 梗力值/等级计算 service | level = f(meme_power)、能量每日恢复、衰减规则（v1 简化：30 天不活跃衰减 5%） | 后端 | P0 | 1 | USER-01 | 单测覆盖等级/能量计算；定时恢复 job 跑通 | S2 |
| USER-09 | 勋章发放框架 + 3 基础勋章 | badge 表 + 触发器框架、首张神梗/连续 7 天造梗/PK 冠军（PK 勋章 M2 触发） | 后端 | P0 | 1 | USER-01 | 框架可扩展；前 2 个勋章触发逻辑就绪 | S2 |
| USER-10 | RN App 框架 + 5 Tab 导航 | Expo 项目、React Navigation 5 Tab、Zustand、TanStack Query、NativeWind | 前端 | P0 | 1.5 | INF-11 | App 在 iOS/Android 模拟器跑起来；5 Tab 可切换 | S2 |
| USER-11 | RN 登录页 + OTP 输入 | 手机号输入、OTP 倒计时、微信/Apple 登录按钮、错误态 | 前端 | P0 | 1.5 | USER-03, USER-04, USER-10 | 真机登录成功；JWT 持久化 | S2 |
| USER-12 | RN 兴趣标签选择页 | 标签瀑布选择、至少 3 个、跳过逻辑、埋点 | 前端 | P0 | 1 | USER-06, USER-11 | 选择写入服务端；进入主页 | S2 |
| USER-13 | RN 个人主页 + 编辑资料 | 资料/等级进度/勋章墙/作品 Tab 占位（作品 M3 接入） | 前端 | P0 | 2 | USER-07, USER-11 | 主页渲染；编辑资料可保存 | S3 |

**小计：15.0 人日**

### 4.3 AI 编排层（AIO）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AIO-01 | AIOrchModule 抽象接口 | LLMProvider/ImageProvider/VideoProvider/TTSProvider 接口 + Adapter 注册 | 后端 | P0 | 1 | INF-10 | 接口文件就位；Mock adapter 单测通过 | S2 |
| AIO-02 | LLM Adapter: DeepSeek V3 + GLM 兜底 | DeepSeek chat API、GLM-4-Flash 兜底、流式/非流式、function calling 占位 | 后端 | P0 | 1.5 | AIO-01 | 真实调用成功；主链失败自动切兜底 | S2 |
| AIO-03 | Image Adapter: SiliconFlow FLUX + 通义万相兜底 | FLUX.1-schnell 主、通义万相兜底、图片上传 R2、URL 返回 | 后端 | P0 | 1.5 | AIO-01, INF-06 | 真实生成图片落到 R2；兜底链路验证 | S2 |
| AIO-04 | Policy Engine: 降级/熔断/限流/成本追踪 | provider 错误率 > 30% 熔断 5min、日预算限流、ai_cost_log 表 | 后端 | P0 | 1.5 | AIO-01 | 熔断演练触发；cost_log 写入；限流返回 429 | S2 |
| AIO-05 | Prompt 模板表 + 5 官方模板种子 | prompt_template 表 + 抽象/阴阳/谐音/反转/表情包配文 5 模板、变量插值 | 后端 | P0 | 1 | USER-01 | 模板可读可渲染；变量插值正确 | S2 |
| AIO-06 | Redis prompt 缓存层 | md5(prompt+style) 缓存候选 24h、命中跳过 LLM 调用 | 后端 | P0 | 0.5 | AIO-02 | 命中率验证；缓存命中跳过 API 调用 | S2 |
| AIO-07 | TTS Adapter 占位（火山引擎） | 接口骨架 + 火山引擎 TTS 接入（M2 视频用） | 后端 | P1 | 0.5 | AIO-01 | 接口骨架就位；可延 M2 | S2 |
| AIO-08 | Video Adapter 占位（豆包 Seedance） | 接口骨架 + 火山方舟 API 调研（M2 视频用） | 后端 | P1 | 0.5 | AIO-01 | 接口骨架就位；火山方舟 API 调研笔记 | S2 |

**小计：8.0 人日**

### 4.4 造梗工坊（CRE）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CRE-01 | creation_session 表 + 能量扣减 | creation_session 表、乐观锁扣能量、agent_mode 字段（M2 用） | 后端 | P0 | 1 | USER-01 | 并发扣能量不超扣；单测覆盖 | S3 |
| CRE-02 | BullMQ 队列 + Worker 框架 | creation_jobs 队列、Worker 进程、重试/超时/优先级、进度推送骨架 | 后端 | P0 | 1 | INF-05, CRE-01 | Worker 消费任务；失败重试 3 次 | S3 |
| CRE-03 | 文本造梗任务（3 候选） | LLM 调用、prompt 组装（模板 + 用户输入隔离）、3 候选、24h 去重、缓存 | 后端 | P0 | 1.5 | AIO-02, AIO-05, CRE-02 | 真实生成 3 候选；缓存命中；去重生效 | S3 |
| CRE-04 | 图片造梗任务（1 候选 + 再来一次） | FLUX 生成 1 候选、上传 R2、用户"再来一次"触发新候选、限频 | 后端 | P0 | 1.5 | AIO-03, CRE-02 | 生成图片落 R2；再来一次触发新图 | S3 |
| CRE-05 | 造梗接口（POST /creations） | 同步返回 creation_id + 202、客户端轮询 status | 后端 | P0 | 1 | CRE-02 | 接口返回 202；状态轮询通 | S3 |
| CRE-06 | RN 造梗工坊入口 + 模式选择 | 工坊主页、文本/图片模式切换、模板选择、风格预览 | 前端 | P0 | 1.5 | USER-11, AIO-05 | UI 完整；模式可切换 | S3 |
| CRE-07 | RN 文本造梗交互 + 候选展示 | 关键词输入、3 候选"盲盒"展示、再来一次、微调、埋点 | 前端 | P0 | 2 | CRE-05, CRE-06 | 真机生成成功；候选可挑选 | S3 |
| CRE-08 | RN 图片造梗交互 | 描述输入、风格选择、1 候选展示、再来一次、埋点 | 前端 | P0 | 1.5 | CRE-05, CRE-06 | 真机图片生成成功 | S3 |

**小计：10.0 人日**

### 4.5 梗卡内容流（MEME）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MEME-01 | meme_card + meme_embedding 表 | 表 + 索引（author/legion/hot_score/status/published_at/god_trash）、tsvector 全文索引 | 后端 | P0 | 1 | USER-01 | DDL 文档化；索引建好 | S3 |
| MEME-02 | 梗卡发布接口 + 包装流程 | POST /memes、包装（标题/标签/军团可选）、status=pending_audit、入审核队列 | 后端 | P0 | 1 | CRE-05, MEME-01, AUD-01 | 接口可发布；状态机正确 | S3 |
| MEME-03 | 推荐 feed 接口（热度召回 v1） | GET /feed、热度 ZSet Top + 新品 Top 混合、分页、多样性重排简化 | 后端 | P0 | 1.5 | MEME-05 | 返回 20 条/页；分页正确 | S4 |
| MEME-04 | 热度分 Redis ZSet + 定时 cron | recomputeHotScore 实现、每 10min cron、实时增量 ZINCRBY | 后端 | P0 | 1 | MEME-01, INF-05 | ZSet 有数据；cron 跑通 | S4 |
| MEME-05 | 梗卡详情接口 + 缓存 | GET /memes/:id、Redis 缓存 10min、CF 边缘 1min、写时失效 | 后端 | P0 | 1 | MEME-01 | 详情返回完整字段；缓存生效 | S4 |
| MEME-06 | RN 推荐 feed 页 | 瀑布流（图/文）+ 沉浸式视频卡占位（视频 M2 接入）、下拉刷新、骨架屏 | 前端 | P0 | 2 | MEME-03, USER-11 | 真机列表渲染；下拉刷新正常 | S4 |
| MEME-07 | RN 梗卡详情页 + 转发面板 | 详情页、评分入口、评论入口、转发（站内 + 站外带水印）、举报 | 前端 | P0 | 1.5 | MEME-05, RAT-04 | 详情可浏览；转发面板可用 | S4 |
| MEME-08 | 梗卡向量化 job（审核通过后） | 异步生成 embedding 入 meme_embedding（bge-small-zh / DeepSeek embedding） | 后端 | P1 | 1 | MEME-02, AIO-02 | 神梗/普通梗均可向量化；M2 推荐用 | S4 |

**小计：9.0 人日**

### 4.6 评分与评论（RAT）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RAT-01 | rating + comment 表 + 唯一约束 | rating 表（meme_id+user_id 唯一）、comment 表（parent_id 自引用） | 后端 | P0 | 0.5 | MEME-01 | DDL 文档化；唯一约束生效 | S4 |
| RAT-02 | 评分接口 + 加权计算 | POST /ratings、加权（评审官 1.5x / 新用户 0.5x / 同军团 0.8x）、24h 可改分 | 后端 | P0 | 1 | RAT-01 | 评分写入；权重计算正确 | S4 |
| RAT-03 | 神/烂梗判定 job | 评分人数 ≥ 200 触发、综合分 ≥ 4.2 且 1 星 < 15% 神梗 / ≤ 2.5 且 1 星 > 50% 烂梗、通知 + 热度调整 | 后端 | P0 | 1.5 | RAT-02, MEME-04 | 阈值触发判定；状态变更；通知发出 | S4 |
| RAT-04 | 评论接口 + 敏感词过滤 | POST /comments、DFA 敏感词过滤、可疑走阿里云、举报触发人审 | 后端 | P0 | 1 | RAT-01, AUD-02 | 评论写入；敏感词拦截 | S4 |
| RAT-05 | 转发 + 举报接口 | POST /share、POST /report、站外分享带水印 | 后端 | P0 | 1 | MEME-02 | 转发计数 +1；举报入审核队列 | S4 |
| RAT-06 | RN 评分弹层 + 评论列表 | 1-5 星弹层、神/烂梗二元选择、评论列表 + 发送、@占位 | 前端 | P0 | 1.5 | RAT-02, RAT-04, MEME-07 | 真机评分/评论可用 | S4 |
| RAT-07 | 评审官机制骨架 | 评审官标记字段 + 权重逻辑、竞选/任免 M2 接入 | 后端 | P1 | 0.5 | RAT-02 | 字段就位；权重逻辑可触发 | S4 |

**小计：7.0 人日**

### 4.7 内容安全（AUD）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-01 | 阿里云内容安全接入 | 文本审核 + 图片审核 SDK、阈值配置、结果回写 | 后端 | P0 | 1 | AIO-01 | 真实调用成功；结果落 audit_log | S3 |
| AUD-02 | 敏感词 DFA 库 + 热更新 | 开源词库 + 自建补充、DFA 匹配 + 拼音变体、运营后台热更新接口 | 后端 | P0 | 1.5 | INF-10 | 命中敏感词秒级拦截；热更新生效 | S3 |
| AUD-03 | 机审队列 + 人审入口 | BullMQ audit_jobs、可疑入人审队列（M2 后台完善）、违规驳回 + 通知 | 后端 | P0 | 1 | AUD-01, CRE-02 | 队列流转正确；驳回通知发出 | S3 |
| AUD-04 | AI 生成内容标识 | 梗卡详情页"AI 辅助创作"声明、图片角标、视频角标（M2 视频用） | 全栈 | P0 | 1 | MEME-02 | 100% AI 梗卡带标识 | S3 |
| AUD-05 | AI 调用日志留存 | prompt + 参数 + 输出落库 6 个月、与 ai_cost_log 关联 | 后端 | P0 | 0.5 | AIO-04 | 日志可查；保留策略生效 | S3 |

**小计：5.0 人日**

### 4.8 合规与备案（COMP）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COMP-01 | AIGC 备案材料草稿 | 模型来源（豆包/DeepSeek/SiliconFlow）、训练数据说明、安全评估报告、内容审核机制、用户协议与隐私政策 | 合规 | P0 | 2 | — | 草稿完成 ≥ 80%；M2 提交 | S4 |
| COMP-02 | 隐私政策 + 用户协议 v0.1 | 法务模板 + 项目定制、首次启动强制弹窗、AI 生成内容条款、未成年人条款 | 合规 | P0 | 1 | COMP-01 | 文档完成；RN 弹窗接入 | S4 |
| COMP-03 | 未成年人保护设计稿 | 青少年模式规则（40min/22-6 禁用/禁发布评分私信）、实名年龄字段 | 全栈 | P0 | 0.5 | USER-01 | 设计稿完成；字段就位；M2 实现 | S4 |
| COMP-04 | 数据加密 + 注销导出 | 手机号 AES-256 加密、用户数据导出接口、注销 30 天硬删除 | 后端 | P1 | 1 | USER-01 | 加密生效；导出/注销接口可用 | S4 |

**小计：4.5 人日**

### 4.9 客户端 RN App 收尾（APP）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| APP-01 | RN 我的页 + 设置 + 青少年模式入口 | 我的页（资料/勋章/作品 Tab 占位）、设置、青少年模式入口（M2 实现） | 前端 | P0 | 1.5 | USER-13 | 我的页渲染；设置可访问 | S4 |
| APP-02 | RN 消息 Tab 占位 + 系统通知 | Tab 占位、系统通知列表（私聊/群聊 M2 接入） | 前端 | P1 | 1 | USER-11 | 占位页就位；系统通知可读 | S4 |
| APP-03 | RN 军团 Tab 占位 | Tab 占位（军团广场/主页 M2 接入） | 前端 | P1 | 0.5 | USER-11 | 占位页就位 | S4 |
| APP-04 | Expo Update 热更新通道 | EAS Build/Submit、Expo Update 配置、灰度发布骨架 | 全栈 | P0 | 1 | USER-10 | OTA 更新链路验证 | S4 |
| APP-05 | 弱网/骨架屏/LQIP | 网络层重试、骨架屏、图片 LQIP + WebP、视频首帧预加载（M2 视频用） | 前端 | P1 | 1 | USER-10 | 弱网体验验证 | S4 |

**小计：5.0 人日**

### 4.10 Web 端 + 后台（WEB）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WEB-01 | Next.js Web 落地页 | 首页 + 下载引导 + 隐私政策/用户协议展示页 | 前端 | P0 | 1 | INF-11 | 落地页部署 Vercel | S1 |
| WEB-02 | Next.js Admin shell | 后台登录 + 布局 + 路由骨架（审核队列/PK/看板 M2 接入） | 前端 | P0 | 1.5 | INF-11, USER-02 | Admin 登录通；骨架可导航 | S2 |
| WEB-03 | Admin 用户管理 v0 | 用户列表 + 封禁/解禁（M2 完善审核队列 + 看板） | 全栈 | P1 | 1 | WEB-02 | 可查询用户；封禁生效 | S4 |

**小计：3.5 人日**

### 4.11 监控埋点（TRK）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TRK-01 | Tracker SDK 封装 + PostHog 接入 | 客户端 `track(name, props)`、关键事件双写 PostHog + 自建 analytics_event | 全栈 | P0 | 1 | INF-08 | SDK 可调用；PostHog 收到事件 | S2 |
| TRK-02 | 17 关键事件埋点（M1 子集 12 个） | app_launch / login_success / meme_create_start/success / meme_publish / meme_view / meme_score / meme_comment / meme_share / god_meme_trigger / trash_meme_trigger / report | 全栈 | P0 | 1.5 | TRK-01 | 12 个事件在 PostHog 看板可见 | S4 |
| TRK-03 | 自建 analytics_event 表 + 看板骨架 | analytics_event 表 + Admin 看板骨架（M2 完善数据看板） | 全栈 | P1 | 1 | TRK-01 | 事件入库；看板骨架可访问 | S4 |

**小计：3.5 人日**

### 4.12 文档与 Demo（DOC）

| 任务ID | 任务名 | 描述 | 类型 | 优先级 | 工时 | 依赖 | 验收标准 | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DOC-01 | OpenAPI 接口文档 | Swagger 自动生成 + 手动补充、覆盖 M1 全部接口 | 后端 | P0 | 1 | INF-10 | Swagger UI 完整可读 | S4 |
| DOC-02 | DB DDL 文档 | 所有 M1 表 + 索引 + 约束文档化 | 后端 | P0 | 0.5 | USER-01, MEME-01, RAT-01 | DDL markdown 完成 | S4 |
| DOC-03 | M1 Demo + Sprint Review | 端到端演示视频 + Review 记录 + M2 backlog 初稿 | 全栈 | P0 | 1 | — | Demo 视频产出；M2 backlog 草稿 | S4 |
| DOC-04 | 部署 runbook | staging/prod 部署步骤、回滚、应急预案 | 运维 | P1 | 0.5 | INF-07 | runbook 完成 | S4 |

**小计：3.0 人日**

---

## 5. 甘特图 / 时间线（M1 4 周）

```mermaid
gantt
    title 梗星球 M1 Sprint 时间线（2026-07-08 ~ 2026-08-04）
    dateFormat  YYYY-MM-DD
    axisFormat  %m-%d
    weekday     Monday Tuesday Wednesday Thursday Friday Saturday Sunday

    section S1 基础设施
    域名+ICP备案启动 INF-01          :a1, 2026-07-08, 1d
    轻量云采购 INF-02                :a2, 2026-07-08, 1d
    Docker 环境 INF-03               :a3, after a2, 1d
    PG+pgvector INF-04               :a4, after a3, 1d
    Redis INF-05                     :a5, after a3, 1d
    Cloudflare+R2+CDN INF-06         :a6, after a1, 1d
    CI/CD INF-07                     :a7, after a3, 2d
    监控接入 INF-08                  :a8, 2026-07-08, 1d
    Supabase Auth INF-09             :a9, 2026-07-09, 1d
    NestJS 脚手架 INF-10             :a10, after a4, 2d
    packages/shared INF-11           :a11, after a10, 1d
    .env+Secrets INF-12              :a12, after a7, 1d
    Web 落地页 WEB-01                :w1, after a11, 1d

    section S2 用户+AI 编排
    DB schema user USER-01           :b1, 2026-07-15, 1d
    Supabase JWT 中间件 USER-02      :b2, after b1, 2d
    手机号登录 USER-03               :b3, after b2, 2d
    OAuth 登录 USER-04               :b4, after b2, 2d
    Webhook 同步 USER-05             :b5, after b2, 1d
    兴趣标签 USER-06                 :b6, after b1, 1d
    个人主页接口 USER-07             :b7, after b1, 1d
    梗力值/等级 USER-08              :b8, after b1, 1d
    勋章框架 USER-09                 :b9, after b1, 1d
    RN App 框架 USER-10              :b10, after a11, 2d
    RN 登录页 USER-11                :b11, after b3, 2d
    RN 兴趣选择 USER-12              :b12, after b6, 1d
    AIOrch 抽象 AIO-01               :c1, after a10, 1d
    LLM Adapter AIO-02               :c2, after c1, 2d
    Image Adapter AIO-03             :c3, after c1, 2d
    Policy Engine AIO-04             :c4, after c1, 2d
    Prompt 模板 AIO-05               :c5, after b1, 1d
    Redis prompt 缓存 AIO-06         :c6, after c2, 1d
    TTS Adapter 占位 AIO-07          :c7, after c1, 1d
    Video Adapter 占位 AIO-08        :c8, after c1, 1d
    Admin shell WEB-02               :w2, after b2, 2d
    Tracker SDK TRK-01               :t1, after a8, 1d

    section S3 造梗+梗卡+审核
    creation_session CRE-01          :d1, 2026-07-22, 1d
    BullMQ Worker CRE-02             :d2, after d1, 1d
    文本造梗任务 CRE-03              :d3, after d2, 2d
    图片造梗任务 CRE-04              :d4, after d2, 2d
    造梗接口 CRE-05                  :d5, after d2, 1d
    RN 工坊入口 CRE-06               :d6, after b11, 2d
    RN 文本造梗 CRE-07               :d7, after d5, 2d
    RN 图片造梗 CRE-08               :d8, after d5, 2d
    meme_card 表 MEME-01             :e1, after b1, 1d
    梗卡发布接口 MEME-02             :e2, after e1, 1d
    阿里云内容安全 AUD-01            :f1, after c1, 1d
    敏感词 DFA AUD-02                :f2, after a10, 2d
    机审队列 AUD-03                  :f3, after f1, 1d
    AI 生成标识 AUD-04               :f4, after e2, 1d
    AI 调用日志 AUD-05               :f5, after c4, 1d
    RN 个人主页 USER-13              :b13, after b7, 2d

    section S4 评分+收尾+Demo
    推荐 feed MEME-03                :e3, 2026-07-29, 2d
    热度分 ZSet MEME-04              :e4, after e1, 1d
    梗卡详情 MEME-05                 :e5, after e1, 1d
    RN feed 页 MEME-06               :e6, after e3, 2d
    RN 梗卡详情 MEME-07              :e7, after e5, 2d
    梗卡向量化 MEME-08               :e8, after e2, 1d
    rating+comment 表 RAT-01         :g1, after e1, 1d
    评分接口 RAT-02                  :g2, after g1, 1d
    神/烂梗判定 RAT-03               :g3, after g2, 2d
    评论接口 RAT-04                  :g4, after g1, 1d
    转发举报 RAT-05                  :g5, after e2, 1d
    RN 评分弹层 RAT-06               :g6, after g2, 2d
    评审官骨架 RAT-07                :g7, after g2, 1d
    RN 我的页 APP-01                 :h1, after b13, 2d
    RN 消息占位 APP-02               :h2, after b11, 1d
    RN 军团占位 APP-03               :h3, after b11, 1d
    Expo Update APP-04               :h4, after b10, 1d
    弱网/骨架屏 APP-05               :h5, after b10, 1d
    Admin 用户管理 WEB-03            :w3, after w2, 1d
    17 事件埋点 TRK-02               :t2, after t1, 2d
    analytics 看板 TRK-03            :t3, after t1, 1d
    AIGC 备案材料 COMP-01            :k1, 2026-07-29, 3d
    隐私政策+协议 COMP-02            :k2, after k1, 1d
    未成年人保护 COMP-03             :k3, after b1, 1d
    数据加密+注销 COMP-04            :k4, after b1, 1d
    OpenAPI 文档 DOC-01              :m1, after a10, 1d
    DB DDL 文档 DOC-02               :m2, after e1, 1d
    M1 Demo DOC-03                   :m3, 2026-08-04, 1d
    部署 runbook DOC-04              :m4, after a7, 1d
```

---

## 6. 关键路径与风险

### 6.1 关键路径（CPM）

M1 关键路径（任一延迟即拖累 M1 Demo）：

```
INF-02 → INF-03 → INF-04 → INF-10（NestJS 骨架）
  → USER-01 → USER-02 → USER-03/04（登录）
  → AIO-01 → AIO-02/03（AI Adapter）
  → CRE-01 → CRE-02 → CRE-03/04（造梗任务）
  → MEME-01 → MEME-02（梗卡发布）
  → AUD-01/03（机审）
  → MEME-03/05（feed + 详情）
  → RAT-02/03（评分 + 神烂梗判定）
  → RAT-06（RN 评分弹层）
  → DOC-03（M1 Demo）
```

**关键路径上的"高危节点"**（延迟 1 天即拖累整体）：

1. **INF-09 Supabase Auth + USER-02 JWT 中间件**：Supabase 国内访问慢 + Webhook 同步是国内 PG 部署的成败点。
2. **AIO-02/03 LLM/Image Adapter**：真实 API key 申请、计费、网络稳定，任一卡住都直接断造梗闭环。
3. **CRE-03 文本造梗**：第一次跑通 LLM → 候选 → 发布端到端链路。
4. **AUD-01 阿里云内容安全**：免费额度申请 + SDK 接入 + 与发布流程耦合。
5. **RAT-03 神/烂梗判定**：阈值 200 评分需要造测试数据，验收依赖前序所有链路。

### 6.2 风险与缓解

| 风险 | 等级 | 影响 | 缓解 |
| --- | --- | --- | --- |
| ICP 备案 7~20 天延迟，staging 无法国内访问 | 中 | 开发体验差 | 备案期间用 Cloudflare 边缘 + 海外节点跑预览，仅 dev/staging 受影响，prod 等备案下来 |
| Supabase 国内访问慢导致登录/同步延迟 | 中 | 用户体验 | Cloudflare Workers 反代 Supabase；关键数据迁回国内 PG；Webhook 异步 |
| AI Provider key 申请/计费/限流踩坑 | 高 | 造梗链路断 | M1 第一周就申请 DeepSeek/GLM/SiliconFlow/通义/阿里云内容安全全部 key；先小额度跑通再扩量 |
| 个人开发者工时不足（P0 总和偏高） | 高 | M1 范围无法完成 | 见 §7 工时汇总与"必砍/可延"建议 |
| AI 生成质量不稳定影响 Demo | 中 | 演示效果差 | Prompt 模板预设 + 多候选 + 手动挑选；Demo 用脚本化输入 |
| 自建 NestJS 模块过多导致骨架臃肿 | 中 | 开发效率下降 | M1 仅做必要 Module 的实际实现，其余 Module 只建空文件占位 |
| RN + Expo 环境/EAS Build 踩坑 | 中 | 客户端延迟 | S1 先跑通 Expo hello world；EAS 配置提前到 S1 末 |
| 阿里云内容安全免费额度申请延迟 | 中 | 审核链路断 | 备选易盾免费试用 + 自建敏感词为主，第三方仅可疑走 API |
| AIGC 备案材料准备不足 | 中 | M2 提交延迟 | M1 S4 集中攻坚 + 复用豆包已备案模型作为支撑材料 |
| 单机部署无 HA，staging 宕机 | 低 | 开发中断 | MVP 接受；每日备份；Sentry/UptimeRobot 告警 |

---

## 7. M1 工时汇总与可行性判断

### 7.1 按类型汇总（P0 + P1）

| 模块 | P0 工时 | P1 工时 | 合计 |
| --- | --- | --- | --- |
| 基础设施 INF | 10.0 | 0 | 10.0 |
| 用户系统 USER | 13.5 | 0 | 13.5 |
| AI 编排 AIO | 7.5 | 1.0 | 8.5 |
| 造梗工坊 CRE | 10.0 | 0 | 10.0 |
| 梗卡内容 MEME | 8.0 | 1.0 | 9.0 |
| 评分评论 RAT | 6.5 | 0.5 | 7.0 |
| 内容安全 AUD | 5.0 | 0 | 5.0 |
| 合规备案 COMP | 3.5 | 1.0 | 4.5 |
| 客户端 APP | 2.5 | 2.5 | 5.0 |
| Web/Admin WEB | 2.5 | 1.0 | 3.5 |
| 监控埋点 TRK | 2.5 | 1.0 | 3.5 |
| 文档 Demo DOC | 2.5 | 0.5 | 3.0 |
| **合计** | **74.0** | **8.5** | **82.5** |

### 7.2 个人开发者 1 个月产能评估

- 个人开发者 1 个月有效工时：**约 22 人日**（4 周 × 5.5d/周，扣除 buffer/会议/运维）。
- M1 P0 工时：**74.0 人日**，P1 + 8.5 人日，合计 **82.5 人日**。
- **缺口**：P0 缺口 ~52 人日（约 2.4 倍产能），**1 个人 1 个月绝对做不完**。

### 7.3 必砍 / 可延建议（按优先级降序）

> 目标：把 M1 P0 压到 ~22~25 人日，确保 M1 闭环可演示。下列"必砍"项从 M1 P0 降级到 M2 P0。

| 建议 | 任务 | 原计划 | 调整后 | 节省 |
| --- | --- | --- | --- | --- |
| **必砍 1：图片造梗整链路延 M2** | CRE-04, CRE-08, AIO-03 | M1 P0 (4.0d) | M2 P0 | 4.0d |
| **必砍 2：神/烂梗判定延 M2（M1 仅留评分接口 + 阈值占位）** | RAT-03 | M1 P0 (1.5d) | M2 P0 | 1.5d |
| **必砍 3：RN 个人主页编辑资料延 M2（M1 仅只读主页）** | USER-13 拆分 | M1 P0 (2.0d) | M1 只读 1.0d + M2 编辑 1.0d | 1.0d |
| **必砍 4：转发 + 举报延 M2（M1 仅评分 + 评论）** | RAT-05, MEME-07 转发部分 | M1 P0 (1.0d + 0.5d) | M2 P0 | 1.5d |
| **必砍 5：OAuth 登录延 M2（M1 仅手机号 + 邮箱）** | USER-04 | M1 P0 (1.5d) | M2 P0 | 1.5d |
| **必砍 6：勋章框架延 M2（M1 仅留字段）** | USER-09 | M1 P0 (1.0d) | M1 字段 0.3d + M2 框架 0.7d | 0.7d |
| **必砍 7：梗力值衰减规则延 M2（M1 仅基础计算）** | USER-08 简化 | M1 P0 (1.0d) | M1 0.5d + M2 0.5d | 0.5d |
| **必砍 8：Webhook 同步改轮询（M1 简化）** | USER-05 | M1 P0 (1.0d) | M1 0.5d + M2 0.5d | 0.5d |
| **必砍 9：Admin shell 仅留登录页（不做骨架导航）** | WEB-02 简化 | M1 P0 (1.5d) | M1 0.5d + M2 1.0d | 1.0d |
| **必砍 10：17 事件埋点缩减到 8 个核心事件** | TRK-02 | M1 P0 (1.5d) | M1 0.8d + M2 0.7d | 0.7d |
| **必砍 11：Expo Update / EAS 配置延 S4 末或 M2** | APP-04 | M1 P0 (1.0d) | M2 P0 | 1.0d |
| **必砍 12：OpenAPI 文档自动生成即可（不手动补充）** | DOC-01 简化 | M1 P0 (1.0d) | M1 0.3d | 0.7d |
| **可延 13：TTS/Video Adapter 占位直接延 M2** | AIO-07, AIO-08 | M1 P1 (1.0d) | M2 | 1.0d |
| **可延 14：梗卡向量化延 M2（M1 没有神梗数据）** | MEME-08 | M1 P1 (1.0d) | M2 | 1.0d |
| **可延 15：评审官骨架延 M2** | RAT-07 | M1 P1 (0.5d) | M2 | 0.5d |
| **可延 16：Admin 用户管理延 M2** | WEB-03 | M1 P1 (1.0d) | M2 | 1.0d |
| **可延 17：analytics 看板延 M2** | TRK-03 | M1 P1 (1.0d) | M2 | 1.0d |
| **可延 18：数据加密 + 注销导出延 M2** | COMP-04 | M1 P1 (1.0d) | M2 | 1.0d |
| **可延 19：部署 runbook 延 M2** | DOC-04 | M1 P1 (0.5d) | M2 | 0.5d |
| **可延 20：弱网/骨架屏/LQIP 延 M2** | APP-05 | M1 P1 (1.0d) | M2 | 1.0d |

**砍后 M1 P0 工时**：约 **74.0 - 14.7 = 59.3 人日** 仍超产能 → 需进一步并行/加班/M2 借力。

**最终建议**：M1 实际承载 **25 人日核心闭环**（基础设施精简 + 用户系统手机号登录 + AI 编排 LLM + 文本造梗 + 梗卡发布 + 机审 + feed + 评分评论 + RN 基础页 + 合规草稿），其余全部明确推到 M2，M2 承载量从原计划下调一些到 M3。

**结论**：

- 个人开发者 1 个月**无法完成** M1 全 P0 范围（74 人日 vs 22 人日产能）。
- **必砍建议**：图片造梗、神/烂梗判定、转发举报、OAuth、Webhook、Admin shell、Expo Update、文档手动补充等延 M2；M1 聚焦"手机号登录 + 文本造梗 + 梗卡发布 + 机审 + feed + 评分评论"端到端可演示闭环。
- 砍后 M1 工时 ~25 人日，与 1 个月产能匹配，Demo 可成。
- M2 承载量需重新评估，可能需要把视频/军团/PK 进一步推到 M3，M3 灰度上线推迟 0.5 个月。

---

## 8. M1 退出标准（Exit Criteria Checklist）

> M1 结束（2026-08-04）时必须满足下列清单，方可判定 M1 完成、进入 M2。

### 基础设施

- [ ] 域名已注册，ICP 备案已提交并受理。
- [ ] 轻量云 2C2G 已就绪，docker-compose 跑通 NestJS + PG + Redis。
- [ ] PG16 + pgvector 扩展启用，每日备份脚本 cron 运行 ≥ 1 次。
- [ ] Redis 7 启用 AOF，密码保护。
- [ ] Cloudflare CDN + R2 桶可用，图片可上传访问。
- [ ] GitHub Actions CI/CD：PR 触发 lint+typecheck+test，main 自动部署 staging。
- [ ] Sentry / UptimeRobot / PostHog 接收真实事件。
- [ ] Supabase 项目就绪，Auth 手机号 + 邮箱登录可用。
- [ ] NestJS 模块化单体骨架（15 Module 占位）+ Swagger UI 可访问。
- [ ] `packages/shared` 三端共享包可被 app/web 引用。
- [ ] `.env` 模板与 GitHub Secrets 已配置。

### 用户系统

- [ ] 手机号验证码登录全链路通（短信真实下发、JWT 签发）。
- [ ] 兴趣标签选择接口 + RN 选择页可用。
- [ ] 个人主页只读接口 + RN 只读主页可用。
- [ ] 梗力值/等级基础计算 service + 单测。
- [ ] 能量字段就位，扣减乐观锁单测通过。

### AI 编排层

- [ ] LLM Adapter（DeepSeek V3 主 + GLM-4-Flash 兜底）真实调用成功 + 自动降级演练通过。
- [ ] Policy Engine：日预算熔断触发一次演练，`ai_cost_log` 写入。
- [ ] Prompt 模板表 + 5 个官方模板种子可读可渲染。
- [ ] Redis prompt 缓存层命中率验证。

### 造梗工坊

- [ ] creation_session 表 + BullMQ 队列 + Worker 框架就绪。
- [ ] 文本造梗任务（3 候选）真实跑通，24h prompt 去重生效。
- [ ] RN 文本造梗交互真机可用（生成 → 候选展示 → 挑选）。

### 梗卡内容流

- [ ] meme_card 表 + 索引建好。
- [ ] 梗卡发布接口（pending_audit → published）状态机正确。
- [ ] 推荐 feed 接口（热度召回 v1）返回 20 条/页。
- [ ] 热度分 Redis ZSet + 每 10min cron 跑通。
- [ ] 梗卡详情接口 + Redis 缓存生效。
- [ ] RN feed 瀑布流 + RN 梗卡详情页真机可用。

### 评分评论

- [ ] rating + comment 表 + 唯一约束。
- [ ] 评分接口 + 加权计算（评审官/新用户/同军团权重）单测覆盖。
- [ ] 评论接口 + 敏感词 DFA 过滤生效。
- [ ] RN 评分弹层 + 评论列表真机可用。
- [ ] 神/烂梗判定 job（按砍后计划可延 M2，则 M1 仅留阈值占位 + 接口骨架）。

### 内容安全

- [ ] 阿里云内容安全（文本 + 图片）接入，真实拦截验证。
- [ ] 敏感词 DFA 库 + 热更新接口。
- [ ] 机审队列流转正确（pending → pass/manual_review/rejected）。
- [ ] AI 生成梗卡 100% 带"AI 辅助创作"声明 + 图片角标。
- [ ] AI 调用日志（prompt + 输出）落库 6 个月保留策略。

### 合规

- [ ] AIGC 备案材料草稿完成 ≥ 80%（M2 提交）。
- [ ] 隐私政策 + 用户协议 v0.1 完成，RN 首次启动弹窗接入。
- [ ] 未成年人保护设计稿完成（M2 实现）。

### 客户端

- [ ] RN App 5 Tab 导航就位。
- [ ] 登录页 / 兴趣选择 / 主页 / 造梗工坊 / feed / 梗卡详情 / 评分评论 真机可用。
- [ ] 我的页 + 设置 + 青少年模式入口占位。
- [ ] 消息 Tab / 军团 Tab 占位（M2 接入）。

### Web / 后台

- [ ] Next.js Web 落地页部署 Vercel，含隐私政策/用户协议展示。
- [ ] Admin shell 登录页可用（详细审核/看板 M2）。

### 监控埋点

- [ ] Tracker SDK 封装 + PostHog 接入。
- [ ] 至少 8 个核心事件（app_launch / login_success / meme_create_start / meme_create_success / meme_publish / meme_view / meme_score / meme_comment）在 PostHog 看板可见。

### 文档与 Demo

- [ ] OpenAPI 接口文档（Swagger 自动生成）覆盖 M1 全部接口。
- [ ] DB DDL 文档完成（M1 全部表 + 索引 + 约束）。
- [ ] M1 Demo 视频产出（端到端演示：登录 → 文本造梗 → 发布 → feed → 评分评论）。
- [ ] M2 backlog 初稿完成。

### 工时

- [ ] M1 P0（砍后）任务完成 ≥ 90%。
- [ ] Sprint Review + Retrospective 记录 4 份（S1~S4）。

---

## 9. M2 预告

**M2（第 2 个月，2026-08-05 ~ 2026-09-01）**：在 M1 闭环之上叠加 **军团（Legion）CRUD + 成员 + 群聊**、**PK（投票 PK + 造梗对决）**、**私聊 + 军团群聊 IM（Supabase Realtime + 自建 WebSocket）**、**AI 视频生成（豆包 Seedance 2.0 mini + 图片 TTS 兜底）**、**Pro 造梗 Agent（3 步精简版）+ RAG 造梗知识库**、**Pro 会员 + 微信支付 + 视频按次包**、**完整运营后台（审核队列 + PK 运营 + 数据看板）**、**推荐向量召回 + LR 排序**、**图片造梗补齐 + 神/烂梗判定补齐 + OAuth 补齐**，形成 MVP 全功能集（除灰度上线外），M2 末再做一次全链路 Demo。

---

> 本文档为 M1 Sprint 执行依据，每周 Sprint Review 时根据进度滚动调整 M2 backlog。如遇关键路径阻塞（Supabase/AI Provider/备案），优先保 M1 端到端闭环可演示，其余 stretch 全部下沉 M2。
