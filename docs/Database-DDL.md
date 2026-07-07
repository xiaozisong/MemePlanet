# Database-DDL · 「梗星球」MemeChatAI 数据库设计说明

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0.0 |
| 作者 | 数据库架构 / 个人开发者 |
| 创建日期 | 2026-07-07 |
| 关联技术设计 | `TechnicalDesign.md` v1.1.0 |
| 关联产品需求 | `PRD.md` v1.1.0 |
| 数据库 | PostgreSQL 16 + pgvector 0.7+ |
| 关联 DDL | `docs/db/schema.sql` v1.0.0 |
| 关联种子 | `docs/db/seed.sql` v1.0.0 |
| 字符编码 | UTF-8 |

> 本文档严格对齐已落盘的 `docs/db/schema.sql` 与 `docs/db/seed.sql`，所有表名、字段名、索引名均以 SQL 文件为权威来源。ER 关系图见 `TechnicalDesign.md` §6.1，本文不重复绘制。

---

## 1. 设计总览

`schema.sql` 为生产级 DDL 脚本，幂等可重复执行（全部使用 `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`），覆盖 13 个业务域共 **50 张表**（含 4 张分区默认子表 `ratings_default` / `messages_default` / `audit_logs_default` / `ai_cost_logs_default`），**106 个索引**，3 个向量表，4 张分区表，2 个视图，2 个物化视图，1 个公共触发器函数（`set_updated_at`）以及 1 个全文检索维护函数（`meme_title_tsv_trigger`）。

`seed.sql` 在 `schema.sql` 基础上提供 15 类种子数据（运营账号、官方 Prompt、TTS 音色、敏感词样例、军团、神梗、普通用户、物化视图初始刷新等），同样幂等。

---

## 2. 设计原则

### 2.1 命名规范

| 维度 | 规范 | 示例 |
| --- | --- | --- |
| 表名 | 复数 / snake_case；多对多关联表用双方实体名拼接 | `users`、`meme_cards`、`meme_card_tags` |
| 字段名 | snake_case；布尔字段前缀 `is_`；时间字段后缀 `_at` | `is_pro`、`is_god_meme`、`created_at` |
| 主键 | 单数实体名 + `_id` | `user_id`、`meme_id`、`pk_id` |
| 外键 | 引用表字段名 + `_id` | `author_id`、`legion_id` |
| 索引 | `idx_<表>_<列|语义>`；唯一索引 `uq_`；部分索引名后缀语义 | `idx_meme_cards_hot_score` |
| 触发器 | `trg_<表>_<事件>` | `trg_users_updated_at` |
| 约束 | `chk_<表>_<语义>` | `chk_meme_status` |
| 物化视图 | `mv_<语义>` | `mv_user_meme_power` |
| 视图 | `v_<语义>` | `v_hot_meme_cards` |

> 说明：`schema.sql` 头部注释自述「所有表为复数命名」，与 SQL 中 `meme_cards`、`users` 等实际命名一致；`TechnicalDesign.md` §6.1 中 ER 图沿用旧单数命名（如 `MEME_CARD`、`ARMY_MEMBER`），文档与 SQL 之间以 SQL 为准（如 ER 中 `ARMY_MEMBER` 对应 SQL 中 `legion_members`）。

### 2.2 主键策略

- 主键统一 `uuid` + `DEFAULT gen_random_uuid()`（PG13+ 内置，无需 `uuid-ossp`，但脚本兼容保留扩展）。
- 字典类小表使用 `smallserial` / `bigserial` 主键以节省存储：`meme_tags.tag_id` (`smallserial`)、`sensitive_words.word_id` (`bigserial`)、`legion_levels.level` (`int`)。
- 关联表（如 `user_follows`、`meme_card_tags`、`comment_likes`、`favorites`、`message_reads`）使用复合主键，自然唯一。
- 分区表主键必须包含分区键：`ratings (score_id, created_at)`、`messages (message_id, created_at)`、`audit_logs (audit_id, created_at)`、`ai_cost_logs (log_id, created_at)`。

### 2.3 时间戳

- 全部使用 `timestamptz`（带时区），避免跨地域歧义。
- `created_at` / `updated_at` 默认 `now()`，由 `set_updated_at()` 触发器在 `BEFORE UPDATE` 时自动维护 `updated_at`。
- 软删除字段 `deleted_at`（`users`、`meme_cards`、`legions`、`comments`）默认 NULL，部分索引用 `WHERE deleted_at IS NULL` 过滤已删除数据。

### 2.4 软删除

仅对"内容/账号"型表启用 `deleted_at`：`users`、`meme_cards`、`legions`、`comments`。互动类表（`ratings`、`shares`、`favorites`、`pk_votes` 等）通过外键 `ON DELETE CASCADE` 物理删除；审计与日志类表不允许删除。

### 2.5 jsonb + GIN 索引

- 适合存半结构化字段：兴趣标签、勋章、隐私偏好、通知 payload、AI 元数据、敏感词变体等。
- 凡用于查询过滤的 jsonb 字段均加 GIN 索引：
  - `user_profiles.interest_tags` → `idx_user_profiles_interest_tags`
  - `meme_cards.tags` → `idx_meme_cards_tags_gin`
  - `legions.theme_tags` → `idx_legions_theme_tags`
  - `messages.extra` → `idx_messages_extra_gin`
  - `ratings.dimensions` → `idx_ratings_dimensions_gin`
- 仅展示型 jsonb（如 `metadata`、`payload`、`raw_payload`）不加索引，避免写入开销。

### 2.6 索引策略

| 策略 | 说明 | 示例 |
| --- | --- | --- |
| 部分索引（Partial） | 用 `WHERE` 过滤高频查询子集，减小索引体积 | `idx_meme_cards_hot_score ... WHERE status = 'published' AND deleted_at IS NULL` |
| 表达式索引 | 对函数表达式建索引 | `idx_pk_votes_user_date ON (user_id, date_trunc('day', voted_at))`、`idx_ai_cost_daily ON (date_trunc('day', created_at), module)` |
| 模糊检索 GIN | `pg_trgm` + `gin_trgm_ops` 支持中文 LIKE / 相似度 | `idx_users_nickname_trgm`、`idx_meme_tags_name_trgm`、`idx_sensitive_words_word_trgm` |
| 大小写不敏感 GIN | `citext` 列用 `citext_ops` | `idx_legions_name_trgm ON legions USING gin (name citext_ops)` |
| 全文检索 GIN | `tsvector` 列 + 触发器维护 | `idx_meme_cards_title_tsv` |
| 向量 HNSW | `vector_cosine_ops` 余弦距离 | `idx_meme_embeddings_hnsw ... WITH (m = 16, ef_construction = 64)` |
| 复合索引 | 按查询模式 `(filter, sort)` 顺序建 | `idx_creations_user_created (user_id, created_at DESC)` |
| 唯一约束 | 业务唯一性兜底 | `UNIQUE (meme_id, user_id)`、`UNIQUE (legion_id, user_id)`、`UNIQUE (creation_id, idx)` 等 |

### 2.7 分区策略

按 `created_at` 时间范围 RANGE 分区，MVP 阶段仅建 `DEFAULT` 分区兜底所有未匹配数据，待数据量增长后按月切分：

| 表 | 分区键 | MVP | 未来 |
| --- | --- | --- | --- |
| `ratings` | `created_at` | `ratings_default` | `ratings_YYYY_MM` |
| `messages` | `created_at` | `messages_default` | `messages_YYYY_MM` |
| `audit_logs` | `created_at` | `audit_logs_default` | `audit_logs_YYYY_MM` |
| `ai_cost_logs` | `created_at` | `ai_cost_logs_default` | `ai_cost_logs_YYYY_MM` |

详见 §7 分区表设计。

---

## 3. 扩展与初始配置

`schema.sql` 第 0 节安装以下扩展：

| 扩展 | 作用 |
| --- | --- |
| `vector` | pgvector 向量库，提供 `vector(768)` 类型与 HNSW/IVFFlat 索引 |
| `pg_trgm` | 三元组模糊检索，支持中文 LIKE / 相似度排序，配合 `gin_trgm_ops` |
| `citext` | 大小写不敏感文本类型，用于 `users.email`、`legions.name` |
| `uuid-ossp` | 兼容保留；实际主键用 PG13+ 内置 `gen_random_uuid()` |
| `btree_gin` | 允许 btree 列与 jsonb 列组合 GIN 索引（预留，便于后续复合索引扩展） |

初始配置：

- 通过 `DO $$ ... END$$` 幂等创建应用角色 `app`（`NOSUPERUSER NOCREATEDB NOCREATEROLE`，密码 `change_me_in_prod` 需在生产环境替换）。
- 设置 session 级 `statement_timeout = '30s'`、`lock_timeout = '5s'`、`default_text_search_config = 'simple'`（中文走自定义分词，simple 兜底；生产可换 `zhparser`）。
- 默认使用 `public` schema；如需多租户可拆 schema。
- 收尾段保留了 `GRANT` 模板（默认注释），生产部署按需放开并对新分区单独 GRANT。

公共函数：

- `set_updated_at()`：触发器函数，`BEFORE UPDATE` 时把 `NEW.updated_at = now()`，所有带 `updated_at` 的表都挂载同名触发器 `trg_<表>_updated_at`。
- `meme_title_tsv_trigger()`：在 `meme_cards` 上 `BEFORE INSERT OR UPDATE OF title` 时维护 `title_tsv := to_tsvector('simple', NEW.title)`，配合 GIN 索引实现标题全文检索。

---

## 4. 完整表清单（按业务域分组）

> 下文按 `schema.sql` 的章节顺序（域 3 ~ 域 15）逐域列出表清单。每张表给出用途、关键字段、关键索引、关联关系。索引列名沿用 SQL 中 `idx_xxx` 命名。

### 4.1 用户域 / User Domain（5 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `users` | 用户主表（与 Supabase Auth 同步） | `user_id` PK、`supabase_uid` UNIQUE、`phone`/`email` UNIQUE、`meme_power`、`defense_value`、`energy_balance`、`status`、`is_pro`、`is_official`、`deleted_at` | `idx_users_nickname_trgm`(gin trgm)、`idx_users_status`(partial deleted_at IS NULL)、`idx_users_created_at`、`idx_users_is_pro`(partial) | 1:N → meme_cards / ratings / comments / messages / legion_members / agent_jobs / video_jobs / orders / pro_subscriptions / video_packages / notifications / reports / banned_users |
| `user_profiles` | 用户扩展资料，jsonb 存兴趣/勋章/隐私/通知偏好 | `user_id` PK FK、`interest_tags`、`badges`、`privacy`、`notification_pref`、`teen_mode_until` | `idx_user_profiles_interest_tags`(gin) | 1:1 ← users |
| `user_interest_tags` | 用户兴趣标签结构化（聚合分析用） | `(user_id, tag)` PK、`weight numeric(5,2)` | `idx_user_interest_tags_tag` | N:1 ← users |
| `user_badges` | 用户勋章（成就/装扮） | `(user_id, badge_code)` PK、`badge_type`、`metadata jsonb` | `idx_user_badges_type` | N:1 ← users |
| `user_follows` | 用户关注关系 | `(follower_id, followee_id)` PK、`chk_follow_self` | `idx_user_follows_followee`(followee_id, created_at DESC) | N:1 ← users (双外键) |

### 4.2 创作域 / Creation Domain（5 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `prompt_templates` | 造梗 Prompt 模板库（官方 5 + UGC） | `template_id` PK、`mode`(text/image/script)、`system_prompt`、`user_template`、`variables jsonb`、`is_official`、`use_count`、`status` | `idx_prompt_templates_mode`、`idx_prompt_templates_official`、`idx_prompt_templates_use_count`(DESC) | 1:N → creations；1:1 → prompt_template_embeddings |
| `creations` | 造梗会话（单次 prompt 或 Agent 模式） | `creation_id` PK、`user_id` FK、`mode`、`agent_mode`、`agent_job_id`、`prompt_hash`(24h 去重)、`template_id` FK、`chosen_candidate`、`energy_cost`、`status`(pending/ready/published/failed) | `idx_creations_user_created`、`idx_creations_prompt_hash`(partial)、`idx_creations_agent_mode`(partial)、`idx_creations_status_created` | N:1 ← users；N:1 ← prompt_templates；1:N → creation_candidates、agent_jobs；1:1 ← meme_cards.creation_id |
| `creation_candidates` | 造梗候选（3 候选 + 自评打分） | `candidate_id` PK、`creation_id` FK、`idx`(0/1/2) UNIQUE(creation_id, idx)、`self_score`、`self_reason` | `idx_creation_candidates_creation` | N:1 ← creations |
| `agent_jobs` | Pro Agent 异步多步任务 | `job_id` PK、`creation_id` FK、`user_id` FK、`steps_total`、`steps_done`、`status`(queued/running/succeeded/failed/timeout)、`fallback_used`、`cost_estimate` | `idx_agent_jobs_user_created`、`idx_agent_jobs_status`(partial queued/running) | 1:N → agent_steps；N:1 ← creations、users |
| `agent_steps` | Agent 步骤明细（复盘与成本归因） | `step_id` PK、`job_id` FK、`step_no` UNIQUE(job_id, step_no)、`step_name`(rag_retrieve/generate/self_score)、`tokens_in/out`、`cost`、`duration_ms`、`status` | `idx_agent_steps_job`(job_id, step_no) | N:1 ← agent_jobs |

### 4.3 内容域 / Content Domain（3 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `meme_tags` | 标签字典（规范化） | `tag_id` smallserial PK、`name` UNIQUE、`category`、`use_count` | `idx_meme_tags_name_trgm`(gin trgm) | 1:N → meme_card_tags |
| `meme_cards` | 梗卡主表，产品最小内容单元 | `meme_id` PK、`author_id` FK、`creation_id` FK、`type`(text/image/video)、`title`+`title_tsv`、`tags jsonb`、`legion_id`、`score_avg`、`comment_count`、`share_count`、`hot_score`、`god_trash_status`、`status`、`watermarked`、`published_at`、`deleted_at` | `idx_meme_cards_author_created`、`idx_meme_cards_legion_status`(partial)、`idx_meme_cards_hot_score`(partial published & 未删)、`idx_meme_cards_status_published`(partial)、`idx_meme_cards_god_trash`(partial)、`idx_meme_cards_tags_gin`、`idx_meme_cards_title_tsv`、`idx_meme_cards_title_trgm` | N:1 ← users(author)；N:1 ← creations；N:1 ← legions；1:N → meme_card_tags / meme_videos / ratings / comments / shares / favorites / pk_submissions / god_trash_judgments / audit_logs / meme_embeddings |
| `meme_card_tags` | 梗卡-标签关联（结构化聚合） | `(meme_id, tag_id)` PK | `idx_meme_card_tags_tag` | N:1 ← meme_cards；N:1 ← meme_tags |

### 4.4 媒体域 / Media Domain（3 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `media_assets` | 媒体资产统一管理（image/video/audio） | `asset_id` PK、`kind`、`bucket`(默认 r2)、`object_key`、`cdn_url`、`sha256`、`width/height/duration_ms`、`metadata jsonb` | `idx_media_assets_sha256`(partial)、`idx_media_assets_kind` | 1:N → meme_videos.asset_id |
| `meme_videos` | 梗视频（与 meme_cards 1:N，多版本） | `video_id` PK、`meme_id` FK、`asset_id` FK、`source_type`(text_to_video/image_to_video/fallback_image_tts)、`duration`(5/10/15 秒)、`voice_id`、`status`(generating/reviewing/published/rejected/timeout)、`model_version`、`is_fallback`、`ai_cost` | `idx_meme_videos_meme`、`idx_meme_videos_status`、`idx_meme_videos_model` | N:1 ← meme_cards；N:1 ← media_assets；1:1 ← video_jobs |
| `video_jobs` | 视频生成异步任务 | `job_id` PK、`video_id` FK、`user_id` FK、`provider`(volcano/siliconflow/jimeng)、`external_task_id`、`webhook_secret`、`retry_count`、`status`(queued/running/succeeded/failed/timeout) | `idx_video_jobs_user`、`idx_video_jobs_status`(partial queued/running)、`idx_video_jobs_external`(partial) | 1:1 ← meme_videos；N:1 ← users |

### 4.5 互动域 / Interaction Domain（5 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `ratings` | 评分（按月分区） | `(score_id, created_at)` PK、`meme_id` FK、`user_id` FK、`star 1-5`、`dimensions jsonb`(laugh/creative/spread)、`is_judge`、`weight`(0.5/1.0/1.5)、`is_god_trash_vote`、`UNIQUE(meme_id, user_id)` | `idx_ratings_meme_created`、`idx_ratings_user_created`、`idx_ratings_dimensions_gin` | N:1 ← meme_cards；N:1 ← users |
| `comments` | 评论（楼中楼 + 造梗接龙） | `comment_id` PK、`meme_id` FK、`user_id` FK、`parent_id` FK(self)、`content`、`like_count`、`is_god_comment`、`is_meme_card`、`ref_meme_id` FK、`status`、`deleted_at` | `idx_comments_meme_created`(partial 未删)、`idx_comments_parent`(partial)、`idx_comments_user_created`、`idx_comments_god_comment`(partial) | N:1 ← meme_cards；N:1 ← users(self ref)；1:N → comment_likes |
| `comment_likes` | 评论点赞 | `(user_id, comment_id)` PK | `idx_comment_likes_comment` | N:1 ← users；N:1 ← comments |
| `shares` | 转发记录（站内/站外） | `share_id` PK、`meme_id` FK、`user_id` FK、`channel`(in_app/wechat/douyin/qq/link) | `idx_shares_meme_created` | N:1 ← meme_cards；N:1 ← users |
| `favorites` | 收藏 | `(user_id, meme_id)` PK | `idx_favorites_user_created` | N:1 ← users；N:1 ← meme_cards |

### 4.6 军团域 / Legion Domain（3 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `legions` | 梗大军 | `legion_id` PK、`name citext UNIQUE`、`slogan`、`theme_tags jsonb`、`leader_id` FK、`level`、`activity_score`、`member_count`、`member_cap`、`join_mode`(public/approval)、`pk_wins/pk_losses`、`status`、`deleted_at` | `idx_legions_level_activity`(partial 未删)、`idx_legions_status`(partial)、`idx_legions_theme_tags`(gin)、`idx_legions_name_trgm`(gin citext_ops) | 1:N → legion_members / meme_cards.legion_id / chat_rooms.legion_id / pk_matches(legion_a/b/winner)；N:1 ← users(leader) |
| `legion_members` | 军团成员 | `membership_id` PK、`legion_id` FK、`user_id` FK、`role`(leader/vice_leader/member)、`contribution`、`joined_at`、`left_at`、`UNIQUE(legion_id, user_id)` | `idx_legion_members_user`(partial left_at IS NULL)、`idx_legion_members_legion`(partial)、`idx_legion_members_role`(partial leader/vice_leader) | N:1 ← legions；N:1 ← users |
| `legion_levels` | 军团等级配置 | `level` int PK、`name`、`activity_required`、`member_cap`、`badges_unlocked jsonb`、`extra jsonb` | — | 配置表，无外键 |

> 注：军团群聊房间未单独建表，直接复用 `chat_rooms.type='legion'` + `legion_id` 外键实现（schema.sql 第 8.4 节注释明确说明）。

### 4.7 PK 域 / PK Domain（4 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `pk_matches` | PK 比赛 | `pk_id` PK、`type`(creation/vote/hotness)、`legion_a/b` FK、`theme`、`start_at/end_at`、`status`(idle/challenged/accepted/preparing/battling/judging/settled/archived)、`score_a/b`、`winner_id` FK、`mvp_user_id` FK、`reward_state jsonb`、`is_official`、`chk_pk_legions(legion_a<>legion_b)` | `idx_pk_status_end`、`idx_pk_legion_a`、`idx_pk_legion_b`、`idx_pk_winner`(partial)、`idx_pk_official`(partial) | N:1 ← legions(a/b/winner)；N:1 ← users(mvp)；1:N → pk_submissions / pk_votes / pk_rewards |
| `pk_submissions` | PK 提交的梗卡 | `submission_id` PK、`pk_id` FK、`meme_id` FK、`legion_id` FK、`user_id` FK、`UNIQUE(pk_id, meme_id)` | `idx_pk_submissions_pk_legion` | N:1 ← pk_matches；N:1 ← meme_cards；N:1 ← legions；N:1 ← users |
| `pk_votes` | PK 投票（每人每天每场 ≤3 票，应用层+Redis 控制） | `vote_id` PK、`pk_id` FK、`user_id` FK、`legion_id` FK、`voted_at` | `idx_pk_votes_pk_legion`、`idx_pk_votes_user_date`(表达式 date_trunc('day', voted_at))；部分唯一索引示例以注释保留 | N:1 ← pk_matches；N:1 ← users；N:1 ← legions |
| `pk_rewards` | PK 奖励发放记录 | `reward_id` PK、`pk_id` FK、`user_id` FK、`legion_id` FK、`reward_type`(win_member/mvp/loser_participation)、`meme_power`、`activity_score`、`badge_code`、`pro_days`、`metadata jsonb` | `idx_pk_rewards_user`、`idx_pk_rewards_pk` | N:1 ← pk_matches；N:1 ← users；N:1 ← legions |

### 4.8 聊天域 / Chat Domain（4 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `chat_rooms` | 聊天房间（private/legion/system） | `room_id` PK、`type`、`legion_id` FK、`user_a/b` FK、`last_msg_at` | `idx_chat_rooms_legion`(partial)、`idx_chat_rooms_private`(partial type='private')、`idx_chat_rooms_last_msg` | N:1 ← legions；N:1 ← users(user_a/b)；1:N → messages / message_reads |
| `messages` | 消息（按月分区） | `(message_id, created_at)` PK、`room_id` FK、`sender_id` FK、`msg_type`(text/image/meme/voice/system)、`content`、`extra jsonb` | `idx_messages_room_created`、`idx_messages_sender`、`idx_messages_extra_gin` | N:1 ← chat_rooms；N:1 ← users |
| `message_reads` | 已读回执（按 room 维度记录最后已读） | `(room_id, user_id)` PK、`last_read_at`、`last_read_msg_id` | — (主键覆盖) | N:1 ← chat_rooms；N:1 ← users |
| `notifications` | 系统通知 | `notif_id` PK、`user_id` FK、`type`(rating/god_meme/pk/reward/violation/pro/agent_done)、`title`、`body`、`payload jsonb`、`is_read`、`push_status` | `idx_notifications_user_created`、`idx_notifications_unread`(partial)、`idx_notifications_type` | N:1 ← users |

### 4.9 评分判定域 / Judgment Domain（2 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `reviewers` | 评审官（每月竞选，任期 30 天） | `reviewer_id` PK、`user_id` FK、`term_start_at`、`term_end_at`、`is_active`、`elected_score`、`UNIQUE(user_id, term_start_at)` | `idx_reviewers_active`(partial)、`idx_reviewers_term` | N:1 ← users |
| `god_trash_judgments` | 神梗/烂梗判定记录 | `judgment_id` PK、`meme_id` FK、`result`(god/trash)、`score_avg`、`score_count`、`one_star_rate`、`metadata jsonb` | `idx_gt_judgments_meme`、`idx_gt_judgments_result` | N:1 ← meme_cards |

### 4.10 商业化域 / Monetization Domain（4 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `pro_subscriptions` | Pro 会员订阅 | `sub_id` PK、`user_id` FK、`plan`(monthly/yearly)、`price_cents`、`start_at/end_at`、`auto_renew`、`status`(active/expired/cancelled/refunded)、`order_id` | `idx_pro_subs_user`、`idx_pro_subs_active`(partial)、`idx_pro_subs_expiring`(partial active & auto_renew) | N:1 ← users；N:1 ← orders |
| `video_packages` | 视频按次包 | `package_id` PK、`user_id` FK、`sku`(pkg_10/pkg_50)、`total_quota/used_quota`、`price_cents`、`order_id`、`expire_at`、`status`(active/exhausted/expired) | `idx_video_packages_user` | N:1 ← users；N:1 ← orders |
| `orders` | 订单 | `order_id` PK、`user_id` FK、`product_type`(pro/video_pkg)、`product_ref` uuid、`amount_cents`、`channel`(wechat/alipay/apple)、`status`(pending/paid/failed/refunded)、`paid_at`、`metadata jsonb` | `idx_orders_user`、`idx_orders_status` | N:1 ← users；1:N → payments / pro_subscriptions / video_packages |
| `payments` | 支付流水（与渠道对账） | `payment_id` PK、`order_id` FK、`channel`、`channel_txn_id`、`amount_cents`、`status`、`raw_payload jsonb`、`paid_at` | `idx_payments_order`、`idx_payments_channel`(partial) | N:1 ← orders |

### 4.11 安全域 / Safety Domain（4 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `sensitive_words` | 敏感词库（DFA 匹配） | `word_id` bigserial PK、`word`、`category`(political/pornographic/violent/fraud/minor/troll)、`level`(1=拦截/2=审核/3=提示)、`variants jsonb`、`enabled`、`UNIQUE(word, category)` | `idx_sensitive_words_word_trgm`(gin trgm)、`idx_sensitive_words_level`(partial enabled) | 配置表 |
| `reports` | 举报 | `report_id` PK、`reporter_id` FK、`target_type`(meme/comment/user/legion/message)、`target_id`、`reason`、`detail`、`status`(pending/handled/rejected)、`handler_id` FK、`handled_at` | `idx_reports_status`、`idx_reports_target` | N:1 ← users(reporter/handler) |
| `banned_users` | 封禁记录 | `ban_id` PK、`user_id` FK、`reason`、`ban_until`(NULL=永久)、`banned_by` FK | `idx_banned_users_user` | N:1 ← users(user/banned_by) |
| `audit_logs` | 审核日志（机审+人审，按月分区） | `(audit_id, created_at)` PK、`target_id`、`target_type`(meme_card/meme_video/comment/legion/user)、`action`(machine_pass/machine_reject/manual_pass/manual_reject/hide/delete)、`result`(pass/reject/queue)、`operator_id` FK、`metadata jsonb` | `idx_audit_logs_target`、`idx_audit_logs_operator`、`idx_audit_logs_action` | N:1 ← users(operator) |

### 4.12 AI 成本域 / AI Cost Domain（1 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `ai_cost_logs` | AI 调用成本日志（日预算熔断看板数据源，按月分区） | `(log_id, created_at)` PK、`user_id` FK、`module`(creation/image/video/tts/audit/agent/judge)、`provider`(deepseek/glm/siliconflow/volcano/aliyun)、`model`、`tokens_in/out`、`images`、`video_secs`、`cost_cents`(分)、`latency_ms`、`status`、`request_id` | `idx_ai_cost_user`、`idx_ai_cost_module`、`idx_ai_cost_provider`、`idx_ai_cost_daily`(表达式 date_trunc('day', created_at), module) | N:1 ← users |

### 4.13 向量域 / Vector Domain（3 表）

| 表名 | 用途 | 关键字段 | 关键索引 | 关联关系 |
| --- | --- | --- | --- | --- |
| `meme_embeddings` | 梗卡向量（768 维 bge-m3，神梗入 RAG 库） | `meme_id` PK FK、`embedding vector(768)`、`model`、`style_tags jsonb`、`is_god_meme` | `idx_meme_embeddings_hnsw`(hnsw cosine, m=16, ef=64)、`idx_meme_embeddings_god`(partial) | 1:1 ← meme_cards |
| `user_interest_embeddings` | 用户兴趣向量（双塔召回） | `user_id` PK FK、`interest_vector vector(768)`、`behavior_vector vector(768)`、`model` | `idx_user_interest_emb_hnsw`(hnsw behavior)、`idx_user_interest_emb_int_hnsw`(hnsw interest) | 1:1 ← users |
| `prompt_template_embeddings` | Prompt 模板向量（模板推荐） | `template_id` PK FK、`embedding vector(768)`、`tags jsonb` | `idx_prompt_template_emb_hnsw`(hnsw cosine) | 1:1 ← prompt_templates |

详见 §5 向量表设计。

---

## 5. 向量表设计（pgvector）

### 5.1 模型与维度

- 统一采用 `vector(768)` 维度，对齐 `bge-m3` / OpenAI `text-embedding-3-small` / DeepSeek embedding。
- 文本：`bge-m3`（通过 SiliconFlow 免费 API 调用）；梗图 MVP 阶段仅对标题 + 标签做 embedding，后续可叠加 CLIP 图像向量。
- 向量生成不在 SQL 内完成，由 RAG Worker 异步调用模型后写入 `*_embeddings` 表。

### 5.2 索引：HNSW + 余弦

所有向量字段均使用 `USING hnsw (列 vector_cosine_ops) WITH (m = 16, ef_construction = 64)`：

- `m = 16`：每层邻居数，平衡召回率与内存。
- `ef_construction = 64`：建图时候选邻居数，构建期精度。
- 查询时可通过 `SET hnsw.ef_search = 100;` 在 session 内调高召回。

> 选择 HNSW 而非 IVFFlat：HNSW 更新友好（梗卡向量会随神梗判定增量写入），无需重建索引；MVP 数据量 < 1w 性能足够，10w+ 后仍可平滑扩展。`TechnicalDesign.md` §6.3 中的 `ivfflat` 为早期草案，最终 SQL 落地为 HNSW。

### 5.3 三张向量表语义

| 表 | 用途 | 主要向量列 | 过滤列 |
| --- | --- | --- | --- |
| `meme_embeddings` | 梗卡语义向量库；神梗入 RAG 知识库，造梗时余弦检索 top5 作为 few-shot | `embedding` | `is_god_meme=true` |
| `user_interest_embeddings` | 用户兴趣双塔；推荐召回用 `behavior_vector`，兴趣扩展用 `interest_vector` | `behavior_vector` + `interest_vector` | — |
| `prompt_template_embeddings` | Prompt 模板语义向量；用户输入关键词后推荐最匹配模板 | `embedding` | `tags jsonb` |

### 5.4 余弦检索示例

**造梗 RAG few-shot 召回（仅神梗）**：

```sql
-- 输入：用户输入文本经 bge-m3 得到 768 维 query_vec
SELECT m.meme_id, mc.title, mc.tags, e.embedding <=> $1 AS distance
FROM meme_embeddings e
JOIN meme_cards mc ON mc.meme_id = e.meme_id
WHERE e.is_god_meme = true
ORDER BY e.embedding <=> $1
LIMIT 5;
```

**用户双塔推荐召回（基于近期行为向量）**：

```sql
-- 输入：目标用户的 behavior_vector
SELECT u.user_id, u.nickname, e.behavior_vector <=> $1 AS distance
FROM user_interest_embeddings e
JOIN users u ON u.user_id = e.user_id
WHERE u.deleted_at IS NULL
ORDER BY e.behavior_vector <=> $1
LIMIT 50;
```

**Prompt 模板推荐**：

```sql
SELECT t.template_id, t.name, t.mode, te.embedding <=> $1 AS distance
FROM prompt_template_embeddings te
JOIN prompt_templates t ON t.template_id = te.template_id
WHERE t.status = 'active'
ORDER BY te.embedding <=> $1
LIMIT 3;
```

> `<=>` 为 pgvector 余弦距离算子；距离越小越相似。如需相似度分数，用 `1 - (e.embedding <=> $1)`。

---

## 6. 分区表设计

### 6.1 分区表清单

| 父表 | 分区键 | 默认分区 | 用途 |
| --- | --- | --- | --- |
| `ratings` | `created_at` | `ratings_default` | 评分写入量大，按月切分便于过期清理与索引重建 |
| `messages` | `created_at` | `messages_default` | 消息表是热点；30 天前数据归档 OSS Parquet |
| `audit_logs` | `created_at` | `audit_logs_default` | 审核日志只增不改，按月分区 + 冷数据下沉 |
| `ai_cost_logs` | `created_at` | `ai_cost_logs_default` | 对齐 §14 成本看板日聚合，按月分区便于按月归档 |

### 6.2 主键与外键约束

- 分区表主键必须包含分区键：四张分区表均使用 `(业务主键 uuid, created_at)` 复合主键。
- 分区表不能直接挂外键引用，但 `ratings.meme_id` / `messages.room_id` 等外键已在 SQL 中通过 `REFERENCES` 声明（PG16 支持分区表外键）。
- 父表上的索引会被自动传播到所有子分区（包括未来新建的月分区）。

### 6.3 未来按月建分区模板

MVP 阶段仅建 `DEFAULT` 分区兜底；当某月数据量预计超过单分区舒适区（建议 ~1000 万行）时，按月预先建分区。模板如下（以 `ratings` 为例，其余三表同理）：

```sql
-- 2026 年 7 月分区
CREATE TABLE IF NOT EXISTS ratings_2026_07 PARTITION OF ratings
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- 2026 年 8 月分区
CREATE TABLE IF NOT EXISTS ratings_2026_08 PARTITION OF ratings
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- messages / audit_logs / ai_cost_logs 同理
CREATE TABLE IF NOT EXISTS messages_2026_07 PARTITION OF messages
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_07 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS ai_cost_logs_2026_07 PARTITION OF ai_cost_logs
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
```

> 建议提前一个月创建未来分区（如 6 月底创建 7 月分区），避免所有写入落入 `DEFAULT` 分区后需要 `ALTER TABLE ... ATTACH PARTITION` 迁移。可由 cron / pg_cron 调度 `CREATE TABLE IF NOT EXISTS ...` 脚本。

### 6.4 老数据归档

- `messages` 30 天前数据归档到 OSS Parquet：通过 `pg_dump --table=messages_YYYY_MM` 或 `COPY ... TO PROGRAM` 导出到对象存储后 `DETACH PARTITION`。
- `audit_logs` / `ai_cost_logs` 保留 12 个月在线，更老分区转冷存储。
- `ratings` 由于被 `score_avg`、`score_count` 聚合后回写到 `meme_cards`，原表保留 6 个月即可，老分区可 DROP。

---

## 7. 视图与物化视图

### 7.1 普通视图

| 视图 | 用途 | 关键过滤 |
| --- | --- | --- |
| `v_hot_meme_cards` | 热门梗卡 feed 直读 | `status='published' AND deleted_at IS NULL`，按 `hot_score DESC` 排序；列：meme_id / author_id / type / cover_url / title / tags / legion_id / score_avg / score_count / comment_count / share_count / hot_score / god_trash_status / published_at |
| `v_pk_active` | 进行中 PK 大厅 | `status IN ('preparing','battling','judging') AND end_at > now()`；JOIN legions 取双方名称 |

### 7.2 物化视图

| 物化视图 | 用途 | 关键聚合 | 刷新策略 | 索引 |
| --- | --- | --- | --- | --- |
| `mv_user_meme_power` | 用户梗力值排行榜 | `users` LEFT JOIN `meme_cards`：meme_count、god_count(god_trash_status='god')、avg_score(过滤 score_count>=50 的成熟梗) | `REFRESH MATERIALIZED VIEW CONCURRENTLY`，每小时一次 | 唯一索引 `idx_mv_user_meme_power_uid (user_id)`（CONCURRENTLY 必需）+ `idx_mv_user_meme_power_rank (meme_power DESC)` |
| `mv_legion_rank` | 军团排行榜 | `legions` LEFT JOIN `meme_cards`：meme_count、god_count、win_rate = pk_wins/(pk_wins+pk_losses) | `REFRESH MATERIALIZED VIEW CONCURRENTLY`，每日一次 | 唯一索引 `idx_mv_legion_rank_id (legion_id)` + `idx_mv_legion_rank_score (activity_score DESC)` |

刷新策略：

- 使用 `CONCURRENTLY` 避免阻塞读；前提是物化视图上有至少一个 `UNIQUE` 索引（已在 schema.sql 中创建）。
- 由 cron / pg_cron / 应用调度器周期性执行 `REFRESH MATERIALIZED VIEW CONCURRENTLY <name>;`。
- `seed.sql` 末尾会执行一次初始 `REFRESH MATERIALIZED VIEW CONCURRENTLY`，便于种子数据立即可见。

---

## 8. 种子数据说明（seed.sql）

`seed.sql` 在 `schema.sql` 之后执行，包含以下 15 类种子数据（按文件章节顺序）：

| # | 章节 | 内容 | 数量 | 备注 |
| --- | --- | --- | --- | --- |
| 1 | 运营账号 | `users` + `user_profiles` 一条运营官记录 | 1 条 | `user_id = 00000000-0000-0000-0000-admin0001`，`is_official=true`，`level=99`，`meme_power=99999`，无密码（登录走 Supabase Auth） |
| 2 | 官方 Prompt 模板 | `prompt_templates` 5 条：抽象段子 / 阴阳怪气 / 谐音梗 / 反转梗 / 表情包配文 | 5 条 | `is_official=true`，`status='active'`，`template_id` 形如 `tpl-0001-abstract-0001-0001` |
| 3 | TTS 音色配置 | 新建 `tts_voices` 表 + 4 条音色 | 4 条 | 搞怪音 / 东北音 / 御姐音 / 机器人音，provider=volcano |
| 4 | 敏感词样例 | `sensitive_words` 20 条，覆盖 political/pornographic/violent/fraud/minor/troll 六类 | 20 条 | level 1/2/3 混合；实际生产需导入完整词库 |
| 5 | 示例军团 | `legions` 3 个：抽象艺术团 / 阴阳怪气联盟 / 表情包研究所 | 3 条 | leader 均为运营官，theme_tags 不同，level 3/2/1 |
| 6 | 军团成员 | `legion_members` 3 条，运营官自动成为各军团 leader | 3 条 | role=leader |
| 7 | 军团等级配置 | `legion_levels` 1-5 级 | 5 条 | 等级 / 名称 / activity_required / member_cap / badges_unlocked |
| 8 | 示例神梗 | `meme_cards` 1 条（type=text，god_trash_status=god，status=published） | 1 条 | 标题"薛定谔的猫"段子，归属抽象艺术团，score_avg=4.65，hot_score=8.92 |
| 9 | 神梗向量 | `meme_embeddings` 1 条，768 维用 0.036 填充（生产由 bge-m3 生成） | 1 条 | `is_god_meme=true` |
| 10 | 神梗判定记录 | `god_trash_judgments` 1 条 | 1 条 | result=god，one_star_rate=0.086 |
| 11 | 标签字典 | `meme_tags` 3 条：抽象 / 反转 / 薛定谔 | 3 条 | ON CONFLICT 时 use_count 自增 |
| 12 | 梗卡-标签关联 | `meme_card_tags` 3 条，关联示例神梗与 3 个标签 | 3 条 | — |
| 13 | 普通用户示例 | `users` + `user_profiles` 1 条（"整活新秀小明"，is_pro=true） | 1 条 | 便于本地联调 |
| 14 | 物化视图刷新 | `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_meme_power / mv_legion_rank` | 2 次 | 让种子数据在排行榜立即可见 |

> 说明：`seed.sql` 第 3 节会在 `schema.sql` 之外额外创建一张 `tts_voices` 表（schema.sql 未单独建该表，按脚本注释为简化方案；正式版建议把 `tts_voices` 上移到 schema.sql）。该表不计入 schema.sql 的 50 张表计数。

执行顺序：

```bash
psql -d meme -f docs/db/schema.sql
psql -d meme -f docs/db/seed.sql
```

---

## 9. 迁移与版本管理

### 9.1 推荐工具

| 工具 | 适用场景 | 说明 |
| --- | --- | --- |
| `node-pg-migrate` | Node.js 后端，纯 SQL 友好 | 支持 TypeScript / JS 编写迁移；与本项目 Supabase + Edge Function 技术栈契合 |
| `drizzle-kit` | TypeScript ORM 一体化 | 若 ORM 选用 Drizzle，可用 `drizzle-kit generate/migrate` 自动生成迁移文件 |
| `sqitch` | 数据库无关 | 适合多语言团队，依赖变更管理 |

MVP 推荐使用 `node-pg-migrate`：纯 SQL 迁移文件、对 pgvector / 分区 / 物化视图友好、与 Supabase CLI 协同简单。

### 9.2 migrations 目录结构建议

```
docs/db/
├── schema.sql              # 完整 DDL（基线，可重复执行）
├── seed.sql                # 种子数据
└── migrations/
    ├── 0001_init_schema.sql       # 首次基线（与 schema.sql v1.0.0 等价）
    ├── 0002_seed_official.sql     # 官方 Prompt + TTS + 敏感词
    ├── 0003_add_xxx_column.sql    # 增量变更（示例）
    └── README.md                  # 迁移规范
```

### 9.3 版本管理规范

- 每次变更生成新迁移文件，禁止修改已发布的迁移。
- 迁移文件名前缀 `NNNN_短描述.sql`，4 位序号保证顺序。
- schema.sql 与 seed.sql 作为"当前完整基线"维护，每次合并迁移后同步刷新。
- 物化视图、分区表、HNSW 索引等结构变更需在迁移中显式 `DROP` + `CREATE` 或 `ALTER`，不可依赖工具自动生成。

---

## 10. 性能与扩展

### 10.1 索引覆盖说明

`schema.sql` 的 106 个索引按场景分布：

- **热门 feed**：`idx_meme_cards_hot_score`(partial published & 未删) + `idx_meme_cards_status_published` 直接支撑"热门榜"与"按发布时间倒序"两种排序。
- **个人主页**：`idx_meme_cards_author_created (author_id, created_at DESC)`、`idx_creations_user_created`、`idx_agent_jobs_user_created`、`idx_video_jobs_user`、`idx_comments_user_created`、`idx_notifications_user_created`、`idx_orders_user` 全部按 `(user_id, created_at DESC)` 模式覆盖。
- **军团墙**：`idx_meme_cards_legion_status` (partial legion_id NOT NULL) + `idx_legions_level_activity`。
- **PK 大厅**：`idx_pk_status_end (status, end_at)` + `idx_pk_official` (partial)。
- **未读通知**：`idx_notifications_unread` (partial is_read=false) 仅索引未读，体积小、命中快。
- **任务调度**：`idx_agent_jobs_status` (partial queued/running) + `idx_video_jobs_status` (partial) 让 Worker 拉取待处理任务时只扫活跃子集。
- **全文检索**：`meme_cards.title_tsv` 触发器维护 + `idx_meme_cards_title_tsv` (gin)；中文走 `simple` 分词，生产可换 `zhparser`。
- **模糊检索**：`pg_trgm` GIN 索引覆盖 `users.nickname`、`meme_tags.name`、`sensitive_words.word`、`legions.name`。
- **向量召回**：4 个 HNSW 索引（`meme_embeddings.embedding`、`user_interest_embeddings.behavior_vector`、`user_interest_embeddings.interest_vector`、`prompt_template_embeddings.embedding`）。

### 10.2 EXPLAIN 调优提示

- 任何慢查询先 `EXPLAIN (ANALYZE, BUFFERS)` 查看实际执行计划与命中索引。
- 关注 `Seq Scan`：若大表出现顺序全表扫描，检查 WHERE 是否命中部分索引的过滤条件（部分索引需要查询条件完全匹配 `WHERE` 子句才能命中）。
- 关注 `Sort` 是否被索引消除：热门 feed 应该走 `idx_meme_cards_hot_score` 而 `Index Scan Backward`，无需显式排序。
- 向量查询若 `distance` 排序未走 HNSW，确认是否设置了 `hnsw.ef_search` 且查询 ORDER BY 用 `<=>` 算子。
- JOIN 膨胀：检查 `ratings` / `messages` 是否被外键索引覆盖（父表索引自动传播到分区子表）。
- 物化视图刷新慢：检查 `mv_user_meme_power` 的 `LEFT JOIN meme_cards` 是否命中 `idx_meme_cards_author_created`；可改 `REFRESH ... CONCURRENTLY` 避免阻塞读。

### 10.3 未来分区启用步骤

1. 监控 `ratings_default` / `messages_default` / `audit_logs_default` / `ai_cost_logs_default` 行数，超过阈值（建议 1000 万）启动分区切分。
2. 在月底前由 cron 执行下月分区 `CREATE TABLE IF NOT EXISTS <parent>_YYYY_MM PARTITION OF ...`。
3. 若 `DEFAULT` 分区已有历史数据，需 `ALTER TABLE <parent> DETACH PARTITION <parent>_default`，把数据 `INSERT INTO <parent>_YYYY_MM SELECT ...` 迁回，再重建 `DEFAULT`。
4. 父表索引会自动传播到新分区；物化视图无需调整。
5. 对新分区单独 `GRANT`（schema.sql 收尾注释提示）。

### 10.4 读副本建议

- 主从复制：Supabase 默认提供主从；高读场景把读流量打到 hot standby。
- 强一致写仍走 primary：评分写入、订单支付、消息发送。
- 弱一致读可走副本：热门 feed、军团排行（物化视图）、用户主页、向量推荐召回。
- 向量 HNSW 索引在副本上同样可用，但 HNSW 不是完全确定性的查询顺序，跨副本结果可能轻微差异，业务层需容忍。
- 物化视图在主库刷新，副本通过流复制同步，存在分钟级延迟。

### 10.5 其他扩展点

- 中文全文检索：生产可加装 `zhparser` 扩展并把 `meme_title_tsv_trigger()` 中的 `to_tsvector('simple', ...)` 改为 `to_tsvector('chinese_zh', ...)`。
- 多租户：当前单 `public` schema，如需多租户可按租户拆 schema 并把 `app` 角色按 schema 收权。
- 时序数据：`ai_cost_logs` 与 `audit_logs` 若增长极快，可考虑接 TimescaleDB hypertable 替代原生分区。
- 图像向量：CLIP 图像向量可另建 `meme_image_embeddings` 表，复用 `vector(512)` 或 `vector(768)` 与 HNSW 模式。

---

## 11. 可直接执行性声明

- **`docs/db/schema.sql`**：可直接 `psql -f docs/db/schema.sql` 执行。脚本头部声明幂等（`IF NOT EXISTS` / `ON CONFLICT` / `DROP TRIGGER IF EXISTS`），重复执行不会报错。前提条件：目标 PG 实例 ≥ 16 且具备 superuser 权限以安装 `vector` / `pg_trgm` / `citext` / `uuid-ossp` / `btree_gin` 扩展（Supabase 默认已预装 pgvector）。
- **`docs/db/seed.sql`**：必须在 `schema.sql` 成功执行后运行，命令 `psql -f docs/db/seed.sql`。所有 `INSERT` 使用 `ON CONFLICT DO NOTHING` / `DO UPDATE`，幂等可重复执行。
- **执行顺序**：先 `schema.sql` 再 `seed.sql`。
- **生产部署清单**：
  1. 替换 `app` 角色密码（schema.sql 中 `change_me_in_prod`）。
  2. 在 `postgresql.conf` 固化 `statement_timeout`、`lock_timeout`、`hnsw.ef_search` 等参数。
  3. 打开 schema.sql 收尾段的 `GRANT` 模板，按角色最小权限配置。
  4. 设置 cron 任务周期性 `REFRESH MATERIALIZED VIEW CONCURRENTLY` 与未来按月建分区。

---

## 12. 关键设计取舍

| 决策 | 取舍 | 理由 |
| --- | --- | --- |
| 主键统一 uuid | 单调性弱于 bigint，但分布式友好、避免主键泄露用户量 | 与 Supabase Auth 主键一致，便于跨服务引用 |
| HNSW 替代 IVFFlat | 内存占用略高，但更新友好、无需 `VECTOR` 数据预处理 | 梗卡向量会增量写入，HNSW 增量性能优于 IVFFlat |
| MVP 单 DEFAULT 分区 | 牺牲早期分区收益，换取部署简单 | 数据量小，过早分区增加运维负担；模板已备好，阈值触发即可切月分区 |
| jsonb + GIN 而非独立表 | 牺牲结构化查询能力，换取灵活迭代 | 兴趣标签、隐私、通知 payload 等半结构化字段频繁演进 |
| 软删除仅限内容/账号表 | 互动类表物理删除 | 减少索引膨胀，互动数据通过聚合回写到 `meme_cards` 已可保留统计痕迹 |
| 军团群聊复用 chat_rooms | 不独立建 legion_chat_rooms 表 | schema.sql 第 8.4 节明确简化；如需独立配置可后续扩展 |
| `tts_voices` 在 seed.sql 而非 schema.sql | schema.sql 不含该表 | seed.sql 注释明确为简化方案，正式版建议上移到 schema.sql |
| 物化视图而非实时聚合 | 牺牲实时性（小时/日延迟），换取榜单查询 O(1) | 排行榜业务对实时性要求低，CONCURRENTLY 刷新避免阻塞读 |

---

*END OF Database-DDL.md*
