# 「梗星球」MemeChatAI 技术架构设计文档

> 内部技术设计文档 · 与 PRD v1.1.0 对应

---

## 1. 文档信息

| 项目 | 内容 |
| --- | --- |
| 项目名称 | 梗星球（MemeChatAI，内部代号 `MEME-X`） |
| 文档版本 | v1.1.0（技术选型评审定稿版） |
| 作者 | 技术架构 / 个人开发者视角 |
| 创建日期 | 2026-07-07 |
| 当前状态 | 技术选型已定稿，进入详细设计 |
| 关联文档 | [PRD.md](./PRD.md) v1.1.0、视觉规范 v1.0、社区治理白皮书、AI 内容生成合规指引、数据埋点字典 v1.0 |
| 适用规模 | MVP 阶段 DAU 1w 量级（个人开发者预算） |
| 设计原则 | 成本最优、按需扩展、AI 能力可插拔、合规先行 |
| 变更记录 | 2026-07-07 v1.0 首版；2026-07-07 v1.1 客户端选型调整为 RN+Expo（MVP）/ Flutter（v2.0 候选），新增 §8.6 Agent 与算法体系，AI 造梗 Agent 限 Pro 会员；视频生成模型定稿为字节豆包 Seedance 2.0 mini（主力）+ 标准版（Pro 高端）+ SiliconFlow/即梦 fallback，视频配额调整为免费 1次/周·Pro 3次/日（对齐豆包成本现实）；Pro 会员定价定稿 ¥18/月 + 视频按次包；数据部署定稿为主数据国内自建 PG + Supabase 仅做 Auth/Realtime；AIGC 备案定稿为上线 gate；IM 方案定稿为 Supabase Realtime（私聊）+ 自建 WebSocket（群聊）；后端 Go 渐进路线确认（MVP 全 NestJS，PK 服务未来按需迁 Go） |

---

## 2. 项目背景与目标

### 2.1 产品目标（复述）

梗星球 = **AI 造梗 + 内容评分社区 + 阵营化社交 + 实时聊天** 四合一，以"梗卡"为最小内容单元，构建"造梗 → 评分 → 神梗/烂梗判定 → 军团 PK"的内容生产与对抗闭环。详见 PRD §2。

### 2.2 技术目标

| 目标 | 说明 | 量化指标 |
| --- | --- | --- |
| **低成本** | 个体开发者预算，最大化免费额度，月运营成本控制在数百元量级 | MVP 月成本 ≤ ¥500（DAU 1w） |
| **可扩展** | 模块化单体起步，关键路径（AI 生成、PK 投票）可水平扩展 | 单服务可独立抽离为微服务 |
| **AI 能力集成** | 统一抽象 LLM / 图像 / 视频模型，支持多供应商切换与降级 | 切换模型 ≤ 1 个配置项 |
| **内容安全** | 双重审核 + AI 生成标识合规，符合《生成式 AI 服务管理办法》 | 100% AI 生成内容带标识 |
| **实时性** | IM、PK 实时比分、通知低延迟 | 消息 P95 ≤ 500ms |
| **高并发准备** | PK 投票峰值可削峰填谷 | 单场 PK QPS ≥ 1k 可承受 |

### 2.3 关键约束

- **预算极度有限**：后端/登录/模型服务"能免费就免费，不能免费就用最便宜方案"。
- **国内访问**：用户主体在国内，需考虑备案、CDN、低延迟。
- **合规**：AI 生成内容必须可标识、可追溯；未成年人保护强制。
- **人力**：1 人开发，要求技术栈统一、运维负担低。

---

## 3. 整体架构设计

### 3.1 架构总览图

```mermaid
flowchart TB
    subgraph 客户端
        APP[移动 App<br/>React Native + Expo]
        WEB[Web 端<br/>Next.js]
        ADMIN[运营后台<br/>Next.js Admin]
    end

    subgraph 网关层
        CF[Cloudflare<br/>CDN + WAF + 缓存]
        APIGW[API 网关<br/>Nginx / Cloudflare Workers]
    end

    subgraph 业务服务层 模块化单体
        AUTH[认证服务]
        USER[用户服务]
        MEME[梗卡服务]
        LEGION[军团服务]
        PK[PK 服务]
        CHAT[消息服务]
        RECO[推荐服务]
        AUDIT[审核服务]
        ADMIN_SVC[运营服务]
    end

    subgraph 异步任务
        QUEUE[消息队列<br/>Redis Streams / BullMQ]
        WORKER[异步 Worker<br/>AI 生成 / 审核 / 结算]
    end

    subgraph 数据层
        PG[(PostgreSQL<br/>Supabase / 自建)]
        REDIS[(Redis<br/>缓存 + 计数 + ZSet)]
        VEC[(向量库<br/>pgvector)]
        OSS[(对象存储<br/>Cloudflare R2)]
    end

    subgraph AI 服务层
        AI_ORCH[AI 编排层<br/>统一抽象]
        LLM[LLM<br/>DeepSeek / GLM / Kimi]
        IMG[图像模型<br/>SiliconFlow / 通义万相]
        VID[视频模型<br/>可灵 / 即梦 / SiliconFlow]
        TTS[TTS<br/>火山引擎 / 字节]
    end

    subgraph 第三方
        SMS[短信服务]
        AUTH_PROVIDER[Supabase Auth / 微信/Apple]
        AUDIT_API[内容安全 API<br/>阿里云 / 易盾]
        PUSH[FCM / APNs / OneSignal]
        ANALYTICS[PostHog / Umami]
    end

    APP --> CF
    WEB --> CF
    ADMIN --> CF
    CF --> APIGW
    APIGW --> AUTH & USER & MEME & LEGION & PK & CHAT & RECO & AUDIT & ADMIN_SVC
    AUTH --> AUTH_PROVIDER
    USER --> SMS
    MEME --> AI_ORCH
    MEME --> AUDIT_API
    PK --> REDIS
    CHAT --> REDIS
    RECO --> VEC
    AUTH & USER & MEME & LEGION & PK & CHAT & RECO & AUDIT --> PG
    AUTH & USER & MEME & LEGION & PK & CHAT & RECO & AUDIT --> REDIS
    MEME & AUDIT --> QUEUE
    QUEUE --> WORKER
    WORKER --> AI_ORCH
    WORKER --> AUDIT_API
    AI_ORCH --> LLM & IMG & VID & TTS
    LLM & IMG & VID & TTS --> OSS
    WORKER --> OSS
    ADMIN_SVC --> ANALYTICS
    CHAT --> PUSH
```

### 3.2 技术选型总表

| 层 | 选型 | 理由 | 月成本估算（DAU 1w） |
| --- | --- | --- | --- |
| **前端 App** | **React Native + Expo（MVP 主力）**；v2.0 候选用 Flutter 重写 | MVP 全栈 TS 复用最大化、Expo Update 热更新绕过商店审核、AI/视频插件生态成熟；v2.0 若 PK 动画质感成为核心卖点再评估 Flutter 迁移 | ¥0（开源） |
| **Web/后台** | Next.js 14 + Tailwind + shadcn/ui | 生态成熟，可部署 Vercel 免费档；后台快速搭建 | ¥0 |
| **后端框架** | NestJS（Node.js）+ TypeScript | 与前端同语言，模块化清晰， decorator + DI 适合模块化单体；个人维护成本最低 | ¥0 |
| **数据库** | PostgreSQL（Supabase 免费档 / 自建）+ pgvector | 关系型 + 向量库一体，免运维；Supabase 免费档 500MB + 50 连接 | ¥0~¥80 |
| **缓存** | Redis（Upstash 免费档 / 自建） | ZSet 排行榜、PK 计数、限流、会话；Upstash 每天 10k 命令免费 | ¥0~¥60 |
| **消息队列** | Redis Streams / BullMQ | 与 Redis 复用，无额外组件；满足 MVP 异步任务需求 | ¥0 |
| **对象存储** | Cloudflare R2 | **出流量免费**（关键优势），S3 兼容；10GB 免费 | ¥0 |
| **CDN** | Cloudflare | 全球 CDN 免费档，与 R2 联动 | ¥0 |
| **搜索** | PostgreSQL Full-Text + pgvector | MVP 不引入 ES，PG 自带全文检索够用 | ¥0 |
| **AI 编排** | 自建抽象层（TypeScript） | 统一接口，便于切换供应商与降级 | ¥0 |
| **LLM** | DeepSeek V3 主 + GLM-4 Flash fallback | DeepSeek 极便宜（约 ¥1/M tokens），GLM 有免费额度 | ¥50~¥150 |
| **图像生成** | SiliconFlow FLUX/SD3 主 + 通义万相 fallback | SiliconFlow 有免费额度 + 极低价；通义万相新用户额度 | ¥30~¥100 |
| **视频生成** | **字节豆包 Seedance 2.0 mini（MVP 主力）** / Seedance 2.0 标准版（Pro 高端） / SiliconFlow fallback | 豆包质量好、字节生态、合规友好；mini 性价比档 + 图片TTS兜底控成本；详见 §4.7 | ¥3000~¥15000 |
| **TTS** | 火山引擎 TTS / 字节云 | 4 种音色，按字符计费极低 | ¥20~¥50 |
| **认证** | Supabase Auth + 自建 JWT | Supabase Auth 免费档 50k MAU，含手机号/微信/Apple OAuth | ¥0 |
| **IM** | Supabase Realtime + 自建 WebSocket fallback | Supabase Realtime 免费档含广播/Presence；MVP 够用 | ¥0 |
| **推送** | OneSignal 免费档 | 无限推送免费，跨平台 | ¥0 |
| **监控** | Sentry 免费档 + UptimeRobot + PostHog 免费档 | Sentry 5k 错误/月免费；PostHog 1M 事件/月免费 | ¥0 |
| **埋点** | PostHog 免费档 / Umami 自部署 | PostHog 含漏斗/留存/AB；Umami 隐私友好可自部署 | ¥0 |
| **CI/CD** | GitHub Actions | 公开仓无限分钟，私有仓 2000 分钟/月免费 | ¥0 |
| **部署** | 国内轻量云（2C2G ¥50/月）+ Cloudflare 边缘 | 国内访问低延迟 + 边缘静态加速 | ¥50 |
| **内容安全** | 阿里云内容安全 + 易盾免费试用 | 阿里云文本图片各 10w 次/月免费额度 | ¥0~¥50 |

**MVP 月成本合计估算：¥250 ~ ¥1040**，详见 §4.10。

---

## 4. 成本最优方案选型（重点章节）

> 本章逐项给出选型对比、推荐与成本估算。所有价格按 2026 年 7 月公开定价，按 DAU 1w 量级测算。

### 4.1 登录/认证

| 方案 | 优势 | 劣势 | 成本 | 推荐 |
| --- | --- | --- | --- | --- |
| **Supabase Auth** | 免费 50k MAU；内置手机号/邮箱/OAuth（微信/Apple/QQ）；与 PG 集成；RLS 行级权限 | 国内访问需走代理；短信需自配 | ¥0（MAU<50k） | ⭐ **MVP 推荐** |
| Clerk | 开发体验好，组件齐全 | 免费档仅 10k MAU，超量 $25+/月 | ¥0~¥200 | 备选 |
| 自建 JWT + 短信验证码 | 完全可控，无第三方依赖 | 需自己写 OAuth、安全风险高、短信费钱 | 短信 ¥0.05/条 ≈ ¥500/月（1w 新注册） | 不推荐 MVP |
| Firebase Auth | 免费，集成简单 | 国内访问不稳定 | ¥0 | 不推荐（合规） |

**推荐组合**：Supabase Auth（OAuth + 邮箱）+ 国内短信验证码（用腾讯云/阿里云短信，新用户赠送额度，后续 ¥0.045/条，仅老用户换机时触发，月成本可控）。

**国内访问策略**：Supabase 项目部署在新加坡/东京区域，Cloudflare 边缘代理加速；MVP 期可接受 200~400ms 登录延迟。

### 4.2 后端服务部署

| 方案 | 月成本 | 优势 | 劣势 | 推荐 |
| --- | --- | --- | --- | --- |
| **国内轻量云 2C2G** | ¥50 | 备案后国内访问 < 30ms；可跑完整后端 + Redis + PG | 需备案（约 20 天）；单点风险 | ⭐ **MVP 主力** |
| Cloudflare Workers | ¥0（10w 请求/天免费） | 全球边缘，免备案，免费额度大 | 不适合长任务（CPU 时长限制）；PG 连接难 | ⭐ **API 网关 + 静态** |
| Vercel Serverless | ¥0（Hobby 档） | Next.js 原生部署，CI/CD 顺滑 | 国内访问慢；函数冷启动 | Web 端 / 后台 |
| 腾讯云函数 SCF | ¥0（100w 次/月免费） | 国内访问快，免费额度大 | 冷启动；调试复杂 | 备选 |
| 阿里云函数计算 FC | ¥0（同上） | 同上 | 同上 | 备选 |

**推荐方案**：**双部署**
- **国内轻量云（2C2G ¥50/月，腾讯云/阿里云）**：跑 NestJS 主业务 + Redis + 自建 PG，备案后国内访问快。
- **Cloudflare Workers / Vercel**：Web 端、运营后台、API 边缘缓存。
- 起步用单台轻量云，后续流量上来再加一台。

**备案建议**：MVP 立即启动 ICP 备案（个人备案需 7~20 天），同步开发，备案下来前用 Cloudflare 边缘 + 海外节点跑预览。

### 4.3 数据库

| 方案 | 免费档 | 优势 | 劣势 | 推荐 |
| --- | --- | --- | --- | --- |
| **Supabase Postgres** | 500MB / 50 连接 / 5GB 流量 | 含 Auth/Realtime/Storage 一站式；pgvector 原生支持 | 国内访问慢；超量 $25/月 | ⭐ **MVP 主力**（与 Auth/Realtime 联动） |
| Neon | 0.5GB / 1 项目 | 分支功能强，适合 CI | 不含 Auth/Realtime | 备选 |
| Turso (SQLite) | 9GB / 500 DB | 边缘分布式，极快 | SQLite 并发弱；不支持 pgvector | 不推荐 |
| PlanetScale | 已取消免费档 | — | 收费 | 不推荐 |
| **自建 PG（轻量云）** | 0 | 完全可控，国内快 | 需自己运维、备份 | ⭐ **MVP 主力**（国内节点） |

**推荐组合**：
- **国内自建 PG 16 + pgvector**：跑在轻量云，国内访问快，无流量限制。
- **Supabase 项目**：用其 Auth + Realtime + Edge Functions，作为辅助；主数据可只放 Auth 用户表，业务表放国内 PG。
- **数据同步**：用户表通过 Supabase Webhook 同步到国内 PG（仅必要字段），避免双写。

**向量库**：直接用 **pgvector** 扩展（与 PG 同库），MVP 不引入独立向量库。预估梗卡向量 1w × 768 维 ≈ 30MB，完全在免费额度内。

### 4.4 对象存储与 CDN

| 方案 | 免费额度 | 出流量 | 优势 | 推荐 |
| --- | --- | --- | --- | --- |
| **Cloudflare R2** | 10GB 存储 | **出流量完全免费** | S3 兼容；与 CF CDN 联动；无出口费 | ⭐ **强烈推荐** |
| 七牛云 | 10GB + 1GB/月 CDN | 出流量收费 | 国内速度快 | 备选（国内分发） |
| 腾讯云 COS | 50GB（6 个月） | 出流量收费 | 国内速度快 | 备选 |
| 阿里云 OSS | 5GB（3 个月） | 出流量收费 | 生态全 | 备选 |
| Supabase Storage | 1GB | 出流量 5GB | 与 Supabase 集成 | 小文件用 |

**关键决策**：图片/视频/封面全部存 **Cloudflare R2**，利用其**出流量免费**的核心优势。视频体积大、用户访问频次高，R2 可省下大量 CDN 流量费。

**国内访问优化**：Cloudflare 在国内速度一般，可配 **CN2 GIA 回程线路** 或对热点视频做七牛云镜像（仅对国内 IP 路由到七牛，海外走 R2）。

### 4.5 AI 文本/造梗（LLM）

| 方案 | 价格（输入/输出 ¥/M tokens） | 免费额度 | 质量 | 推荐 |
| --- | --- | --- | --- | --- |
| **DeepSeek V3** | ¥1 / ¥2（缓存命中 ¥0.1） | 注册赠送 | 中文强、抽象/谐音理解好、极便宜 | ⭐ **主力** |
| 智谱 GLM-4-Flash | ¥0 / ¥0（完全免费） | 完全免费 | 质量中上 | ⭐ **fallback / 高频低难度** |
| 通义千问 Qwen-Turbo | ¥0.3 / ¥0.6 | 新用户赠送 | 中文好 | 备选 |
| Kimi (Moonshot) | ¥12 / ¥12 | 新用户 15 元 | 长上下文好但贵 | 仅脚本造梗 |
| OpenAI GPT-4o-mini | ~¥1 / ¥4 | 无 | 英文强 | 不推荐（合规+成本） |

**推荐策略**：
- **文本造梗 / 评论文本审核 / 群聊摘要**：DeepSeek V3 主力，GLM-4-Flash 作为免费降级。
- **视频脚本造梗**：用 DeepSeek V3（结构化输出好）。
- **Prompt 缓存**：同一模板 + 关键词的 prompt 走 Redis 缓存（24h TTL），命中率高可省 50%+ 成本。

**成本估算（DAU 1w，造梗率 15%）**：
- 日造梗 1500 次 × 平均 1500 tokens = 2.25M tokens/日
- 输入 ¥1/M × 1.5M + 输出 ¥2/M × 0.75M ≈ ¥3/日 → **¥90/月**
- 启用 prompt 缓存 + GLM fallback 后可降至 **¥50/月**。
- **叠加 Pro 造梗 Agent（§8.6.2）**：Pro 渗透率 5%（500 人）× 日均 2 次 × 3-4 次 LLM 调用 ≈ 1000 次 Agent 调用/日，单次约 ¥0.05-0.08 → 月增 **¥1500-2400**。
- **Pro Agent 强控成本**：10 次/日硬配额 + 日预算 ¥80 熔断降级为单次 prompt。
- **LLM 总成本估算（含 Pro Agent）**：**¥300 ~ ¥600/月**（熔断生效后）。

### 4.6 AI 图片生成

| 方案 | 价格 | 免费额度 | 质量 | 推荐 |
| --- | --- | --- | --- | --- |
| **SiliconFlow FLUX.1-schnell** | ¥0.12/张 | 新用户 14 元 | 速度快（<2s），质量好 | ⭐ **主力** |
| SiliconFlow SD3.5 | ¥0.2/张 | 同上 | 质量更高 | 进阶 |
| 阿里通义万相 | ¥0.16/张 | 新用户 500 张 | 中文场景好 | ⭐ **fallback** |
| Stability API | ~¥0.04/张（credit） | 少量 | 英文 prompt 强 | 备选 |
| 本地 ComfyUI + SDXL | 仅电费 | 无限 | 可控性强 | 需 GPU，不推荐 MVP |
| Midjourney | $10/月起 | 无 | 质量最强但贵 | 不推荐 |

**推荐**：SiliconFlow FLUX 主力 + 通义万相 fallback。模板预设 prompt 工程降低对模型质量依赖。

**成本估算**：1500 张/日 × ¥0.12 = ¥180/日 → ¥5400/月 ⚠️ **超预算**。

**降本措施**：
1. **图片造梗默认 1 候选**（非 3 候选），用户主动"再来一次"再生成。
2. **同 prompt 24h 内缓存复用**（Redis 缓存图片 URL + hash 命中）。
3. **限频**：免费用户日上限 5 次，Pro 50 次。
4. **鼓励文本造梗**（成本仅为图片 1/30）。
5. 用 FLUX-schnell（最便宜档）+ 通义万相免费额度轮换。
6. 实施后预估 **¥300~¥800/月**。

### 4.7 AI 视频生成（成本最敏感模块）

> v1.1 评审定稿：**MVP 主力使用字节豆包 Seedance 系列模型**（火山方舟 API），用户已明确选型。豆包质量好、字节生态成熟、合规友好（已备案），但单价较 SiliconFlow 高 5-10 倍，**必须用 mini 性价比档 + 严格配额 + 图片TTS兜底**才能在个人开发者预算内运行。

| 方案 | 价格 | 时长 | 质量 | 备注 |
| --- | --- | --- | --- | --- |
| **豆包 Seedance 2.0 mini** | ~¥0.3~¥0.5/秒（5s≈¥1.5~¥2.5） | 5s | 中上 | ⭐ **MVP 主力**（6 月上线性价比档，待火山方舟确认最终价） |
| 豆包 Seedance 2.0 标准版 | ~¥1/秒（46元/M tokens，5s≈¥5） | 5~15s | 强 | ⭐ **Pro 高端档 / 高梗力值用户** |
| 即梦 AI API | ~¥1~¥3/次 | 5~10s | 中上 | 字节生态，备选 fallback |
| SiliconFlow 视频模型 | ~¥0.5~¥1/次 | 5s | 入门 | 备选 fallback（最便宜但质量一般） |
| 可灵 AI API | ~¥2~¥5/次 | 5~10s | 强 | v1.5 评估对比 |
| 本地 AnimateDiff + ComfyUI | 仅电费 | 5s | 弱 | 需 RTX 4090，¥2w 投入，不推荐 MVP |

**推荐分层方案（已定稿）**：
- **免费用户**：默认走"图片 + TTS + Ken Burns 动效"兜底方案（ffmpeg 合成，成本≈图片费+TTS费，~¥0.2/次），每周赠 1 次"豆包 mini 真视频"体验额度。
- **Pro 会员**：豆包 Seedance 2.0 mini（5s 默认），10 次/日硬配额；高梗力值用户或v1.5升级到 Seedance 2.0 标准版（5s/10s）。
- **Fallback**：豆包额度/熔断时降级到 SiliconFlow 视频模型或图片+TTS 兜底。
- **本地兜底**：单卡 RTX 4090 服务器（按需租用 ¥3/小时），仅用于免费额度耗尽应急。

**成本估算（DAU 1w，按豆包 mini + 严格配额）**：
- 免费用户 9500 人 × 每周 1 次真视频 / 7 天 ≈ 1357 次/日 × ¥2 = ¥2714/日 ⚠️ 仍偏高
- **进一步收紧**：免费用户真视频限"完成特定任务（如评分3张梗卡）才获 1 次周额度"，实际转化率假设 30% → ~400 次/日 × ¥2 = ¥800/日
- Pro 500 人 × 日均 3 次（10 次上限，实际转化 30%）× ¥2 = ¥3000/日
- 合计 ~¥3800/日 → ~¥11w/月 ⚠️ **仍严重超预算**
- **最终可行配置**（必须执行）：
  - 免费用户：默认图片+TTS 兜底，真视频限 **1 次/周** 且需完成任务解锁，预估 ~150 次/日 × ¥2 = ¥300/日
  - Pro 用户：豆包 mini **3 次/日**（非 10 次），5s 默认，预估 500 × 1.5 次/日 × ¥2 = ¥1500/日
  - 兜底覆盖率 40%（图片+TTS 替代部分真视频请求）
  - 实施后预估 **¥1500~¥3000/日 → ¥4.5w~¥9w/月**，仍超个人开发者承受范围
- **结论**：豆包标准版对个人开发者 DAU 1w 量级**不可持续**，必须依赖以下任一策略：
  1. **MVP 阶段 DAU 控制在 2000 以内**（邀请制/灰度），月成本压到 ¥1w~¥2w；
  2. **Pro 定价上调或加"视频包"**：Pro 月费 ¥18 + 视频按次包（¥9.9/10次、¥29.9/50次）；
  3. **v1.0 用 Seedance 2.0 mini + 兜底覆盖率拉到 60%**，月成本压到 ¥3w~¥5w；
  4. **v1.5 接入 Seedance 自训小模型或开源模型（AnimateDiff + LoRA）自部署降本**。

**强降本措施（必须执行）**：
1. **日视频生成上限**：免费用户 1 次/周（需任务解锁），Pro **3 次/日**（v1.1 从 10 次下调到 3 次，对齐豆包成本现实）。
2. **TTS+图片动态化兜底**：兜底覆盖率目标 40-60%，"视频"= 静态梗图 + TTS 配音 + Ken Burns 缩放动效（ffmpeg 合成）。
3. **视频时长默认 5s**，10s/15s 需 Pro + 额外能量。
4. **缓存复用**：相似 prompt 走已有视频。
5. **成本看板告警**：日预算超 ¥100 自动降级到图片+TTS 模式，超 ¥200 暂停真视频生成。
6. **模型档位路由**：免费/低梗力值用户走 mini，高梗力值/Pro 走标准版。
7. **MVP 灰度策略**：上线前 2 周邀请制（DAU ≤ 500），豆包成本可控在 ¥3000/月内验证产品闭环。
8. 实施后预估 **¥3000~¥15000/月**（取决于 DAU 与兜底覆盖率，详见上方结论）。

### 4.8 实时聊天/IM

> v1.1 评审补充：对自建 IM 的成本与成熟开源方案做了完整调研，结论见下方"自建成本与开源方案对比"。

| 方案 | 软件成本 | 基础设施成本 | 开发量 | 推荐定位 |
| --- | --- | --- | --- | --- |
| **Supabase Realtime** | ¥0 | ¥0（免费档 200w 连接/5GB） | 极小（订阅 channel + 表变更） | ⭐ **私聊 + 系统通知主力** |
| **自建 WebSocket（NestJS Gateway + Redis pubsub + PG 持久化）** | ¥0 | ¥0（复用现有 2C2G 轻量云） | 中（~1-2 周，自己写心跳/重连/离线消息/@/引用/已读） | ⭐ **军团群聊主力** |
| **OpenIM 私有部署** | ¥0（Apache 2.0，16k+ stars，Go，活跃维护至 2026-03） | **¥150~¥300/月**（需 4C8G+，依赖 MySQL+MongoDB+Redis+Kafka+ZooKeeper，2C2G 跑不动） | 小（Docker Compose 一键部署 + RN SDK 现成） | ❌ MVP 不推荐（运维复杂、超规格） |
| Centrifugo 私有部署 | ¥0 | ¥0（单 Go 二进制，2C2G 可跑） | 中（仅消息推送层，持久化/群管理需自写） | 备选（仅当群聊 QPS 上来） |
| Matrix/Synapse | ¥0 | ¥200+/月（重，资源占用大） | 大（去中心化联邦协议，过重） | ❌ 不推荐 |
| 网易云信 / 融云 / 腾讯 IM | ¥0 试用 | 正式版 ¥1000+/月 | 极小 | ❌ 超预算 |

#### 4.8.1 自建成本与开源方案对比（v1.1 新增）

**问：自建 IM 成本有多大？网络上是否有成熟方案？**

**答：分两层看。**

**A. 轻量自建（推荐 MVP）—— 复用 NestJS + Redis + PG，¥0 增量成本**

- 实现：NestJS Gateway（基于 `socket.io` 或原生 `ws`）+ Redis pubsub 跨实例广播 + PG 表持久化消息 + 离线消息走 PG 拉取。
- 软件成本：¥0（全部开源复用现有栈）。
- 基础设施成本：¥0（跑在现有 2C2G 轻量云，与 NestJS 主业务同进程或同机）。
- 开发量：**~1-2 周**，需自己实现：心跳/断线重连、消息有序与去重、@提醒、引用消息、已读回执、消息历史分页、敏感词过滤、频控限流、消息保留 30 天后归档 OSS。
- 单机连接上限：~1w（NestJS 单进程），v1.5 可加多实例 + Redis pubsub 横向扩展。
- 风险：自己写 IM 协议，边界 case 多（弱网、消息丢失、时序）；但 MVP 量级（DAU ≤ 2000 灰度）完全可控。
- 适用：梗星球"军团群聊"（百~千人/群、@、引用、保留 30 天）。

**B. 重量自建（OpenIM 私有部署）—— 成熟但超规格**

- 项目：[open-im-server](https://github.com/openimsdk/open-im-server)，Go 写的，Apache 2.0，16.4k stars，最新 release v3.8.3（2026-03），活跃维护，提供 RN/Flutter/Web/iOS/Android 全平台 SDK，Docker Compose 一键部署。
- 能力：完整的 IM 引擎（消息/群组/好友/已读/阅后即焚/音视频/推送/消息历史/检索），开箱即用。
- 软件成本：¥0。
- **基础设施成本：¥150~¥300/月**（关键约束）：
  - OpenIM v3 微服务架构依赖 **MySQL + MongoDB + Redis + Kafka + ZooKeeper** 五个组件，最低需 **4C8G** 服务器才能稳定运行，腾讯云轻量 4C8G ≈ ¥150-250/月。
  - 当前 2C2G 轻量云跑不动 OpenIM 全套。
- 运维复杂度：**高**，5 个中间件 + Go 微服务，与 NestJS(TS) 主栈异构，排障与升级成本高，对个人开发者不划算。
- 何时切换：**v2.0+ 当 IM 成为产品核心（DAU 10w+、需要音视频通话、消息检索、跨端同步）时再评估**，MVP 阶段不建议。

**C. 折中方案（Centrifugo）—— 仅当群聊 QPS 成为瓶颈**

- Centrifugo 是 Go 写的专业实时消息推送服务器，单二进制部署，2C2G 可跑，¥0 增量成本。
- 但它只负责"消息推送层"，**消息持久化、群成员管理、历史消息、@提醒等业务逻辑仍需自己在 NestJS 实现**。
- 适用场景：v1.5 群聊 QPS 上升、NestJS Gateway 单机扛不住时，把"推送层"切到 Centrifugo，业务层仍在 NestJS。

#### 4.8.2 推荐组合（v1.1 定稿）

- **私聊 + 系统通知**：**Supabase Realtime**（免费、与 PG/Auth 集成、开发量最小）。
- **军团群聊**：**自建 WebSocket（NestJS Gateway + Redis pubsub + PG 持久化）**（¥0 增量成本、复用现有栈、可控性最强、满足风控需求）。
- **演进路径**：v1.5 群聊 QPS 上升时评估 Centrifugo 切换推送层；v2.0 IM 成为产品核心且 DAU 10w+ 时评估 OpenIM 私有部署。
- **理由**：个人开发者 MVP 阶段，**¥0 增量成本 + 复用现有 NestJS/Redis/PG 栈 + 1-2 周开发量**是最优解；OpenIM 虽成熟但需 4C8G+¥150/月+5 中间件运维，超规格；商业 IM 云（网易云信/融云）正式版 ¥1000+/月超预算。

### 4.9 推送

| 方案 | 免费档 | 推荐 |
| --- | --- | --- |
| **OneSignal** | 无限推送，无限用户 | ⭐ **MVP 主力** |
| 极光推送 | 免费档 10 DAU 极小 | 不推荐 |
| FCM + APNs 自建 | 完全免费 | 进阶（需自己写双端推送逻辑） |
| 个推 | 收费 | 不推荐 |

**推荐**：OneSignal 一站式，国内 Android 走华为/小米/FCM 通道，iOS 走 APNs。

### 4.10 监控与埋点

| 用途 | 选型 | 免费档 |
| --- | --- | --- |
| 错误监控 | Sentry | 5k 错误/月，1 次重放 |
| 拨测 | UptimeRobot | 50 监控点，5 分钟间隔 |
| 流量分析 | Cloudflare Analytics | 完全免费 |
| 产品埋点 | PostHog Cloud | 1M 事件/月免费 |
| 自建埋点备选 | Umami 自部署 | 完全免费 |
| APM | 不上（MVP 阶段用日志 + Sentry） | ¥0 |

### 4.11 MVP 月度成本估算表

> 假设：DAU 1w，造梗率 15%（1500 次/日），视频生成率 5%（500 次/日），日均 PV 30w。

| 服务项 | 选型 | 计费方式 | 预估月成本（¥） | 是否免费档内 |
| --- | --- | --- | --- | --- |
| 应用服务器 | 腾讯云轻量 2C2G 50GB | 包月 | 50 | 否 |
| 对象存储 | Cloudflare R2 | 10GB 免费 + ¥0.015/GB·月 | 0~5 | 是 |
| CDN 流量 | Cloudflare | 出流量免费 | 0 | 是 |
| 数据库 PG | 自建（轻量云内） | 含在服务器 | 0 | 是 |
| 数据库 PG 备份 | Supabase 免费档做异地副本 | 免费 | 0 | 是 |
| Redis | 自建（轻量云内） | 含在服务器 | 0 | 是 |
| 认证 | Supabase Auth | 免费 50k MAU | 0 | 是 |
| LLM（文本造梗+审核+脚本） | DeepSeek V3 + GLM 兜底 | 按 token | 50~120 | 否 |
| **LLM（Pro 造梗 Agent）** | DeepSeek V3 + Vercel AI SDK | 按 token（Pro 5% 渗透 × 2 次/日） | 250~480（熔断后） | 否 |
| 图像生成 | SiliconFlow + 通义万相 | 按张 | 200~600 | 否 |
| 视频生成 | 豆包 Seedance 2.0 mini + 兜底方案 | 按次（免费 1次/周·Pro 3次/日，40-60% 兜底覆盖率） | 3000~15000（DAU 1w） | 否 |
| TTS | 火山引擎 | 按字符 | 20~50 | 否 |
| 短信 | 阿里云/腾讯云 | 按条（仅换机触发） | 10~30 | 否 |
| 内容安全 | 阿里云内容安全 | 10w 次免费 | 0~30 | 是 |
| 推送 | OneSignal | 免费 | 0 | 是 |
| 域名 | .com | 年费摊销 | 5 | 否 |
| 备案 | 免费 | — | 0 | — |
| **AIGC 备案** | 自行申报 | — | 0 | — |
| 监控 | Sentry + UptimeRobot + PostHog | 免费档 | 0 | 是 |
| CI/CD | GitHub Actions | 私有仓 2000 分钟 | 0 | 是 |
| **合计（DAU 1w）** | | | **¥3585 ~ ¥16855** | |
| **合计（MVP 灰度 DAU 500）** | | | **¥400 ~ ¥1200** | |

**结论**：
- **豆包 Seedance 单价较 SiliconFlow 高 5-10 倍，是 MVP 最大成本项，且不可控**。DAU 1w 量级月成本可能 ¥1w+，**强烈建议 MVP 灰度阶段（DAU ≤ 500~2000）上线验证**，月成本控制在 ¥1000~¥3000。
- **乐观情况**（灰度 DAU 500 + 兜底覆盖率 60% + Pro 配额 3 次/日）：约 **¥400~¥1200/月**。
- **保守情况**（DAU 5000 + 兜底覆盖率 40%）：约 **¥5000~¥8000/月**。
- **DAU 1w 全量**：¥1w+，**需 Pro 收入 + 视频按次包对冲**。
- **Pro 会员定价已定稿 ¥18/月**：500 Pro 用户 = ¥9000/月，可覆盖 DAU 5000 规模的视频增量成本。建议同步上线"视频按次包"（¥9.9/10次、¥29.9/50次）作为对冲。
- **v1.5 降本路径**：评估 Seedance 自训小模型 / 开源 AnimateDiff + LoRA 自部署，将视频单价压到 ¥0.5/次以下。

---

## 5. 系统模块划分与微服务边界

### 5.1 模块化单体设计

个人开发者起步，**反对一开始就上微服务**。采用 NestJS 模块化单体，每个业务模块为独立 Module，未来可按需抽离。

| NestJS Module | 对应 PRD 模块 | 关键职责 | 未来可拆分性 |
| --- | --- | --- | --- |
| `AuthModule` | 用户系统 | 登录、JWT、OAuth、RBAC | 高 |
| `UserModule` | 用户系统 | 资料、等级、梗力值、勋章 | 中 |
| `MemeModule` | 梗卡内容流 | 梗卡 CRUD、发布、feed | 高 |
| `CreationModule` | AI 造梗工坊 | 造梗会话、候选管理、能量扣减 | 高（可独立 AI 服务） |
| `VideoModule` | AI 视频生成 | 异步任务、回调、字幕、TTS | 高（可独立 AI 服务） |
| `RatingModule` | 评分与评论 | 评分、评论、神/烂梗判定 | 中 |
| `LegionModule` | 梗大军 | 军团 CRUD、成员、贡献度 | 中 |
| `PKModule` | PK | PK 创建、匹配、投票、结算 | 高（可独立高并发服务） |
| `ChatModule` | 消息与聊天 | 私聊、群聊、@、通知 | 高（可独立 IM 服务） |
| `RecommendModule` | 推荐 | 召回、排序、热度分 | 高（可独立算法服务） |
| `AuditModule` | 内容安全 | 机审、人审队列、举报 | 中 |
| `AdminModule` | 运营后台 | 审核、PK 运营、看板 | 中 |
| `NotificationModule` | 通知 | 推送、站内信 | 中 |
| `AnalyticsModule` | 埋点 | 事件上报、看板 | 中 |
| `AIOrchModule` | AI 编排层 | LLM/图像/视频统一抽象 | 高 |

### 5.2 服务依赖图

```mermaid
flowchart LR
    AuthModule --> UserModule
    UserModule --> LegionModule
    UserModule --> MemeModule
    CreationModule --> AIOrchModule
    VideoModule --> AIOrchModule
    CreationModule --> MemeModule
    VideoModule --> MemeModule
    MemeModule --> RatingModule
    MemeModule --> AuditModule
    MemeModule --> RecommendModule
    RatingModule --> MemeModule
    LegionModule --> PKModule
    MemeModule --> PKModule
    PKModule --> RedisCache
    ChatModule --> LegionModule
    ChatModule --> NotificationModule
    AuditModule --> AIOrchModule
    RecommendModule --> MemeModule
    RecommendModule --> VectorDB
    AdminModule --> AuditModule
    AdminModule --> PKModule
    AdminModule --> AnalyticsModule
```

### 5.3 未来拆分边界

- v1.5：抽离 `AIOrchModule` 为独立 AI Gateway 服务（独立部署，独立扩缩容）。
- v2.0：抽离 `RecommendModule` 为推荐服务（可换 Python 栈跑模型）。
- v2.0：抽离 `PKModule` 为独立高并发服务（应对联赛级流量）。

---

## 6. 数据模型设计

### 6.1 核心实体 ER 图

```mermaid
erDiagram
    USER ||--o{ MEME_CARD : authors
    USER ||--o{ RATING : gives
    USER ||--o{ COMMENT : writes
    USER ||--o{ MESSAGE : sends
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ ARMY_MEMBER : joins
    USER ||--o{ AUDIT_LOG : triggers

    MEME_CARD ||--o{ RATING : has
    MEME_CARD ||--o{ COMMENT : has
    MEME_CARD ||--o{ MEME_VIDEO : has
    MEME_CARD }o--|| LEGION : belongs_to_optional
    MEME_CARD ||--o{ AUDIT_LOG : audited

    MEME_VIDEO ||--o{ AUDIT_LOG : audited

    LEGION ||--o{ ARMY_MEMBER : has
    LEGION ||--o{ PK_MATCH : challenges_as_a
    LEGION ||--o{ PK_MATCH : challenges_as_b
    LEGION ||--o{ CHAT_ROOM : owns

    PK_MATCH ||--o{ PK_VOTE : receives
    PK_MATCH ||--o{ PK_SUBMISSION : has
    PK_MATCH }o--|| LEGION : winner

    CHAT_ROOM ||--o{ MESSAGE : contains
    CHAT_ROOM }o--|| LEGION : belongs_to

    RATING }o--|| MEME_CARD : targets
    RATING }o--|| USER : rater

    AUDIT_LOG }o--|| USER : user

    USER {
        uuid user_id PK
        string nickname
        string avatar_url
        string gender
        date birthday
        jsonb interest_tags
        int level
        int meme_power
        int defense_value
        int energy_balance
        jsonb badges
        timestamp created_at
        varchar status
    }

    MEME_CARD {
        uuid meme_id PK
        uuid author_id FK
        varchar type
        varchar cover_url
        text title
        jsonb tags
        uuid legion_id FK
        decimal score_avg
        int score_count
        int comment_count
        int share_count
        decimal hot_score
        varchar god_trash_status
        varchar status
        timestamp published_at
    }

    MEME_VIDEO {
        uuid video_id PK
        uuid meme_id FK
        varchar source_type
        int duration
        varchar voice_id
        text subtitle_text
        varchar status
        varchar model_version
        varchar file_url
        varchar cover_url
        timestamp created_at
    }

    CREATION_SESSION {
        uuid creation_id PK
        uuid user_id FK
        varchar mode
        text prompt
        varchar style
        uuid template_id FK
        jsonb candidates
        int energy_cost
        varchar model_version
        timestamp created_at
    }

    RATING {
        uuid score_id PK
        uuid meme_id FK
        uuid user_id FK
        jsonb dimensions
        boolean is_judge
        decimal weight
        boolean is_god_trash_vote
        text comment
        timestamp created_at
    }

    COMMENT {
        uuid comment_id PK
        uuid meme_id FK
        uuid user_id FK
        uuid parent_id FK
        text content
        int like_count
        boolean is_god_comment
        timestamp created_at
    }

    LEGION {
        uuid legion_id PK
        string name
        string slogan
        jsonb theme_tags
        uuid leader_id FK
        int level
        int activity_score
        int member_count
        int member_cap
        varchar join_mode
        jsonb badges
        varchar status
        timestamp created_at
    }

    ARMY_MEMBER {
        uuid membership_id PK
        uuid legion_id FK
        uuid user_id FK
        varchar role
        int contribution
        timestamp joined_at
    }

    PK_MATCH {
        uuid pk_id PK
        varchar type
        uuid legion_a FK
        uuid legion_b FK
        string theme
        timestamp start_at
        timestamp end_at
        varchar status
        decimal score_a
        decimal score_b
        uuid winner_id FK
        uuid mvp_user_id FK
        jsonb reward_state
        timestamp created_at
    }

    PK_VOTE {
        uuid vote_id PK
        uuid pk_id FK
        uuid user_id FK
        uuid legion_id FK
        timestamp voted_at
    }

    PK_SUBMISSION {
        uuid submission_id PK
        uuid pk_id FK
        uuid meme_id FK
        uuid legion_id FK
        timestamp submitted_at
    }

    CHAT_ROOM {
        uuid room_id PK
        varchar type
        uuid legion_id FK
        uuid user_a FK
        uuid user_b FK
        timestamp created_at
    }

    MESSAGE {
        uuid message_id PK
        uuid room_id FK
        uuid sender_id FK
        varchar msg_type
        text content
        jsonb extra
        timestamp created_at
    }

    NOTIFICATION {
        uuid notif_id PK
        uuid user_id FK
        varchar type
        jsonb payload
        boolean is_read
        timestamp created_at
    }

    AUDIT_LOG {
        uuid audit_id PK
        uuid target_id
        varchar target_type
        varchar action
        varchar reason
        varchar result
        uuid operator_id FK
        timestamp created_at
    }
```

### 6.2 关键表字段与索引说明

#### user 表
- 索引：`nickname`（前缀索引，模糊搜索）、`phone`（唯一）、`status`、`created_at`
- 关系：1:N meme_card、rating、comment、message、army_member

#### meme_card 表
- 索引：`author_id + created_at`（个人主页）、`legion_id + status`（军团墙）、`hot_score DESC`（热门榜）、`status + published_at`（feed）、`god_trash_status`
- 全文索引：`title`（PG `tsvector`）
- 关系：N:1 user、N:1 legion、1:N rating、1:N comment、1:N meme_video

#### rating 表
- 唯一约束：`(meme_id, user_id)`（一人一梗一评）
- 索引：`meme_id + created_at`、`user_id + created_at`

#### pk_match 表
- 索引：`status + end_at`（PK 大厅）、`legion_a / legion_b`、`winner_id`
- 状态机字段：`status` ∈ {idle, challenged, accepted, preparing, battling, judging, settled, archived}

#### pk_vote 表
- 唯一约束：`(pk_id, user_id, date)` 部分唯一（每人每天每场 ≤3 票，用 `date_trunc('day', voted_at)`）
- 索引：`pk_id + legion_id`

#### message 表
- 索引：`room_id + created_at DESC`（消息列表）
- 分区：按月分区（数据量大时启用），30 天前数据归档到 OSS Parquet

#### legion 表
- 唯一约束：`name`（不区分大小写）
- 索引：`level + activity_score`（排行榜）、`status`

### 6.3 向量库设计（pgvector）

启用 `pgvector` 扩展，创建以下向量表：

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- 梗卡向量（用于推荐召回）
CREATE TABLE meme_embedding (
    meme_id uuid PRIMARY KEY REFERENCES meme_card(meme_id) ON DELETE CASCADE,
    embedding vector(768),  -- 用 bge-small-zh 或 DeepSeek embedding
    style_tags jsonb,
    created_at timestamp DEFAULT now()
);
CREATE INDEX ON meme_embedding USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 用户兴趣向量（用于个性化推荐）
CREATE TABLE user_embedding (
    user_id uuid PRIMARY KEY REFERENCES "user"(user_id) ON DELETE CASCADE,
    interest_vector vector(768),
    behavior_vector vector(768),  -- 聚合近期行为
    updated_at timestamp DEFAULT now()
);

-- Prompt 模板向量（用于模板推荐）
CREATE TABLE prompt_template_embedding (
    template_id uuid PRIMARY KEY,
    embedding vector(768),
    tags jsonb
);
```

**Embedding 模型**：
- 文本：`bge-small-zh-v1.5`（通过 SiliconFlow 免费 API 调用，768 维）或 DeepSeek embedding。
- 梗图：用 CLIP 模型提取图像向量（本地小模型或 SiliconFlow），MVP 阶段可暂只对标题/标签做 embedding。

**索引**：MVP 数据量 < 1w，用 `ivfflat` 索引即可；超 10w 后切 `hnsw`。

---

## 7. 核心业务流程技术实现

### 7.1 AI 造梗发布流程

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant App as App
    participant API as NestJS API
    participant Q as Queue
    participant W as Worker
    participant AI as AI Orchestrator
    participant LLM as LLM Provider
    participant IMG as Image Provider
    participant AUD as 内容安全 API
    participant DB as PostgreSQL
    participant VEC as pgvector
    participant OSS as R2

    U->>App: 选模式 + 输入关键词
    App->>API: POST /creations {mode, prompt, style}
    API->>DB: 创建 creation_session (status=pending)
    API->>DB: 检查/扣减梗能量 (UPDATE balance)
    API->>Q: enqueue job {creation_id, mode, prompt}
    API-->>App: 202 Accepted {creation_id}
    App-->>U: 显示"脑细胞燃烧中"进度

    W->>Q: dequeue job
    W->>AI: generate(mode, prompt, style)
    alt mode=text
        AI->>LLM: chat (DeepSeek V3)
        LLM-->>AI: 3 候选文本
    else mode=image
        AI->>LLM: prompt 重写
        AI->>IMG: generate_image (SiliconFlow)
        IMG-->>AI: 3 候选图片 URL
    end
    AI-->>W: candidates[]
    W->>OSS: 上传图片（如 image 模式）
    W->>DB: 更新 creation_session.candidates, status=ready
    W->>App: 通过 WebSocket/轮询通知完成

    App->>U: 展示 3 候选
    U->>App: 选择 + 微调
    U->>App: 包装梗卡（标题/标签/军团）
    App->>API: POST /memes {creation_id, chosen, title, tags, legion_id}
    API->>DB: INSERT meme_card (status=pending_audit)
    API->>Q: enqueue audit job
    API-->>App: 200 {meme_id}

    W->>Q: dequeue audit job
    W->>AUD: 文本审核 + 图片审核
    alt 通过
        W->>DB: 更新 status=published, published_at=now
        W->>VEC: 生成 embedding 并写入 meme_embedding
        W->>DB: 写入初始热度榜 (Redis ZSet)
        W->>App: 推送发布成功通知
    else 可疑
        W->>DB: status=manual_review
        W->>Admin: 进入人工审核队列
    else 违规
        W->>DB: status=rejected
        W->>App: 推送驳回通知 + 退能量
    end
```

**关键工程要点**：
- **能量扣减用乐观锁**：`UPDATE user SET energy = energy - cost WHERE id = ? AND energy >= cost`，避免并发超扣。
- **24h prompt 去重**：用 `md5(prompt + style)` 在 Redis SET 中判重，命中则直接返回缓存的 candidates。
- **轮询 vs WebSocket**：MVP 用客户端轮询（每 2s，最长 30s）；v1.5 切 WebSocket 推送。
- **超时降级**：30s 未完成自动标记 failed，退能量 + 提示重试。
- **向量化时机**：审核通过后才生成 embedding 入库，避免违规内容污染向量库。

### 7.2 AI 梗视频生成流程

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant App as App
    participant API as NestJS API
    participant Q as Queue
    participant W as VideoWorker
    participant AI as AI Orchestrator
    participant VID as 视频模型
    participant TTS as TTS 服务
    participant FFMPEG as ffmpeg
    participant AUD as 内容安全
    participant OSS as R2
    participant DB as PG
    participant CDN as Cloudflare

    U->>App: 选择"生成视频" + 输入/选脚本
    App->>API: POST /videos {source_type, source_id, duration, voice_id}
    API->>DB: 检查日生成上限 (Redis INCR)
    API->>DB: 扣能量 (5x 图片)
    API->>DB: INSERT meme_video (status=generating)
    API->>Q: enqueue video_job {video_id, ...}
    API-->>App: 202 {video_id}

    W->>Q: dequeue video_job
    W->>AI: generate_video(script, duration)

    alt 额度充足 走真实生成
        AI->>VID: 文生视频请求 (SiliconFlow / 可灵)
        VID-->>AI: 任务 ID + 轮询地址
        loop 轮询 (每 5s, 最长 3 分钟)
            AI->>VID: 查询任务状态
            VID-->>AI: status / video_url
        end
        AI-->>W: video_url (临时)
    else 额度紧张 走兜底方案
        AI->>IMG: 生成梗图
        AI->>TTS: 配音合成
        W->>FFMPEG: 拼接 (图片 Ken Burns + TTS + 字幕)
        FFMPEG-->>W: 本地视频文件
    end

    W->>TTS: 字幕同步生成 (基于脚本)
    W->>FFMPEG: 烧录字幕 + AI 生成水印
    W->>OSS: 上传最终视频 (R2)
    W->>OSS: 生成封面 (ffmpeg 抽帧)
    W->>CDN: 通过 CF CDN 分发
    W->>AUD: 视频抽帧 (每秒 1 帧) + 内容安全
    alt 审核通过
        W->>DB: status=published, file_url, cover_url
        W->>App: 推送生成完成通知
    else 违规
        W->>DB: status=rejected
        W->>App: 通知 + 退能量
    end

    App->>U: 预览视频 / 编辑字幕
    U->>App: 发布为梗卡
    App->>API: POST /memes {video_id, ...}
```

**关键工程要点**：
- **视频生成是异步长任务**，必须用队列 + 轮询/Webhook。
- **Webhook 优先**：SiliconFlow/可灵支持 Webhook 回调时直接走 Webhook，省轮询成本；不支持时用轮询。
- **兜底方案**是降本核心：图片+TTS+ffmpeg 成本约为真实生成的 1/5。
- **AI 水印**：合规要求，所有 AI 生成视频右下角强制叠加"AI 生成"角标，由 ffmpeg 滤镜完成。
- **进度推送**：通过 Redis pubsub → WebSocket 推送"造梗中 78%"等趣味文案。
- **失败补偿**：自动退能量 + 赠送 1 次补偿生成（Redis 计数）。

### 7.3 梗大军 PK 投票流程

```mermaid
sequenceDiagram
    autonumber
    participant U as 用户
    participant App as App
    participant API as NestJS API
    participant GW as 限流网关 (CF Worker)
    participant Redis as Redis
    participant Q as Queue
    participant W as 结算 Worker
    participant DB as PG

    Note over U,W: PK 进行中 24h
    U->>App: 进入 PK 大厅 / 投票
    App->>GW: POST /pk/{id}/vote {legion_id}
    GW->>GW: IP 限流 + 设备指纹校验
    GW->>API: 转发请求

    API->>Redis: SETNX vote_lock:{pk_id}:{user_id}:{date} (TTL 24h)
    alt 已投 3 票
        API-->>App: 429 "今日投票次数已用尽"
    else 可投
        API->>Redis: INCR vote_count:{pk_id}:{legion_id}
        API->>Redis: ZINCRBY pk_score:{pk_id} 1 {legion_id}
        API->>Redis: 写入 vote_log (HyperLogLog 去重统计)
        API->>DB: INSERT pk_vote (异步, 通过 Q)
        API-->>App: 200 {current_scores}
        API-->>App: 通过 Redis pubsub 推送实时比分
    end

    Note over W: PK 结束定时任务
    W->>DB: SELECT pk WHERE end_at < now AND status=battling
    W->>Redis: 读取 vote_count:{pk_id}:{legion_a/b}
    W->>DB: 计算总分 (含评审官评分加权)
    W->>DB: UPDATE pk_match SET status=settled, winner_id, score_a, score_b
    W->>DB: 发放奖励 (legion.activity_score += 500, member.meme_power += 50)
    W->>DB: 发放 MVP 徽章
    W->>App: 推送战报通知
```

**关键工程要点**：
- **Redis 计数为主**：投票实时计数走 Redis ZSet，DB 异步落盘，QPS 可达 1w+。
- **防刷三层**：
  1. **网关层**：Cloudflare Workers 按 IP + 设备指纹限流（每 IP 每分钟 ≤30 次投票请求）。
  2. **业务层**：每人每天每场 ≤3 票（Redis SETNX 计数）。
  3. **风控层**：设备指纹（Canvas hash + UA + IP 段）+ 行为分析（短时高频投票打标）。
- **削峰**：投票请求先入 Redis Streams 队列，Worker 异步消费落 DB；前端实时显示走 Redis 直读。
- **结算**：定时任务（BullMQ Repeatable Job）每分钟扫描到期 PK，结算 + 发奖。
- **比分实时推送**：Redis pubsub → WebSocket → 顶部横幅实时更新。

---

## 8. AI 能力集成方案

### 8.1 AI 编排层设计

```mermaid
flowchart LR
    subgraph AIOrchModule
        ORCH[AIOrchestrator]
        LLM_A[LLM Adapter]
        IMG_A[Image Adapter]
        VID_A[Video Adapter]
        TTS_A[TTS Adapter]
        POLICY[Policy Engine<br/>降级/熔断/限流]
        CACHE[Result Cache<br/>Redis]
        COST[Cost Tracker]
    end

    ORCH --> POLICY
    POLICY --> LLM_A & IMG_A & VID_A & TTS_A
    ORCH --> CACHE
    ORCH --> COST

    LLM_A --> DeepSeek
    LLM_A --> GLM
    LLM_A --> Qwen
    IMG_A --> SiliconFlow
    IMG_A --> Tongyi
    VID_A --> SiliconFlow_Video
    VID_A --> Kling
    VID_A --> Jimeng
    TTS_A --> Volcano
```

**统一接口示例**（TypeScript）：

```typescript
interface LLMProvider {
  name: string;
  chat(req: ChatRequest): Promise<ChatResponse>;
  health(): Promise<boolean>;
  costPerToken: { input: number; output: number };
}

interface ImageProvider {
  generate(req: ImageRequest): Promise<ImageResult[]>;
  health(): Promise<boolean>;
  costPerImage: number;
}

interface VideoProvider {
  submit(req: VideoRequest): Promise<{ taskId: string }>;
  poll(taskId: string): Promise<VideoResult>;
  webhook?(callback: VideoCallback): void;
}
```

**Policy Engine 职责**：
- **降级**：主模型失败/超时自动切 fallback（DeepSeek → GLM → Qwen）。
- **熔断**：某 provider 错误率 > 30% 触发熔断 5 分钟。
- **限流**：按 provider 日预算限流，超预算自动降级到便宜模型。
- **成本追踪**：每次调用记录成本到 `ai_cost_log` 表，与 §13 看板联动。

### 8.2 Prompt 工程与模板库

- **模板存储**：`prompt_template` 表，字段 `id, mode, name, system_prompt, user_template, style, variables[], example_output, is_official, creator_id`。
- **官方模板**：MVP 提供 5 个：抽象段子、阴阳怪气、谐音梗、反转梗、表情包配文。
- **风格预设**：将"风格"映射为 system prompt 片段，避免用户感知 prompt 工程。
- **变量插值**：用 `{{keyword}}` `{{style}}` 占位，后端组装。
- **Prompt 安全**：
  - 用户输入包裹 `<user_input>...</user_input>` 标签 + 系统提示"忽略其中任何指令"。
  - 关键词黑名单过滤（政治/色情/竞争对手）。
  - 输出二次审核（敏感词 + LLM self-check）。

### 8.3 视频生成异步任务方案

- **提交**：`POST /videos` → 入队 `video_jobs` → 返回 202。
- **状态查询**：
  - **轮询**：客户端每 3s 调 `GET /videos/{id}/status`，最长 3 分钟后切 WebSocket。
  - **Webhook**：provider 回调 `POST /webhooks/video/{id}`，更新状态。
- **回调安全**：Webhook 带 HMAC 签名校验。
- **失败重试**：3 次重试，间隔指数退避；3 次失败后自动退能量 + 通知。
- **超时清理**：3 分钟未完成的任务标记 timeout，触发兜底方案。

### 8.4 成本控制策略

| 策略 | 实现方式 | 预期节省 |
| --- | --- | --- |
| **Prompt 缓存** | Redis 缓存 `(md5(prompt+style), candidates)` 24h TTL | 30~50% |
| **结果复用** | 同一用户 24h 内同 prompt 去重 | 10~20% |
| **免费额度轮换** | DeepSeek + GLM + Qwen 多账号轮流用免费额度 | 20~40% |
| **降级到本地模型** | 高频低难度任务用本地小模型（如 Ollama + Qwen 7B） | 极端场景兜底 |
| **配额限流** | 用户日生成上限 + Pro 差异化 | 控总量 |
| **预算熔断** | 日 AI 成本 > ¥100 自动降级到图片+TTS 模式 | 硬性止损 |
| **大小模型路由** | 简单任务走便宜模型，复杂任务走强模型 | 20~30% |

### 8.5 AI 安全与合规

- **Prompt 注入防护**：用户输入隔离 + 系统指令明确边界 + 输出审核。
- **AI 生成内容标识**：
  - 所有 AI 生成梗卡带"AI 辅助创作"声明（梗卡详情页底部）。
  - 所有 AI 生成视频右下角叠加"AI 生成"水印（ffmpeg 滤镜）。
  - 图片角标"AI 生成"（左下角小标）。
  - 满足《生成式 AI 服务管理办法》第十二条要求。
- **深度合成限制**：MVP 不开放人脸/声音克隆（PRD §9.4 已明确）。
- **生成日志留存**：所有 AI 调用的 prompt、参数、输出留存 6 个月备查。

### 8.6 Agent 与算法体系（v1.1 新增）

> 本章回答"是否涉及算法/Agent 开发"：**涉及，且分期落地**。MVP 阶段在传统推荐/审核之上，引入 Pro 专属的"造梗 Agent"与 RAG 知识库，作为产品差异化核心；v1.5 引入 LLM-as-Judge 梗质量预评分；v2.0 引入 PK 配对 ELO 与多模态内容安全。

#### 8.6.1 整体能力地图

| 能力 | 用途 | MVP（v1.0） | v1.5 | v2.0 |
| --- | --- | --- | --- | --- |
| RAG 造梗知识库 | 检索历史神梗/网络热梗作为 prompt 上下文，避免重不烂 | ✅ pgvector + 历史梗卡向量化 | — | 引入外部热梗源爬取 |
| 造梗 Agent（多步推理） | 选题→RAG检索→3候选生成→自评选优，质量优于单次 prompt | ✅ **Pro 会员专属**，3 步精简版 | 全用户开放 + 视频脚本生成步 | 个性化 Agent（用户长期记忆） |
| 单次 prompt 造梗 | 低成本、低延迟，免费用户默认 | ✅ 免费用户 | — | — |
| LLM-as-Judge 梗质量预评分 | 发布前 AI 预判神梗/烂梗，辅助上热与反垃圾 | ❌ | ✅ Pro 内容预审 + 人工抽审 | 自训小模型替代 LLM |
| 推荐：召回 + 排序 | 个性化 feed | 热度分 + 简单 CF 协同过滤 | 双塔召回 + LightGBM 排序 | 深度模型 + 实时特征 |
| PK 配对算法 | 战力均衡匹配，避免虐菜局 | 简单按军团等级+随机 | ELO/MMR 匹配 | 联赛种子+赛季积分 |
| 多模态内容安全 | 文本/图/视频审核 | 第三方 API + 规则 + 敏感词 DFA | 抽帧增强 + 自训文本分类小模型 | 端侧+云端双轨 |

#### 8.6.2 造梗 Agent 设计（MVP · Pro 专属）

**触发条件**：用户为 Pro 会员，且在造梗工坊选择"Agent 模式"（默认仍为单次 prompt 模式，可手动切换）。

**3 步精简流程**（控制成本与延迟）：

```mermaid
sequenceDiagram
    autonumber
    participant App as RN App
    participant API as NestJS CreationModule
    participant Agent as Agent Runner<br/>(Vercel AI SDK)
    participant RAG as pgvector 知识库
    participant LLM as DeepSeek V3
    participant Judge as LLM-as-Judge<br/>(v1.5)
    participant Q as BullMQ Queue
    participant Push as OneSignal

    App->>API: POST /creations/agent (Pro 鉴权)
    API->>Q: 入队 agent_jobs，返回 job_id
    API-->>App: 202 Accepted + job_id
    Note over App: UI 切"造梗中"进度条<br/>支持退出后推送通知
    Q->>Agent: 拉取任务
    Agent->>RAG: 步骤1 检索相关神梗/热梗 top5
    RAG-->>Agent: 上下文示例
    Agent->>LLM: 步骤2 基于上下文生成 3 候选
    LLM-->>Agent: 3 条候选梗
    Agent->>LLM: 步骤3 自评打分选最优（结构化输出）
    LLM-->>Agent: 最优候选 + 评分理由
    Agent->>API: 写入 creation 记录
    Agent->>Push: 推送"造梗完成"通知
    App->>API: 轮询/WS 拉取结果
    API-->>App: 返回最优候选 + 备选 2 条
```

**关键设计**：
- **异步任务化**：Agent 延迟 15-30s，不能阻塞 HTTP。走 BullMQ 队列，App 端进度条 + 完成推送通知（OneSignal），用户可退出工坊。
- **3 步上限**：不做视频脚本生成步（视频脚本由用户在视频模块单独触发，避免一次 Agent 调用串联昂贵模型）。
- **Pro 配额**：Pro 会员 Agent 调用上限 10 次/日，单次 prompt 模式无此限制。
- **失败降级**：Agent 任一步超时/失败，自动降级为单次 prompt 模式返回 3 候选，并退回 Agent 能量。
- **框架选型**：**Vercel AI SDK**（轻量、原生 TS、支持 tool calling/streaming）+ DeepSeek V3（支持 function calling）。LangChain.js 作为备选（更重，工具链更全）。
- **工具注册（预留）**：Agent 可调用 `search_meme`（RAG 检索）、`generate_image`（图片造梗，v1.5 接入）、`score_meme`（自评）。MVP 只启用 `search_meme` + `score_meme`，`generate_image` 留 v1.5。

#### 8.6.3 RAG 造梗知识库

- **向量化对象**：所有"神梗"（评分 ≥ 4.5 且评分人数 ≥ 50）梗卡的 title+tags+content，embedding 用 `bge-m3` 或 `text-embedding-3-small`（768 维）。
- **存储**：pgvector，与业务库同库。预估 1w 神梗 × 768 维 ≈ 30MB。
- **检索流程**：用户输入关键词 → embedding → pgvector 余弦检索 top5 → 作为 few-shot 示例拼入造梗 prompt。
- **更新策略**：梗卡状态变更为"神梗"时异步写入向量表；"降级为烂梗"时删除。

#### 8.6.4 推荐算法分期（细化 §9）

| 阶段 | 召回 | 排序 | 冷启动 |
| --- | --- | --- | --- |
| **MVP** | 热度分 Top + 简单 CF（按用户兴趣标签 + 同军团偏好） | 热度分线性加权 | 兴趣标签 + 全网热度 |
| **v1.5** | 双塔召回（用户塔 + 梗卡塔，pgvector ANN）+ CF | LightGBM 排序，特征 30+ | 多兴趣探索 |
| **v2.0** | 多路召回（向量/标签/图/行为） | 深度模型（DIN/DeepFM）+ 实时特征 | 强化学习探索 |

#### 8.6.5 PK 配对算法分期

- **MVP**：按军团等级 + 在线状态随机匹配，限制每日挑战次数。
- **v1.5**：引入 **ELO/MMR**，军团战力值 = 加权（成员梗力值中位数 + 历史 PK 胜率 + 神梗产出数），匹配时寻找战力差 ≤ 200 的对手，30s 内找不到则放宽。
- **v2.0**：联赛种子 + 赛季积分，支持跨军团联盟战。

#### 8.6.6 算法栈语言与部署

- **MVP 全部用 TS**（NestJS RecommendModule + 简单 CF/LR），与主业务同栈，个人维护成本最低。
- **v1.5 排序模型**：LightGBM 训练用 Python 离线脚本，导出为 ONNX 或 PMML，由 NestJS 加载推理（`lightgbm-js` / ONNX Runtime），不引入独立 Python 服务。
- **v2.0 深度模型**：抽离 `RecommendModule` 为独立 Python 推荐服务（§5.3 已预留边界），NestJS 通过 gRPC/HTTP 调用。

#### 8.6.7 成本影响（已并入 §4.5 / §4.11）

- Pro 造梗 Agent 单次 ≈ 3-4 次 LLM 调用 ≈ ¥0.05-0.08/次。
- 假设 Pro 渗透率 5%（500 人）× 日均 Agent 调用 2 次 = 1000 次/日 → 月成本 ≈ ¥1500-2400（仅 Pro Agent）。
- **风险**：Pro 渗透率超预期会显著推高成本。**对策**：Pro Agent 配额 10 次/日硬限 + 日预算熔断（超 ¥80/日自动降级为单次 prompt 模式）+ v1.5 评估自训小模型替代部分 LLM 调用。

---

## 9. 推荐与排序算法

### 9.1 热度分工程实现

PRD §8.1 热度分公式：

```
H = W1*评分加权分 + W2*log(1+评论数) + W3*log(1+转发数)
  + W4*log(1+完播率) + W5*时间衰减 + W6*PK加成 - W7*烂梗惩罚
```

**工程实现**：
- **Redis ZSet**：`hot_rank:daily` ZSet，member=meme_id，score=热度分。
- **触发时机**：
  1. 实时增量：评分/评论/转发事件触发增量更新（`ZINCRBY`）。
  2. 定时全量：每 10 分钟跑一次 cron job，对当日新梗重新计算完整热度分（处理时间衰减）。
- **时间衰减**：`exp(-Δt / 12h)`，Δt 为发布到现在的小时数；存 `published_at` 即可计算。
- **批量计算**：用 PG 聚合 + Redis pipeline 批量 ZADD，避免单条调用开销。

```typescript
async function recomputeHotScore() {
  const memes = await pg.query(`
    SELECT meme_id, 
      score_avg * ln(1 + score_count) AS w1,
      ln(1 + comment_count) AS w2,
      ln(1 + share_count) AS w3,
      ln(1 + completion_rate) AS w4,
      exp(-extract(epoch from now() - published_at) / 43200) AS w5,
      CASE WHEN god_trash_status='god' THEN 0.2 ELSE 0 END AS w6,
      CASE WHEN god_trash_status='trash' THEN 0.1 ELSE 0 END AS w7
    FROM meme_card 
    WHERE status='published' AND published_at > now() - interval '72 hours'
  `);
  const pipe = redis.multi();
  for (const m of memes) {
    const h = 0.30*m.w1 + 0.15*m.w2 + 0.25*m.w3 + 0.15*m.w4 + 0.10*m.w5 + 0.05*m.w6 - 0.10*m.w7;
    pipe.zadd('hot_rank:daily', h, m.meme_id);
  }
  await pipe.exec();
}
```

### 9.2 个性化推荐：混合召回 + 排序

```mermaid
flowchart LR
    subgraph 召回
        A1[向量召回<br/>pgvector 相似度]
        A2[标签召回<br/>兴趣标签匹配]
        A3[社交召回<br/>关注/同军团]
        A4[热度召回<br/>Redis ZSet]
        A5[新品召回<br/>24h 内新梗]
        A6[PK 上下文召回]
    end

    A1 & A2 & A3 & A4 & A5 & A6 --> MERGE[合并去重<br/>取 Top 500]
    MERGE --> RANK[排序层<br/>轻量 LR/GBDT]
    RANK --> DIVERSITY[多样性重排<br/>同作者/军团 ≤30%]
    DIVERSITY --> FEED[Feed 输出 20 条]
```

**召回策略**：
- **向量召回**：用 `user_embedding.behavior_vector` 在 `meme_embedding` 表做余弦相似 top 50。
- **标签召回**：用户兴趣标签 ∩ 梗卡标签，按热度排序取 top 50。
- **社交召回**：关注用户/同军团成员近期作品 top 30。
- **热度召回**：从 `hot_rank:daily` 取 top 100。
- **新品召回**：24h 内新梗按时间排序取 top 50（保证新梗曝光）。
- **PK 召回**：PK 期间双方军团梗卡加权召回。

**排序层（v1.0 轻量）**：
- 起步用 **逻辑回归 LR**（10~20 个特征），离线训练 + 在线打分。
- 特征：用户-梗卡相似度、热度分、新鲜度、神/烂梗标记、用户偏好（视频/图/文）、PK 上下文。
- v1.5 升级到 **LightGBM**，特征工程成熟后切。

**冷启动**：
- 新用户：用注册时选的 3~5 兴趣标签做标签召回 + 热度召回，混合比例 7:3。
- 新梗卡：进初始曝光池，前 100 次曝光不排序（按时间随机），收集信号后进正常排序。

### 9.3 评分系统（神梗/烂梗判定）

- **触发条件**：评分人数 ≥ 200 时触发判定。
- **判定逻辑**：
  - 神梗：综合分 ≥ 4.2 且 1 星占比 < 15%。
  - 烂梗：综合分 ≤ 2.5 且 1 星占比 > 50%。
- **评分加权**：
  - 普通用户 1.0x、评审官 1.5x、新用户（<3 天）0.5x、同军团成员 0.8x。
- **工程实现**：
  - 每次 `INSERT rating` 后异步触发 `recompute_meme_score(meme_id)`。
  - 用 PG 触发器或应用层 listener，更新 `meme_card.score_avg / score_count`。
  - 达 200 评分时调用 `judge_god_trash(meme_id)`，更新 `god_trash_status` + 触发通知 + 调整热度分。
  - 神梗 +30% 曝光（在排序层加 boost），烂梗 -70% 曝光。

---

## 10. 高并发与可用性

### 10.1 PK 投票峰值应对

- **峰值预估**：单场 PK 24h 内 1w DAU × 30% 参与 × 3 票 = 9w 票，平均 1 QPS，峰值（最后 1h）可能 100~500 QPS。
- **架构**：
  - 投票请求 → Cloudflare Workers（边缘限流）→ API → Redis（计数）+ Redis Streams（异步落 DB）。
  - 实时比分读 Redis ZSet，不读 DB。
- **限流**：
  - 边缘层：每 IP 每分钟 ≤ 30 次投票请求。
  - 应用层：每用户每场每天 ≤ 3 票。
  - DB 层：写入用队列削峰，DB 单点不直接承受峰值。

### 10.2 防刷体系

| 层 | 措施 |
| --- | --- |
| **网络层** | Cloudflare WAF + Bot Fight Mode（免费） |
| **设备层** | Canvas 指纹 + UA hash + 屏幕分辨率，生成 `device_id` 存 Redis 30 天 |
| **IP 层** | 单 IP 每分钟投票 ≤ 30、注册 ≤ 5、发帖 ≤ 10 |
| **行为层** | 短时高频行为打标（如 5 分钟内评分 > 20 次）→ 验证码挑战 |
| **业务层** | 同军团评分降权 0.8x、新用户评分降权 0.5x、评审官轮换 |
| **验证码** | 极验 / 腾讯防水墙免费档（5000 次/天）触发条件挑战 |
| **数据层** | 离线跑异常检测脚本，识别刷分团伙 → 标记 → 评分清零 |

### 10.3 缓存策略

| 数据 | 缓存层 | TTL | 防护 |
| --- | --- | --- | --- |
| 用户资料 | Redis | 30 分钟 | 写时失效 |
| 梗卡详情 | Redis + CF边缘 | Redis 10 分钟，CF 1 分钟 | 发布/评分变更时主动失效 |
| 热门榜单 | Redis ZSet | 实时增量 + 10 分钟全量刷新 | 单飞机制（singleflight）重建 |
| 军团信息 | Redis | 1 小时 | 写时失效 |
| 推荐 feed | Redis | 5 分钟 | 按 user_id 分片 |
| AI 生成结果 | Redis | 24h（prompt hash） | — |

**缓存击穿防护**：热点 key 用 singleflight（同时间只允许一个请求回源）。
**缓存雪崩防护**：TTL 加随机抖动 ±10%。
**缓存穿透防护**：不存在的 key 写空值（5 分钟 TTL）。

### 10.4 异步化与消息队列

| 选型 | 优势 | 适用场景 |
| --- | --- | --- |
| **Redis Streams** | 与 Redis 复用，无新组件；消费者组支持 | ⭐ MVP 主力 |
| BullMQ（基于 Redis） | NestJS 生态好，API 友好，含重试/延迟/定时 | ⭐ MVP 主力 |
| RabbitMQ | 成熟，但需额外部署运维 | 不推荐 MVP |
| Cloudflare Queues | 边缘队列，免费 1w 消息/天 | 仅边缘任务用 |

**MVP 用 BullMQ**：跑在同一 Redis 实例，包含重试、延迟、定时任务、优先级队列，足够 MVP。

---

## 11. 内容安全与审核

### 11.1 审核流程

```mermaid
flowchart LR
    UGC[UGC 内容<br/>梗卡/评论/军团/聊天] --> KW[敏感词库<br/>本地秒级]
    KW -->|命中| BLOCK[直接拦截]
    KW -->|未命中| AI_AUD[第三方内容安全 API<br/>阿里云/易盾]
    AI_AUD -->|通过| PUB[发布]
    AI_AUD -->|可疑| MANUAL[人工审核队列]
    AI_AUD -->|违规| BLOCK2[驳回 + 通知]
    MANUAL -->|通过| PUB
    MANUAL -->|违规| BLOCK2
    PUB --> RPT[用户举报触发再审]
    RPT --> MANUAL
```

### 11.2 各内容类型审核策略

| 内容类型 | 审核方式 | SLA | 服务 |
| --- | --- | --- | --- |
| 梗卡文本 | 敏感词 + 阿里云文本审核 | 机审 < 5s | 阿里云内容安全（10w 次/月免费） |
| 梗卡图片 | 阿里云图片审核 + AI 生成标识 | 机审 < 10s | 同上 |
| 梗卡视频 | 抽帧（1 帧/秒）+ 图片审核 + 音频转文字审核 | < 5 分钟 | 自建抽帧 + 阿里云 |
| 评论 | 敏感词 + 实时审核 | < 1s | 敏感词库为主，可疑走 API |
| 军团名称/口号 | 创建时人审 | < 2h | 运营后台队列 |
| 私聊/群聊 | 敏感词 + 抽样 API 审核 + 举报 | 实时 | 敏感词 + 阿里云抽样 |

### 11.3 敏感词库

- **来源**：开源词库（如 `sensitive_words` GitHub 项目）+ 自建补充。
- **分级**：政治 / 色情 / 暴恐 / 诈骗 / 未成年人保护 / 引战低俗。
- **匹配**：用 DFA（确定有限自动机）算法 +拼音变体 + 字符变形（繁体/拆字）过滤。
- **更新**：运营后台支持热更新，无需重启。

### 11.4 人工审核后台

- 基于 Next.js Admin，对接 AuditModule。
- 队列按优先级：举报 > 可疑 > 抽检。
- 审核动作：通过 / 删除 / 隐藏 / 封禁用户 / 标记误判回流训练。
- SLA 看板：实时显示队列长度、平均处理时长。

### 11.5 AI 生成内容合规

- **标识**：所有 AI 生成内容必须带"AI 生成"角标 + 详情页声明（§8.5）。
- **日志**：AI 调用 prompt + 输出留存 6 个月。
- **深度合成**：MVP 不开放人脸/声音克隆。
- **模型备案**：上线前完成生成式 AI 服务备案（如需）。

---

## 12. 客户端架构

### 12.1 技术栈选型

> 经技术选型评审定稿：**MVP 采用 React Native + Expo**，v2.0 视情况用 Flutter 重写 App。Web 端独立用 Next.js，App 与 Web 共享 `packages/shared`（TS 类型、API client、常量、AI prompt 模板）。

| 方案 | 跨端能力 | 与后端/Web 复用 | 热更新 | AI/视频插件生态 | 成本 | 推荐 |
| --- | --- | --- | --- | --- | --- | --- |
| **React Native + Expo（新架构 Fabric）** | iOS / Android（+ Web via react-native-web） | ✅ 与 NestJS/Next.js 同语言 TS，可共享 `packages/shared` | ✅ Expo Update / CodePush，合规绕过商店审核 | ✅ react-native-video / expo-video / onnxruntime-react-native / ffmpeg 生态成熟 | ¥0 | ⭐ **MVP 主力** |
| Flutter（Impeller） | iOS / Android / Web | ❌ Dart 双语言栈，业务逻辑无法复用 | ❌ 官方禁动态下发，shorebird 合规灰区 | ⚠️ 视频/AI 插件质量参差，需自研 plugin | ¥0 | v2.0 候选（仅当 PK 动画质感成为核心卖点） |
| Taro 4 + React | H5 / 微信小程序 / RN | ✅ 全栈 TS | ✅ 小程序天然热更 | ⚠️ RN 编译体验不如原生 RN+Expo | ¥0 | 备选（仅当要保留微信小程序首发） |
| uni-app + Vue | 同 Taro | ❌ Vue 与后端 TS 断裂 | ✅ | ⚠️ | ¥0 | 不推荐 |

**MVP 路线（已定稿）**：
1. **v1.0 MVP**：React Native + Expo（managed workflow + EAS Build/Submit），iOS + Android 双端。Web 端独立 Next.js 部署 Vercel，作为低成本引流与运营后台入口。
2. **v1.5**：评估 Expo Update 灰度策略、端侧 AI 推理（onnxruntime）做"造梗候选预筛"降低服务端成本。
3. **v2.0**：若 PK 动画/梗卡特效体验成为用户留存核心驱动，启动 Flutter 重写评估；否则继续深化 RN + react-native-reanimated + react-native-skia 动画能力。

**为什么不选 Flutter（MVP）**：
- 个人开发者最大的稀缺资源是"心智带宽"。Flutter 引入 Dart 后，与 NestJS(TS)/Next.js(TS) 的业务逻辑、类型定义、API client、AI prompt 模板无法复用，App 端业务要从零重写，维护两套语言栈。
- AI 编排生态在 JS 侧最丰富（LangChain.js / Vercel AI SDK），Dart 侧无对等方案；MVP 已规划 Pro 造梗 Agent，端侧也需要 AI 工具调用能力，RN 更契合。
- UGC 社区迭代频繁（敏感词、prompt、活动配置），Expo Update 可秒级绕过商店审核下发 JS bundle；Flutter 热更新合规风险高。
- Flutter 唯一明显胜出的"PK 动画流畅度"可用 `react-native-reanimated` + `react-native-skia` 补齐到"够用"，不构成 MVP 翻盘理由。

**何时迁 Flutter**：仅在 v2.0 数据证明"PK 动画质感"是留存核心驱动、且团队已具备 Dart 能力时启动，否则继续深化 RN。

### 12.2 客户端分层

```
packages/shared/        三端共享：TS 类型、API client、常量、AI prompt 模板
app/                    React Native + Expo 应用
├── src/
│   ├── api/            网络层（fetch 封装、错误处理、重试）
│   ├── components/     通用组件（按设计系统）
│   ├── pages/          页面（按 5 个 Tab 组织）
│   ├── modules/        业务模块（user/meme/legion/pk/chat）
│   ├── store/          状态管理（Zustand）
│   ├── hooks/          自定义 Hook
│   ├── utils/          工具（埋点、设备指纹、弱网）
│   └── styles/         样式（NativeWind / StyleSheet）
web/                    Next.js Web 端（独立项目，复用 packages/shared）
```

### 12.3 状态管理

- **Zustand**：轻量、API 简单、TypeScript 友好，避免 Redux 模板代码。
- **服务器状态**：TanStack Query（React Query）负责缓存、重试、分页。
- **IM 状态**：独立 store + WebSocket 连接管理。

### 12.4 网络层

- **请求库**：基于 `fetch` 的统一封装（Expo 环境兼容），统一处理 token、错误码、重试。
- **接口规范**：RESTful + JWT（Authorization Header），响应统一 `{code, data, message}`。
- **错误码**：401 触发重新登录、429 触发限流提示、5xx 触发重试。
- **超时**：默认 10s，AI 生成接口 35s，Agent 异步任务走提交-轮询/推送模式（见 §8.6）。

### 12.5 IM SDK 接入

- **私聊/通知**：Supabase Realtime SDK（订阅 channel + 表变更）。
- **军团群聊**：自建 WebSocket（React Native WebSocket + 心跳 + 断线重连）。
- **消息存储**：本地 SQLite（expo-sqlite）缓存最近 100 条/会话，离线可读。

### 12.6 离线/弱网策略

- **请求队列**：弱网时请求本地排队，恢复后批量重试（写操作）。
- **乐观更新**：评分/点赞/评论先本地更新 UI，再异步同步服务端，失败回滚。
- **骨架屏**：所有列表页用骨架屏，避免白屏。
- **图片渐进加载**：低质量占位图（LQIP）+ 懒加载 + WebP。
- **视频预加载**：首帧预加载 + 按需缓冲，CDN 边缘缓存。

---

## 13. 部署与 DevOps

### 13.1 CI/CD

- **GitHub Actions**：公开仓无限分钟，私有仓 2000 分钟/月免费。
- **流程**：
  1. Push → 触发 lint + typecheck + 单测。
  2. PR → 触发 + 构建 + 预览部署（Vercel Preview / CF Pages Preview）。
  3. Merge to main → 构建镜像 → 部署到轻量云（SSH + docker-compose）+ 发布到 Vercel/CF Pages。
- **镜像**：用 Docker，docker-compose 编排 NestJS + Redis + PG 在单台轻量云上（MVP 期）。

### 13.2 部署架构

```mermaid
flowchart TB
    subgraph Cloudflare 边缘
        CF_CDN[CDN + WAF]
        CF_PAGES[Pages: Web/Admin]
        CF_R2[R2 存储]
        CF_WK[Workers: 边缘逻辑]
    end

    subgraph Vercel
        WEB[Web/Next.js]
    end

    subgraph 国内轻量云
        BE[NestJS 主后端]
        DB[(PostgreSQL+pgvector)]
        REDIS[(Redis)]
        WORKER[Worker 进程]
        FFMPEG[ffmpeg 工具]
    end

    subgraph 第三方SaaS
        SUPA[Supabase Auth/Realtime]
        AI[AI Providers]
        AUD[内容安全]
        PUSH[OneSignal]
        ANALYTICS[PostHog]
    end

    USER[国内用户] --> CF_CDN
    CF_CDN --> CF_WK
    CF_WK --> BE
    BE --> DB & REDIS & SUPA & AI & AUD
    WORKER --> DB & REDIS & AI & AUD & CF_R2
    BE --> CF_R2
    BE --> PUSH & ANALYTICS
    CF_CDN --> CF_PAGES
    CF_CDN --> WEB
```

### 13.3 域名与备案

- **主域名**：`meme.xyz` 或 `gengstar.cn`（待定），建议 .com 或 .cn。
- **ICP 备案**：个人备案 7~20 天，MVP 立即启动。
- **HTTPS**：Cloudflare 免费证书 + Let's Encrypt 备用。
- **国内 CDN**：备案后可切七牛云做国内加速（如需）。

### 13.4 环境划分

| 环境 | 用途 | 部署 |
| --- | --- | --- |
| dev | 本地开发 | docker-compose 本地 |
| staging | 联调 + 灰度 | 轻量云二级目录 / Vercel Preview |
| prod | 生产 | 轻量云主域名 + Vercel/CF Pages |

**配置管理**：用 `.env` + 数据库配置表，敏感信息走 GitHub Secrets + SSH 部署时注入。

### 13.5 备份策略

- **PG**：每日全量 + WAL 归档，备份到 R2（跨地域）。
- **Redis**：RDB 每日 + AOF（按需），仅缓存数据无需强一致。
- **R2**：跨区域复制（Cloudflare 内置）。
- **恢复演练**：每月一次。

---

## 14. 数据埋点与监控

### 14.1 埋点 SDK 选型

| 选型 | 免费档 | 优势 | 推荐 |
| --- | --- | --- | --- |
| **PostHog Cloud** | 1M 事件/月 | 漏斗/留存/热图/AB/Feature Flag 一站式 | ⭐ MVP 主力 |
| Umami 自部署 | 完全免费 | 隐私友好，无第三方 | 备选 |
| 自建埋点 | ¥0 | 完全可控 | 与 PostHog 互补（关键事件双写） |

**推荐**：PostHog Cloud 主力（埋点 + 看板 + AB），关键业务事件（meme_publish/pk_vote/pro_subscribe）同步写一份到自建 PG `analytics_event` 表，做自定义分析。

### 14.2 埋点事件实现

对应 PRD §10.3 的 17 个关键事件，统一通过客户端 `track(eventName, props)` 上报：

```typescript
// 客户端埋点 SDK 封装
class Tracker {
  track(name: string, props: Record<string, any>) {
    posthog.capture(name, props);        // PostHog
    api.post('/analytics/event', { name, props });  // 自建（关键事件）
  }
}
```

服务端事件（如 `god_meme_trigger`）由后端直接写入，避免客户端漏报。

### 14.3 看板方案

- **PostHog Dashboard**：DAU/MAU、留存、漏斗（造梗→发布→神梗）、AB 实验报告。
- **自建看板**（Next.js Admin + ECharts）：
  - 实时：在线人数、PK 实时比分、当日造梗数、AI 成本（实时）。
  - 离线：神梗率、评分参与率、军团加入率、Pro 付费率。
- **告警**：
  - Sentry：错误率突增。
  - UptimeRobot：API 不可用。
  - 自建：AI 日成本超阈值（用 PostHog Watchdog 或定时任务）。

### 14.4 监控矩阵

| 维度 | 工具 | 关键指标 |
| --- | --- | --- |
| 错误 | Sentry | 错误率、崩溃率、慢查询 |
| 性能 | Sentry Performance + 自建 | API P95、AI 生成耗时 |
| 可用性 | UptimeRobot | API/CDN 拨测 |
| 业务 | PostHog + 自建看板 | 见 §14.3 |
| 资源 | 轻量云自带监控 | CPU/内存/磁盘/带宽 |
| AI 成本 | 自建 `ai_cost_log` 表 + 看板 | 日/月成本、单用户成本 |

---

## 15. 安全与合规

### 15.1 用户隐私

- **最小化采集**：仅采集必要信息（手机号、昵称、兴趣标签）。
- **隐私政策 + 用户协议**：上线前法务审核，首次启动强制弹窗确认。
- **数据加密**：
  - 传输：全站 HTTPS（TLS 1.3）。
  - 存储：DB 敏感字段（手机号）AES-256 加密。
  - 密码：不存储（用 Supabase Auth / OAuth）。
- **数据导出/注销**：用户可一键导出个人数据 + 注销账号（PRD §9 已要求），30 天硬删除。

### 15.2 未成年人保护

- **青少年模式**（PRD §9.3）：实名年龄 < 18 或主动开启。
- **限制**：每日 ≤ 40 分钟、22:00–6:00 禁用、禁发布/评分/私信/加入军团。
- **内容**：仅展示正能量精选池，屏蔽 AI 视频生成。
- **强制实名**：MVP 用手机号实名（运营商三要素），后续对接公安二要素。

### 15.3 AI 生成内容合规

- **《生成式 AI 服务管理办法》合规要点**：
  - 第十条：AI 生成内容显著标识 → 所有 AI 梗卡/视频带"AI 生成"角标。
  - 第十一条：用户违法生成 → 服务协议明确禁止 + 内容审核拦截。
  - 第十二条：标识 → 梗卡详情页"AI 辅助创作"声明。
  - 第十四条：备案 → 上线前完成生成式 AI 服务备案（v1.1 已定稿为上线 gate）。
    - **备案要求**：MVP 上线前必须完成"生成式人工智能服务备案"（网信办），未备案不得对外提供服务。
    - **备案内容**：模型来源（豆包 Seedance / DeepSeek / SiliconFlow 等）、训练数据说明、安全评估报告、内容审核机制、用户协议与隐私政策。
    - **时间线**：备案与开发并行，预计 1-2 个月；M1 启动备案材料准备，M2 提交，M3 上线前取得备案号。
    - **依赖**：使用已备案模型（豆包 Seedance 已在字节侧完成模型备案，可作为应用方备案的重要支撑材料）可降低备案难度。
    - **风险**：备案未通过则 MVP 不得上线，需预留 2 周缓冲。
  - 第十五条：违规处置 → 阻断 + 报告 + 模型优化。
- **深度合成**（如未来开放人脸/声音）：需走《深度合成管理规定》备案 + 显著标识。

### 15.4 数据安全

- **SQL 注入**：全程参数化查询（TypeORM / Prisma）。
- **XSS**：客户端转义 + CSP Header（Cloudflare 配置）。
- **CSRF**：JWT 方案天然防 CSRF（不用 Cookie）。
- **DDoS**：Cloudflare 免费档已有基础防护 + Bot Fight Mode。
- **接口鉴权**：所有 API 必须带 JWT（除健康检查 + 公开 feed）。
- **频控**：见 §10.2。

---

## 16. MVP 技术范围与迭代计划

### 16.1 v1.0 MVP 技术交付清单

**后端**：
- [x] NestJS 模块化单体框架搭建（15 个 Module）。
- [x] PostgreSQL + pgvector + Redis 部署。
- [x] Supabase Auth 集成（手机号 + OAuth）。
- [x] AI 编排层（LLM/图像/视频/TTS 适配器 + 降级策略）。
- [x] 梗卡 CRUD + 发布 + 审核（机审）。
- [x] 文本/图片/视频造梗异步任务。
- [x] **Pro 造梗 Agent（3 步精简版：RAG 检索→3 候选→自评选优）**，BullMQ 异步 + 推送通知，10 次/日硬配额 + 日预算熔断。
- [x] **RAG 造梗知识库**（神梗向量化 + pgvector 检索 top5 作为 few-shot）。
- [x] 评分 + 神/烂梗判定。
- [x] 军团 CRUD + 成员管理 + 群聊（自建 WebSocket）。
- [x] PK：投票 PK + 造梗对决，Redis 计数 + 结算。
- [x] 私聊（Supabase Realtime）+ 系统通知。
- [x] 推荐：向量召回 + LR 排序（v1 简化版）。
- [x] 热度分 Redis ZSet + 定时计算。
- [x] 运营后台基础（审核队列、用户封禁、数据看板）。
- [x] 埋点 SDK + PostHog 集成。
- [x] **Pro 会员体系 + 微信支付接入**（承载 Agent 与视频高配额）。

**客户端**：
- [x] React Native + Expo 框架 + 5 Tab 信息架构（Web 端独立 Next.js）。
- [x] 共享层 `packages/shared`（TS 类型、API client、AI prompt 模板）。
- [x] 登录 + 兴趣标签 + 主页。
- [x] 造梗工坊（文本/图片/视频 + **Pro Agent 模式入口**）。
- [x] 推荐 feed + 梗卡详情 + 评分/评论/转发。
- [x] 军团广场 + 军团主页 + 群聊。
- [x] PK 大厅 + 投票 + 战报。
- [x] 私聊 + 系统通知。
- [x] 我的 + 青少年模式 + 设置。
- [x] Expo Update 热更新通道搭建。

**基础设施**：
- [x] Cloudflare（CDN + R2 + Workers + WAF）。
- [x] 国内轻量云 + Docker + docker-compose。
- [x] GitHub Actions CI/CD。
- [x] Sentry + UptimeRobot + PostHog。
- [x] 域名 + ICP 备案。
- [x] **生成式 AI 服务备案**（M1 启动材料准备，M2 提交，M3 上线前取得备案号，作为上线 gate）。

### 16.2 技术债清单

| 技术债 | 影响 | 计划解决版本 |
| --- | --- | --- |
| 单机部署（无 HA） | 单点故障 | v1.5 双机 + 主从 |
| Redis 单机 | 缓存单点 | v1.5 Redis Cluster 或多 AZ |
| 自建 WebSocket 无分布式 | 单机上限 ~1w 连接 | v1.5 引入 Centrifugo 或集群 |
| 推荐算法 LR 简化 | 推荐质量一般 | v1.5 LightGBM + 特征工程 |
| 视频审核仅抽帧 | 漏检风险 | v1.5 接入专业视频审核 API |
| 无 AB 实验平台 | 数据驱动受限 | v1.5 用 PostHog Experiment |
| 无服务追踪 | 故障定位慢 | v1.5 接入 OpenTelemetry |
| 监控仅 Sentry | APM 不足 | v1.5 接入自建 Prometheus |

### 16.3 v1.5 / v2.0 技术演进

**v1.5**：
- AI 编排层抽离为独立 Gateway 服务。
- 推荐服务独立部署，引入 LightGBM + 实时特征。
- 双机部署 + Redis Cluster。
- AB 实验平台（PostHog Experiment）。
- 专业视频审核 API。
- Pro 会员权益扩展（装扮/专属模板/去广告等，支付通道 v1.0 已开）。
- 创作者数据看板。
- **造梗 Agent 升级**：开放全用户、增加视频脚本生成步、引入 LLM-as-Judge 梗质量预评分。
- **PK 配对升级为 ELO/MMR**。
- **端侧 AI 推理**（onnxruntime-react-native）做"造梗候选预筛"降本。

**v2.0**：
- PK 服务独立高并发部署。
- 推荐服务切换 Python 栈（深度模型 DIN/DeepFM + 实时特征）。
- 实时特征平台（Flink 或简化版 Redis Stream + 聚合）。
- 联盟战 / 季度锦标赛高并发场景架构。
- 语音房（声网 / 腾讯 TRTC）。
- 品牌梗营销投放系统（广告投放引擎）。
- 海外版本（多区域部署 + 数据合规）。
- **Flutter 重写评估**：若数据证明 PK 动画质感为留存核心驱动则启动，否则继续深化 RN + Skia。
- **个性化造梗 Agent**（用户长期记忆 + 偏好画像）。

---

## 17. 风险与开放问题

### 17.1 技术风险

| 风险 | 等级 | 应对 |
| --- | --- | --- |
| **AIGC 成本失控**（视频生成·豆包 Seedance） | 高 | 豆包单价 ¥1~¥2.5/5s 较 SiliconFlow 高 5-10 倍；MVP 灰度 DAU ≤ 500~2000 + 兜底覆盖率 40-60% + Pro 限 3 次/日 + 日预算 ¥200 硬熔断 + v1.5 评估自训小模型 |
| **Pro 造梗 Agent 成本失控** | 高 | 10 次/日硬配额 + 日预算 ¥80 熔断降级为单次 prompt + v1.5 评估自训小模型替代 |
| Supabase 国内访问慢 | 中 | Cloudflare 代理 + 关键数据迁回国内 PG |
| 单机部署无 HA | 中 | v1.5 双机；MVP 期接受短暂宕机 |
| Cloudflare R2 国内访问慢 | 中 | 热点视频七牛云镜像；R2 主要服务海外与存储 |
| AI 生成质量不稳定 | 中 | Prompt 模板预设 + 多候选 + 用户筛选 + 模型切换 |
| 第三方 AI 服务故障 | 中 | 多 provider + 降级链 + 本地模型兜底 |
| 内容合规漏审 | 高 | 双重审核 + 人工抽检 + 应急熔断 + 敏感词热更新 |
| 个人开发者运维负担 | 中 | 自动化 CI/CD + 监控告警 + Serverless 优先 |

### 17.2 第三方依赖风险

| 依赖 | 风险 | 缓解 |
| --- | --- | --- |
| DeepSeek API | 涨价/限流 | 多 provider 轮换 + GLM 免费兜底 |
| SiliconFlow | 服务不稳定 | 通义万相 fallback |
| Supabase | 政策变更/停服 | 数据模型可迁移到自建 PG |
| Cloudflare R2 | 国内访问受限 | 七牛云备选镜像 |
| 阿里云内容安全 | 免费额度取消 | 易盾备用 + 自建敏感词为主 |

### 17.3 需要和用户/产品确认的技术决策点

> 以下决策直接影响成本与架构。**v1.1 评审已定稿 3 项**（标注 ✅），其余待进一步对齐：

1. ✅ **视频生成配额策略**（已定稿）：免费用户 1 次/周（需任务解锁）+ 默认图片TTS兜底，Pro 3 次/日（v1.1 从 10 次下调，对齐豆包成本现实）。
2. ✅ **MVP 视频生成模型**（已定稿）：字节豆包 Seedance 2.0 mini（MVP 主力）+ Seedance 2.0 标准版（Pro 高端）+ SiliconFlow/即梦 fallback。火山方舟 API 接入。详见 §4.7。
3. ✅ **客户端首发平台**（已定稿）：MVP 用 React Native + Expo（iOS + Android 双端），Web 端独立 Next.js；v2.0 视情况评估 Flutter 重写。
4. ✅ **数据部署区域**（已定稿）：主数据放国内自建 PG（含 pgvector），Supabase 仅做 Auth + Realtime，用户表通过 Supabase Webhook 同步到国内 PG。详见 §4.3。
5. ✅ **IM 方案**（已定稿）：私聊 + 系统通知用 Supabase Realtime（免费档）；军团群聊自建 WebSocket（NestJS Gateway + Redis pubsub + PG 持久化，¥0 增量成本，~1-2 周开发量）；v1.5 评估 Centrifugo，v2.0 评估 OpenIM。详见 §4.8。
6. ✅ **AIGC 备案**（已定稿）：**MVP 上线前必须完成生成式 AI 服务备案**（合规硬性要求，未备案不得对外提供服务）。备案与开发并行，预计 1-2 个月，作为上线 gate。详见 §15.3。
7. ✅ **Pro 会员定价与支付**（已定稿）：Pro 月费 **¥18** 起，MVP 即开微信支付；建议同步上线"视频按次包"（¥9.9/10次、¥29.9/50次）对冲豆包成本。
8. **军团数量上限**：MVP 全网军团是否限 1000 个以控成本？PRD §13.2 已列为开放问题。
9. **站外分享策略**：是否允许无水印下载视频到抖音/微信？影响流量与裂变。
10. **视频生成兜底方案可接受性**：图片+TTS+Ken Burns 的"伪视频"作为免费用户默认体验（覆盖率 40-60%），是豆包成本可控的关键前提，需产品确认接受。
11. ✅ **造梗 Agent 范围**（已定稿）：MVP 引入但 **Pro 会员专属**，3 步精简版（RAG→3候选→自评），10 次/日硬配额 + 日预算 ¥80 熔断；免费用户保持单次 prompt 模式。v1.5 全用户开放。
12. ✅ **后端是否引入 Go**（已定稿）：MVP 维持全 NestJS，仅当 PK 投票峰值到 DAU 10w+ 且 Redis 优化到极限时，单独把 PK 服务抽出来用 Go 重写。接受渐进路线。

---

## 附录 A：关键配置文件示例

### docker-compose.yml（单机部署）

```yaml
version: '3.8'
services:
  app:
    build: ./backend
    ports: ['3000:3000']
    env_file: .env
    depends_on: [postgres, redis]
    restart: always
  worker:
    build: ./backend
    command: node worker.js
    env_file: .env
    depends_on: [postgres, redis]
    restart: always
  postgres:
    image: pgvector/pgvector:pg16
    volumes: ['pg_data:/var/lib/postgresql/data']
    environment:
      POSTGRES_DB: meme
      POSTGRES_PASSWORD: ${PG_PASSWORD}
    restart: always
  redis:
    image: redis:7-alpine
    volumes: ['redis_data:/data']
    command: redis-server --appendonly yes
    restart: always
volumes:
  pg_data:
  redis_data:
```

### .env 模板

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:${PG_PASSWORD}@postgres:5432/meme
REDIS_URL=redis://redis:6379
JWT_SECRET=${JWT_SECRET}

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# AI Providers
DEEPSEEK_API_KEY=xxx
GLM_API_KEY=xxx
SILICONFLOW_API_KEY=xxx
TONGYI_API_KEY=xxx
VOLCANO_TTS_APPID=xxx
VOLCANO_TTS_TOKEN=xxx

# Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY=xxx
R2_SECRET_KEY=xxx
R2_BUCKET=memestar

# 内容安全
ALIYUN_AUDIT_ACCESS_KEY=xxx
ALIYUN_AUDIT_SECRET_KEY=xxx

# 监控
SENTRY_DSN=xxx
POSTHOG_KEY=xxx
```

---

## 附录 B：参考资料

- PRD v1.1.0：`docs/PRD.md`
- 《生成式人工智能服务管理暂行办法》
- 《互联网信息服务深度合成管理规定》
- Cloudflare R2 文档：https://developers.cloudflare.com/r2/
- Supabase 文档：https://supabase.com/docs
- DeepSeek API 定价：https://api-docs.deepseek.com/quick_start/pricing
- SiliconFlow 文档：https://docs.siliconflow.cn/
- NestJS 文档：https://docs.nestjs.com/
- Taro 文档（备选）：https://docs.taro.zone/
- Expo 文档：https://docs.expo.dev/
- React Native 文档：https://reactnative.dev/
- Vercel AI SDK：https://sdk.vercel.ai/

---

> 本技术设计文档为 v1.0 立项版，待评审通过后进入详细设计与编码阶段。各模块详细接口文档、数据库 DDL、部署脚本将在评审通过后由对应模块产出。
