-- =============================================================================
-- 「梗星球」MemeChatAI · PostgreSQL 生产级 DDL 脚本
-- -----------------------------------------------------------------------------
-- 版本:    v1.0.0
-- 适配:    PostgreSQL 16 + pgvector 0.7+
-- 作者:    数据库架构 / 个人开发者
-- 创建:    2026-07-07
-- 关联:    TechnicalDesign.md v1.1.0、PRD.md v1.1.0
-- 说明:    本脚本可直接 `psql -f schema.sql` 执行，幂等（IF NOT EXISTS）。
--          所有表为复数命名（snake_case）；主键统一 uuid + gen_random_uuid()；
--          时间戳统一 timestamptz；jsonb 字段加 GIN；向量字段用 hnsw 余弦索引。
-- =============================================================================

-- =============================================================================
-- 0. 扩展安装 / Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector 向量库
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- 模糊检索 (nickname / 标题)
CREATE EXTENSION IF NOT EXISTS citext;       -- 不区分大小写文本 (legion.name, email)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- 兼容用，gen_random_uuid() 内置于 PG13+
CREATE EXTENSION IF NOT EXISTS btree_gin;    -- 组合索引（jsonb + btree）

-- =============================================================================
-- 1. Schema / 角色 / 配置
-- =============================================================================
-- 默认使用 public schema；如需多租户可拆 schema，此处保持单 schema。
-- 应用连接统一使用 app 角色（最小权限）。
-- DO 块用于幂等创建角色，避免单机部署时无 superuser 权限报错。
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
    CREATE ROLE app WITH LOGIN PASSWORD 'change_me_in_prod' NOSUPERUSER NOCREATEDB NOCREATEROLE;
  END IF;
END$$;

-- 服务器调优（仅 session 级，生产可在 postgresql.conf 固化）
SET statement_timeout = '30s';
SET lock_timeout = '5s';
SET default_text_search_config = 'simple'; -- 中文走自定义分词，simple 兜底

-- =============================================================================
-- 2. 通用工具：updated_at 自动更新函数
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. 用户域 / User Domain
-- =============================================================================

-- 3.1 users  用户主表（Supabase Auth 同步过来）
CREATE TABLE IF NOT EXISTS users (
    user_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_uid   uuid UNIQUE,                       -- Supabase Auth user id
    phone          varchar(20) UNIQUE,                -- 手机号（AES-256 加密后存储，此处仅占位）
    email          citext UNIQUE,
    nickname       varchar(32) NOT NULL,
    avatar_url     varchar(512),
    gender         varchar(16),                       -- male/female/other/unknown
    birthday       date,
    bio            varchar(140),                      -- 个性签名
    level          int      NOT NULL DEFAULT 1,
    meme_power     int      NOT NULL DEFAULT 0,       -- 梗力值
    defense_value  int      NOT NULL DEFAULT 0,       -- 破防值
    energy_balance int      NOT NULL DEFAULT 100,     -- 梗能量余额
    legion_count   int      NOT NULL DEFAULT 0,       -- 已加入军团数（≤3）
    status         varchar(16) NOT NULL DEFAULT 'active', -- active/banned/teen_mode/deleted
    is_pro         boolean  NOT NULL DEFAULT false,
    is_official    boolean  NOT NULL DEFAULT false,   -- 运营账号
    last_login_at  timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz,                       -- 软删除
    CONSTRAINT chk_users_status CHECK (status IN ('active','banned','teen_mode','deleted'))
);

CREATE INDEX IF NOT EXISTS idx_users_nickname_trgm ON users USING gin (nickname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_status        ON users (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_created_at    ON users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_is_pro        ON users (is_pro) WHERE is_pro = true;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  users IS '用户主表（与 Supabase Auth 同步，主数据存国内 PG）';
COMMENT ON COLUMN users.meme_power    IS '梗力值：综合创作能力分，影响额度与等级';
COMMENT ON COLUMN users.defense_value IS '破防值：被神评/被转发/被军团收录累积的情绪型指标';
COMMENT ON COLUMN users.energy_balance IS '梗能量：每日恢复，AI 造梗消耗';

-- 3.2 user_profiles  用户扩展资料（拆分降低主表宽度）
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id            uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    interest_tags      jsonb NOT NULL DEFAULT '[]'::jsonb, -- 兴趣标签 array<string>
    badges             jsonb NOT NULL DEFAULT '[]'::jsonb, -- 勋章列表
    privacy            jsonb NOT NULL DEFAULT '{}'::jsonb, -- 隐私偏好
    notification_pref  jsonb NOT NULL DEFAULT '{}'::jsonb, -- 通知偏好
    teen_mode_until    timestamptz,                       -- 青少年模式结束时间
    nickname_changed_at timestamptz,                      -- 昵称 30 天可改 1 次的最近时间
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_interest_tags ON user_profiles USING gin (interest_tags);

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE user_profiles IS '用户扩展资料，jsonb 存兴趣标签/勋章/隐私/通知偏好';

-- 3.3 user_interest_tags  用户兴趣标签（结构化，便于聚合分析）
CREATE TABLE IF NOT EXISTS user_interest_tags (
    user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tag        varchar(32) NOT NULL,
    weight     numeric(5,2) NOT NULL DEFAULT 1.00,    -- 兴趣权重，行为强化
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_user_interest_tags_tag ON user_interest_tags (tag);

-- 3.4 user_badges  用户勋章（成就/装扮）
CREATE TABLE IF NOT EXISTS user_badges (
    user_id     uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    badge_code  varchar(64) NOT NULL,
    badge_type  varchar(16) NOT NULL,                 -- achievement/cosmetic
    acquired_at timestamptz NOT NULL DEFAULT now(),
    metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (user_id, badge_code)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_type ON user_badges (badge_type);

-- 3.5 user_follows  用户关注关系
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    followee_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id),
    CONSTRAINT chk_follow_self CHECK (follower_id <> followee_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_followee ON user_follows (followee_id, created_at DESC);

-- =============================================================================
-- 4. 创作域 / Creation Domain（v1.1 Agent 体系）
-- =============================================================================

-- 4.1 prompt_templates  造梗 Prompt 模板库
CREATE TABLE IF NOT EXISTS prompt_templates (
    template_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mode           varchar(16) NOT NULL,              -- text/image/script
    name           varchar(64) NOT NULL,
    system_prompt  text NOT NULL,
    user_template  text NOT NULL,                     -- 含 {{keyword}} {{style}} 占位
    style          varchar(32),
    variables      jsonb NOT NULL DEFAULT '[]'::jsonb, -- 变量声明
    example_output jsonb,
    is_official    boolean NOT NULL DEFAULT false,
    creator_id     uuid REFERENCES users(user_id) ON DELETE SET NULL,
    use_count      int NOT NULL DEFAULT 0,
    status         varchar(16) NOT NULL DEFAULT 'active', -- active/draft/archived
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_templates_mode      ON prompt_templates (mode);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_official ON prompt_templates (is_official, status);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_use_count ON prompt_templates (use_count DESC);

DROP TRIGGER IF EXISTS trg_prompt_templates_updated_at ON prompt_templates;
CREATE TRIGGER trg_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE prompt_templates IS 'Prompt 模板库：官方 5 个 + UGC（MVP 仅官方）';

-- 4.2 creations  造梗会话（覆盖单次 prompt 与 Agent 模式）
CREATE TABLE IF NOT EXISTS creations (
    creation_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    mode              varchar(16) NOT NULL,            -- text/image/script
    agent_mode        boolean NOT NULL DEFAULT false,  -- true=Pro Agent 模式
    agent_job_id      uuid,                            -- 关联 agent_jobs
    prompt            text NOT NULL,
    prompt_hash       varchar(64),                     -- md5(prompt+style) 24h 去重
    style             varchar(32),
    template_id       uuid REFERENCES prompt_templates(template_id) ON DELETE SET NULL,
    chosen_candidate  int,                             -- 选中第几条候选（0-based）
    energy_cost       int NOT NULL DEFAULT 0,
    model_version     varchar(64),                     -- deepseek-v3 / flux-schnell 等
    status            varchar(16) NOT NULL DEFAULT 'pending', -- pending/ready/published/failed
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_creations_status CHECK (status IN ('pending','ready','published','failed'))
);

CREATE INDEX IF NOT EXISTS idx_creations_user_created   ON creations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creations_prompt_hash    ON creations (prompt_hash) WHERE prompt_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_creations_agent_mode     ON creations (agent_mode, status) WHERE agent_mode = true;
CREATE INDEX IF NOT EXISTS idx_creations_status_created ON creations (status, created_at DESC);

DROP TRIGGER IF EXISTS trg_creations_updated_at ON creations;
CREATE TRIGGER trg_creations_updated_at BEFORE UPDATE ON creations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.3 creation_candidates  造梗候选（3 候选 + 自评打分）
CREATE TABLE IF NOT EXISTS creation_candidates (
    candidate_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creation_id   uuid NOT NULL REFERENCES creations(creation_id) ON DELETE CASCADE,
    idx           int NOT NULL,                        -- 0/1/2
    content       text,                                -- 文本候选
    image_url     varchar(512),                        -- 图片候选 URL
    self_score    numeric(4,2),                        -- Agent 自评分
    self_reason   text,                                -- 自评理由
    metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (creation_id, idx)
);

CREATE INDEX IF NOT EXISTS idx_creation_candidates_creation ON creation_candidates (creation_id);

-- 4.4 agent_jobs  Agent 任务（Pro 专属异步多步任务）
CREATE TABLE IF NOT EXISTS agent_jobs (
    job_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creation_id   uuid NOT NULL REFERENCES creations(creation_id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    steps_total   int NOT NULL DEFAULT 3,              -- RAG→3候选→自评
    steps_done    int NOT NULL DEFAULT 0,
    status        varchar(16) NOT NULL DEFAULT 'queued', -- queued/running/succeeded/failed/timeout
    fallback_used boolean NOT NULL DEFAULT false,      -- 是否降级为单次 prompt
    cost_estimate numeric(10,4) NOT NULL DEFAULT 0,    -- 预估成本（元）
    error         text,
    started_at    timestamptz,
    finished_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_agent_jobs_status CHECK (status IN ('queued','running','succeeded','failed','timeout'))
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_user_created ON agent_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status       ON agent_jobs (status, created_at) WHERE status IN ('queued','running');

DROP TRIGGER IF EXISTS trg_agent_jobs_updated_at ON agent_jobs;
CREATE TRIGGER trg_agent_jobs_updated_at BEFORE UPDATE ON agent_jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4.5 agent_steps  Agent 步骤明细（用于复盘与成本分析）
CREATE TABLE IF NOT EXISTS agent_steps (
    step_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id       uuid NOT NULL REFERENCES agent_jobs(job_id) ON DELETE CASCADE,
    step_no      int NOT NULL,                         -- 1/2/3
    step_name    varchar(32) NOT NULL,                 -- rag_retrieve/generate/self_score
    input        jsonb NOT NULL DEFAULT '{}'::jsonb,
    output       jsonb NOT NULL DEFAULT '{}'::jsonb,
    tokens_in    int NOT NULL DEFAULT 0,
    tokens_out   int NOT NULL DEFAULT 0,
    cost         numeric(10,4) NOT NULL DEFAULT 0,
    duration_ms  int NOT NULL DEFAULT 0,
    status       varchar(16) NOT NULL DEFAULT 'pending', -- pending/ok/failed
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (job_id, step_no)
);

CREATE INDEX IF NOT EXISTS idx_agent_steps_job ON agent_steps (job_id, step_no);

COMMENT ON TABLE agent_jobs  IS 'Pro 造梗 Agent 异步任务（3 步精简版：RAG→3候选→自评）';
COMMENT ON TABLE agent_steps IS 'Agent 每一步的输入输出与成本明细，用于复盘与成本归因';

-- =============================================================================
-- 5. 内容域 / Content Domain
-- =============================================================================

-- 5.1 meme_tags  标签字典（规范化标签）
CREATE TABLE IF NOT EXISTS meme_tags (
    tag_id    smallserial PRIMARY KEY,
    name      varchar(32) NOT NULL UNIQUE,
    category  varchar(32),
    use_count int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meme_tags_name_trgm ON meme_tags USING gin (name gin_trgm_ops);

-- 5.2 meme_cards  梗卡主表
CREATE TABLE IF NOT EXISTS meme_cards (
    meme_id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id        uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    creation_id      uuid REFERENCES creations(creation_id) ON DELETE SET NULL,
    type             varchar(16) NOT NULL,             -- text/image/video
    cover_url        varchar(512),
    title            text NOT NULL,
    title_tsv        tsvector,                         -- 全文检索列（触发器维护）
    tags             jsonb NOT NULL DEFAULT '[]'::jsonb, -- 冗余存标签数组（前端直读）
    legion_id        uuid,                             -- 军团归属（可选）
    score_avg        numeric(3,2) NOT NULL DEFAULT 0,  -- 综合评分 0-5
    score_count      int NOT NULL DEFAULT 0,
    comment_count    int NOT NULL DEFAULT 0,
    share_count      int NOT NULL DEFAULT 0,
    favorite_count   int NOT NULL DEFAULT 0,
    view_count       int NOT NULL DEFAULT 0,
    completion_rate  numeric(4,3) NOT NULL DEFAULT 0,  -- 视频完播率
    hot_score        numeric(10,4) NOT NULL DEFAULT 0, -- 热度分
    god_trash_status varchar(16) NOT NULL DEFAULT 'pending', -- pending/god/trash
    status           varchar(16) NOT NULL DEFAULT 'draft',   -- draft/pending_audit/published/manual_review/rejected/offline
    is_ai_generated  boolean NOT NULL DEFAULT true,
    watermarked      boolean NOT NULL DEFAULT true,    -- 合规标识
    published_at     timestamptz,
    deleted_at       timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_meme_type        CHECK (type IN ('text','image','video')),
    CONSTRAINT chk_meme_gt_status   CHECK (god_trash_status IN ('pending','god','trash')),
    CONSTRAINT chk_meme_status      CHECK (status IN ('draft','pending_audit','published','manual_review','rejected','offline'))
);

CREATE INDEX IF NOT EXISTS idx_meme_cards_author_created   ON meme_cards (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meme_cards_legion_status    ON meme_cards (legion_id, status) WHERE legion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meme_cards_hot_score        ON meme_cards (hot_score DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_meme_cards_status_published ON meme_cards (status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_meme_cards_god_trash        ON meme_cards (god_trash_status) WHERE god_trash_status <> 'pending';
CREATE INDEX IF NOT EXISTS idx_meme_cards_tags_gin         ON meme_cards USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_meme_cards_title_tsv        ON meme_cards USING gin (title_tsv);
CREATE INDEX IF NOT EXISTS idx_meme_cards_title_trgm       ON meme_cards USING gin (title gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_meme_cards_updated_at ON meme_cards;
CREATE TRIGGER trg_meme_cards_updated_at BEFORE UPDATE ON meme_cards
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- title_tsv 自动维护触发器（中文 simple 分词，生产可换 zhparser）
CREATE OR REPLACE FUNCTION meme_title_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.title_tsv := to_tsvector('simple', NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meme_cards_title_tsv ON meme_cards;
CREATE TRIGGER trg_meme_cards_title_tsv BEFORE INSERT OR UPDATE OF title ON meme_cards
    FOR EACH ROW EXECUTE FUNCTION meme_title_tsv_trigger();

COMMENT ON TABLE meme_cards IS '梗卡主表，产品最小内容单元';
COMMENT ON COLUMN meme_cards.hot_score         IS '热度分（PRD §8.1 公式，定时全量+事件增量）';
COMMENT ON COLUMN meme_cards.god_trash_status  IS '神/烂梗判定状态：pending/god/trash';
COMMENT ON COLUMN meme_cards.watermarked       IS '合规：所有 AI 生成内容强制带标识';

-- 5.3 meme_card_tags  梗卡-标签关联（结构化，便于聚合）
CREATE TABLE IF NOT EXISTS meme_card_tags (
    meme_id uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    tag_id  int  NOT NULL REFERENCES meme_tags(tag_id)   ON DELETE CASCADE,
    PRIMARY KEY (meme_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_meme_card_tags_tag ON meme_card_tags (tag_id);

-- =============================================================================
-- 6. 媒体域 / Media Domain
-- =============================================================================

-- 6.1 media_assets  媒体资产（图片/视频/音频统一管理）
CREATE TABLE IF NOT EXISTS media_assets (
    asset_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind        varchar(16) NOT NULL,                  -- image/video/audio
    bucket      varchar(32) NOT NULL DEFAULT 'r2',
    object_key  varchar(512) NOT NULL,
    cdn_url     varchar(512),
    mime_type   varchar(64),
    size_bytes  bigint,
    width       int,
    height      int,
    duration_ms int,
    sha256      varchar(64),
    metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_sha256 ON media_assets (sha256) WHERE sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_assets_kind   ON media_assets (kind, created_at DESC);

-- 6.2 meme_videos  梗视频（与 meme_cards 1:N，一条梗卡可有多版本视频）
CREATE TABLE IF NOT EXISTS meme_videos (
    video_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meme_id       uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    asset_id      uuid REFERENCES media_assets(asset_id) ON DELETE SET NULL,
    source_type   varchar(16) NOT NULL,                -- text_to_video/image_to_video/fallback_image_tts
    source_id     varchar(64),                         -- 上游任务 ID（火山方舟 task_id）
    duration      int NOT NULL,                        -- 秒，5/10/15
    voice_id      varchar(32),                         -- TTS 音色
    subtitle_text text,
    status        varchar(16) NOT NULL DEFAULT 'generating', -- generating/reviewing/published/rejected/timeout
    model_version varchar(32),                         -- seedance-2-mini/seedance-2-std/siliconflow
    file_url      varchar(512),
    cover_url     varchar(512),
    is_fallback   boolean NOT NULL DEFAULT false,      -- 是否为图片+TTS+Ken Burns 兜底
    ai_cost       numeric(10,4) NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_video_status CHECK (status IN ('generating','reviewing','published','rejected','timeout'))
);

CREATE INDEX IF NOT EXISTS idx_meme_videos_meme       ON meme_videos (meme_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meme_videos_status     ON meme_videos (status, created_at);
CREATE INDEX IF NOT EXISTS idx_meme_videos_model      ON meme_videos (model_version, created_at);

DROP TRIGGER IF EXISTS trg_meme_videos_updated_at ON meme_videos;
CREATE TRIGGER trg_meme_videos_updated_at BEFORE UPDATE ON meme_videos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6.3 video_jobs  视频生成异步任务
CREATE TABLE IF NOT EXISTS video_jobs (
    job_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id      uuid NOT NULL REFERENCES meme_videos(video_id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider      varchar(32) NOT NULL,                -- volcano/siliconflow/jimeng
    external_task_id varchar(64),
    webhook_secret varchar(128),                       -- HMAC 校验
    retry_count   int NOT NULL DEFAULT 0,
    status        varchar(16) NOT NULL DEFAULT 'queued', -- queued/running/succeeded/failed/timeout
    error         text,
    started_at    timestamptz,
    finished_at   timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_jobs_user       ON video_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_jobs_status     ON video_jobs (status, created_at) WHERE status IN ('queued','running');
CREATE INDEX IF NOT EXISTS idx_video_jobs_external   ON video_jobs (external_task_id) WHERE external_task_id IS NOT NULL;

-- =============================================================================
-- 7. 互动域 / Interaction Domain
-- =============================================================================

-- 7.1 ratings  评分
-- 注：原设计按月分区，但 UNIQUE(meme_id, user_id) 跨分区无法实现（PG16 要求分区表唯一约束包含分区键）。
--     MVP 阶段数据量小，改为普通表保留"一人一梗一评"唯一约束；未来数据量超 ~1000 万再加分区（届时需数据迁移）。
CREATE TABLE IF NOT EXISTS ratings (
    score_id          uuid NOT NULL DEFAULT gen_random_uuid(),
    meme_id           uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    user_id           uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    star              smallint NOT NULL CHECK (star BETWEEN 1 AND 5),
    dimensions        jsonb NOT NULL DEFAULT '{}'::jsonb, -- {laugh, creative, spread}
    is_judge          boolean NOT NULL DEFAULT false,   -- 是否评审官
    weight            numeric(4,2) NOT NULL DEFAULT 1.00, -- 加权 0.5/1.0/1.5
    is_god_trash_vote boolean NOT NULL DEFAULT false,   -- 用户二元判定
    comment           text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (score_id),
    UNIQUE (meme_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_meme_created   ON ratings (meme_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_user_created   ON ratings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_dimensions_gin ON ratings USING gin (dimensions);

COMMENT ON TABLE ratings IS '评分表：一人一梗一评（UNIQUE meme_id+user_id），普通表（MVP 不分区，未来数据量大再加分区）';

-- 7.2 comments  评论
CREATE TABLE IF NOT EXISTS comments (
    comment_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meme_id        uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    user_id        uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_id      uuid REFERENCES comments(comment_id) ON DELETE CASCADE, -- 评论楼中楼
    content        text NOT NULL,
    like_count     int NOT NULL DEFAULT 0,
    is_god_comment boolean NOT NULL DEFAULT false,    -- 神评
    is_meme_card   boolean NOT NULL DEFAULT false,    -- 造梗接龙：评论本身是梗卡
    ref_meme_id    uuid REFERENCES meme_cards(meme_id) ON DELETE SET NULL, -- 引用梗卡
    status         varchar(16) NOT NULL DEFAULT 'published', -- published/hidden/deleted
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_comments_meme_created  ON comments (meme_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_parent        ON comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_user_created  ON comments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_god_comment   ON comments (meme_id) WHERE is_god_comment = true;

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7.3 comment_likes  评论点赞
CREATE TABLE IF NOT EXISTS comment_likes (
    user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    comment_id uuid NOT NULL REFERENCES comments(comment_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes (comment_id);

-- 7.4 shares  转发记录（站内/站外）
CREATE TABLE IF NOT EXISTS shares (
    share_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meme_id    uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    user_id    uuid REFERENCES users(user_id) ON DELETE SET NULL,
    channel    varchar(16) NOT NULL,                 -- in_app/wechat/douyin/qq/link
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shares_meme_created ON shares (meme_id, created_at DESC);

-- 7.5 favorites  收藏
CREATE TABLE IF NOT EXISTS favorites (
    user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    meme_id    uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, meme_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_created ON favorites (user_id, created_at DESC);

-- =============================================================================
-- 8. 军团域 / Legion Domain
-- =============================================================================

-- 8.1 legions  梗大军
CREATE TABLE IF NOT EXISTS legions (
    legion_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name           citext NOT NULL UNIQUE,            -- 不区分大小写唯一
    slogan         varchar(140),
    avatar_url     varchar(512),
    theme_tags     jsonb NOT NULL DEFAULT '[]'::jsonb,
    leader_id      uuid NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    level          int NOT NULL DEFAULT 1,
    activity_score int NOT NULL DEFAULT 0,            -- 整活分
    member_count   int NOT NULL DEFAULT 0,
    member_cap     int NOT NULL DEFAULT 500,          -- 默认上限
    join_mode      varchar(16) NOT NULL DEFAULT 'approval', -- public/approval
    badges         jsonb NOT NULL DEFAULT '[]'::jsonb,
    pk_wins        int NOT NULL DEFAULT 0,
    pk_losses      int NOT NULL DEFAULT 0,
    status         varchar(16) NOT NULL DEFAULT 'active', -- active/frozen/dissolved
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    deleted_at     timestamptz,
    CONSTRAINT chk_legion_join_mode CHECK (join_mode IN ('public','approval')),
    CONSTRAINT chk_legion_status    CHECK (status IN ('active','frozen','dissolved'))
);

CREATE INDEX IF NOT EXISTS idx_legions_level_activity ON legions (level, activity_score DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_legions_status         ON legions (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_legions_theme_tags     ON legions USING gin (theme_tags);
CREATE INDEX IF NOT EXISTS idx_legions_name_trgm      ON legions USING gin ((name::text) gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_legions_updated_at ON legions;
CREATE TRIGGER trg_legions_updated_at BEFORE UPDATE ON legions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 8.2 legion_members  军团成员
CREATE TABLE IF NOT EXISTS legion_members (
    membership_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    legion_id     uuid NOT NULL REFERENCES legions(legion_id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role          varchar(16) NOT NULL DEFAULT 'member', -- leader/vice_leader/member
    contribution  int NOT NULL DEFAULT 0,                -- 贡献度
    joined_at     timestamptz NOT NULL DEFAULT now(),
    left_at       timestamptz,
    UNIQUE (legion_id, user_id),
    CONSTRAINT chk_legion_role CHECK (role IN ('leader','vice_leader','member'))
);

CREATE INDEX IF NOT EXISTS idx_legion_members_user      ON legion_members (user_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_legion_members_legion    ON legion_members (legion_id, contribution DESC) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_legion_members_role      ON legion_members (role) WHERE role IN ('leader','vice_leader');

-- 8.3 legion_levels  军团等级配置
CREATE TABLE IF NOT EXISTS legion_levels (
    level               int PRIMARY KEY,
    name                varchar(32) NOT NULL,           -- 如 "Lv.5 整活新秀军团"
    activity_required   int NOT NULL,
    member_cap          int NOT NULL,
    badges_unlocked     jsonb NOT NULL DEFAULT '[]'::jsonb,
    extra               jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 8.4 legion_chat_rooms  军团群聊房间（与 chat_rooms 1:1，业务字段在此）
--    简化：直接复用 chat_rooms.type='legion'，不单独建表。
--    如需独立配置，可在此扩展。

-- =============================================================================
-- 9. PK 域 / PK Domain
-- =============================================================================

-- 9.1 pk_matches  PK 比赛
CREATE TABLE IF NOT EXISTS pk_matches (
    pk_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type         varchar(16) NOT NULL,                 -- creation/vote/hotness
    legion_a     uuid NOT NULL REFERENCES legions(legion_id) ON DELETE RESTRICT,
    legion_b     uuid NOT NULL REFERENCES legions(legion_id) ON DELETE RESTRICT,
    theme        varchar(140) NOT NULL,
    start_at     timestamptz NOT NULL,
    end_at       timestamptz NOT NULL,
    status       varchar(16) NOT NULL DEFAULT 'idle',  -- idle/challenged/accepted/preparing/battling/judging/settled/archived
    score_a      numeric(10,4) NOT NULL DEFAULT 0,
    score_b      numeric(10,4) NOT NULL DEFAULT 0,
    winner_id    uuid REFERENCES legions(legion_id) ON DELETE SET NULL,
    mvp_user_id  uuid REFERENCES users(user_id) ON DELETE SET NULL,
    reward_state jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_official  boolean NOT NULL DEFAULT false,       -- 运营官方 PK
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_pk_type   CHECK (type IN ('creation','vote','hotness')),
    CONSTRAINT chk_pk_status CHECK (status IN ('idle','challenged','accepted','preparing','battling','judging','settled','archived')),
    CONSTRAINT chk_pk_legions CHECK (legion_a <> legion_b)
);

CREATE INDEX IF NOT EXISTS idx_pk_status_end    ON pk_matches (status, end_at);
CREATE INDEX IF NOT EXISTS idx_pk_legion_a      ON pk_matches (legion_a, status);
CREATE INDEX IF NOT EXISTS idx_pk_legion_b      ON pk_matches (legion_b, status);
CREATE INDEX IF NOT EXISTS idx_pk_winner        ON pk_matches (winner_id) WHERE winner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pk_official      ON pk_matches (is_official, start_at) WHERE is_official = true;

DROP TRIGGER IF EXISTS trg_pk_matches_updated_at ON pk_matches;
CREATE TRIGGER trg_pk_matches_updated_at BEFORE UPDATE ON pk_matches
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 9.2 pk_submissions  PK 提交的梗卡
CREATE TABLE IF NOT EXISTS pk_submissions (
    submission_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pk_id         uuid NOT NULL REFERENCES pk_matches(pk_id) ON DELETE CASCADE,
    meme_id       uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    legion_id     uuid NOT NULL REFERENCES legions(legion_id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    submitted_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (pk_id, meme_id)
);

CREATE INDEX IF NOT EXISTS idx_pk_submissions_pk_legion ON pk_submissions (pk_id, legion_id);

-- 9.3 pk_votes  PK 投票（每人每天每场 ≤3 票，应用层 + Redis 控制）
CREATE TABLE IF NOT EXISTS pk_votes (
    vote_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pk_id     uuid NOT NULL REFERENCES pk_matches(pk_id) ON DELETE CASCADE,
    user_id   uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    legion_id uuid NOT NULL REFERENCES legions(legion_id) ON DELETE CASCADE,
    voted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pk_votes_pk_legion   ON pk_votes (pk_id, legion_id);
CREATE INDEX IF NOT EXISTS idx_pk_votes_user_date   ON pk_votes (user_id, voted_at);
-- 注：原设计用 date_trunc('day', voted_at) 表达式索引，但 timestamptz 上 date_trunc 是 STABLE 非 IMMUTABLE，无法建索引。
--     改用 (user_id, voted_at) 普通索引，按天分组在应用层用范围查询（voted_at >= date AND voted_at < date+1）命中。
-- 部分唯一索引：每用户每场每天唯一一票（应用层允许 3 票则改为不唯一，此处保留示例）
-- CREATE UNIQUE INDEX IF NOT EXISTS uq_pk_votes_per_day
--   ON pk_votes (pk_id, user_id, (voted_at AT TIME ZONE 'Asia/Shanghai')::date);

-- 9.4 pk_rewards  PK 奖励发放记录
CREATE TABLE IF NOT EXISTS pk_rewards (
    reward_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pk_id       uuid NOT NULL REFERENCES pk_matches(pk_id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    legion_id   uuid NOT NULL REFERENCES legions(legion_id) ON DELETE CASCADE,
    reward_type varchar(32) NOT NULL,                 -- win_member/mvp/loser_participation
    meme_power  int NOT NULL DEFAULT 0,
    activity_score int NOT NULL DEFAULT 0,
    badge_code  varchar(64),
    pro_days    int NOT NULL DEFAULT 0,
    granted_at  timestamptz NOT NULL DEFAULT now(),
    metadata    jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_pk_rewards_user ON pk_rewards (user_id, granted_at DESC);
CREATE INDEX IF NOT EXISTS idx_pk_rewards_pk   ON pk_rewards (pk_id);

-- =============================================================================
-- 10. 聊天域 / Chat Domain
-- =============================================================================

-- 10.1 chat_rooms  聊天房间（私聊 / 军团群聊 / 系统）
CREATE TABLE IF NOT EXISTS chat_rooms (
    room_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type       varchar(16) NOT NULL,                  -- private/legion/system
    legion_id  uuid REFERENCES legions(legion_id) ON DELETE CASCADE,
    user_a     uuid REFERENCES users(user_id) ON DELETE CASCADE, -- 私聊 A
    user_b     uuid REFERENCES users(user_id) ON DELETE CASCADE, -- 私聊 B
    last_msg_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_room_type CHECK (type IN ('private','legion','system'))
);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_legion  ON chat_rooms (legion_id) WHERE legion_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_rooms_private ON chat_rooms (user_a, user_b) WHERE type = 'private';
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_msg ON chat_rooms (last_msg_at DESC);

-- 10.2 messages  消息（按月分区）
CREATE TABLE IF NOT EXISTS messages (
    message_id  uuid NOT NULL DEFAULT gen_random_uuid(),
    room_id     uuid NOT NULL REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    sender_id   uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    msg_type    varchar(16) NOT NULL,                 -- text/image/meme/voice/system
    content     text,
    extra       jsonb NOT NULL DEFAULT '{}'::jsonb,   -- 引用/@/梗卡引用/语音 url
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS messages_default PARTITION OF messages DEFAULT;
-- 月分区模板：
-- CREATE TABLE IF NOT EXISTS messages_2026_07 PARTITION OF messages
--   FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages (room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_extra_gin    ON messages USING gin (extra);

COMMENT ON TABLE messages IS '消息表：按 created_at 月分区；30 天前归档 OSS Parquet';

-- 10.3 message_reads  已读回执（按 room 维度记录每个用户最后已读消息）
CREATE TABLE IF NOT EXISTS message_reads (
    room_id         uuid NOT NULL REFERENCES chat_rooms(room_id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    last_read_at    timestamptz NOT NULL DEFAULT now(),
    last_read_msg_id uuid,
    PRIMARY KEY (room_id, user_id)
);

-- 10.4 notifications  系统通知
CREATE TABLE IF NOT EXISTS notifications (
    notif_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type       varchar(32) NOT NULL,                  -- rating/god_meme/pk/reward/violation/pro/agent_done
    title      varchar(140),
    body       text,
    payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_read    boolean NOT NULL DEFAULT false,
    push_status varchar(16) NOT NULL DEFAULT 'pending', -- pending/sent/failed/skipped
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread       ON notifications (user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type         ON notifications (type, created_at DESC);

-- =============================================================================
-- 11. 评分判定域 / Judgment Domain
-- =============================================================================

-- 11.1 reviewers  评审官（每月竞选，任期 30 天）
CREATE TABLE IF NOT EXISTS reviewers (
    reviewer_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    term_start_at  timestamptz NOT NULL,
    term_end_at    timestamptz NOT NULL,               --任期 30 天
    is_active      boolean NOT NULL DEFAULT true,
    elected_score  numeric(10,4),                      -- 竞选得分
    created_at     timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, term_start_at)
);

CREATE INDEX IF NOT EXISTS idx_reviewers_active ON reviewers (user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reviewers_term   ON reviewers (term_start_at, term_end_at);

-- 11.2 god_trash_judgments  神梗/烂梗判定记录
CREATE TABLE IF NOT EXISTS god_trash_judgments (
    judgment_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meme_id       uuid NOT NULL REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    result        varchar(16) NOT NULL,                -- god/trash
    score_avg     numeric(3,2) NOT NULL,
    score_count   int NOT NULL,
    one_star_rate numeric(4,3) NOT NULL,               -- 1 星占比
    triggered_at  timestamptz NOT NULL DEFAULT now(),
    metadata      jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_gt_judgments_meme    ON god_trash_judgments (meme_id);
CREATE INDEX IF NOT EXISTS idx_gt_judgments_result  ON god_trash_judgments (result, triggered_at DESC);

-- =============================================================================
-- 12. 商业化域 / Monetization Domain（v1.1 Pro + 视频按次包）
-- =============================================================================

-- 12.1 pro_subscriptions  Pro 会员订阅
CREATE TABLE IF NOT EXISTS pro_subscriptions (
    sub_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plan          varchar(16) NOT NULL DEFAULT 'monthly', -- monthly/yearly
    price_cents   int NOT NULL,                        -- 分（¥18=1800）
    start_at      timestamptz NOT NULL DEFAULT now(),
    end_at        timestamptz NOT NULL,
    auto_renew    boolean NOT NULL DEFAULT false,
    status        varchar(16) NOT NULL DEFAULT 'active', -- active/expired/cancelled/refunded
    order_id      uuid,                                -- 关联订单
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_pro_plan   CHECK (plan IN ('monthly','yearly')),
    CONSTRAINT chk_pro_status CHECK (status IN ('active','expired','cancelled','refunded'))
);

CREATE INDEX IF NOT EXISTS idx_pro_subs_user      ON pro_subscriptions (user_id, end_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_subs_active    ON pro_subscriptions (status, end_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pro_subs_expiring  ON pro_subscriptions (end_at) WHERE status = 'active' AND auto_renew = true;

DROP TRIGGER IF EXISTS trg_pro_subs_updated_at ON pro_subscriptions;
CREATE TRIGGER trg_pro_subs_updated_at BEFORE UPDATE ON pro_subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 12.2 video_packages  视频按次包
CREATE TABLE IF NOT EXISTS video_packages (
    package_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sku           varchar(32) NOT NULL,                -- pkg_10 / pkg_50
    total_quota   int NOT NULL,                        -- 10 / 50
    used_quota    int NOT NULL DEFAULT 0,
    price_cents   int NOT NULL,                        -- 990 / 2990
    order_id      uuid,
    expire_at     timestamptz,                         -- 长期有效可 NULL
    status        varchar(16) NOT NULL DEFAULT 'active', -- active/exhausted/expired
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_packages_user ON video_packages (user_id, status, expire_at);

-- 12.3 orders  订单
CREATE TABLE IF NOT EXISTS orders (
    order_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_type  varchar(16) NOT NULL,                -- pro / video_pkg
    product_ref   uuid,                                -- sub_id 或 package_id
    amount_cents  int NOT NULL,
    channel       varchar(16) NOT NULL,                -- wechat / alipay / apple
    status        varchar(16) NOT NULL DEFAULT 'pending', -- pending/paid/failed/refunded
    created_at    timestamptz NOT NULL DEFAULT now(),
    paid_at       timestamptz,
    metadata      jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_orders_user     ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders (status, created_at);

-- 12.4 payments  支付流水（与渠道对账）
CREATE TABLE IF NOT EXISTS payments (
    payment_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      uuid NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    channel       varchar(16) NOT NULL,
    channel_txn_id varchar(128),                       -- 渠道交易号
    amount_cents  int NOT NULL,
    status        varchar(16) NOT NULL DEFAULT 'pending', -- pending/success/failed/refunded
    raw_payload   jsonb NOT NULL DEFAULT '{}'::jsonb,
    paid_at       timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order   ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_channel ON payments (channel, channel_txn_id) WHERE channel_txn_id IS NOT NULL;

-- =============================================================================
-- 13. 安全域 / Safety Domain
-- =============================================================================

-- 13.1 sensitive_words  敏感词库（DFA 匹配）
CREATE TABLE IF NOT EXISTS sensitive_words (
    word_id    bigserial PRIMARY KEY,
    word       varchar(64) NOT NULL,
    category   varchar(32) NOT NULL,                  -- political/pornographic/violent/fraud/minor/troll
    level      smallint NOT NULL DEFAULT 1,            -- 1=拦截 2=审核 3=提示
    variants   jsonb NOT NULL DEFAULT '[]'::jsonb,     -- 拼音/繁体/拆字变体
    enabled    boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (word, category)
);

CREATE INDEX IF NOT EXISTS idx_sensitive_words_word_trgm ON sensitive_words USING gin (word gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sensitive_words_level     ON sensitive_words (level) WHERE enabled = true;

-- 13.2 reports  举报
CREATE TABLE IF NOT EXISTS reports (
    report_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    target_type varchar(16) NOT NULL,                  -- meme/comment/user/legion/message
    target_id   uuid NOT NULL,
    reason      varchar(64) NOT NULL,
    detail      text,
    status      varchar(16) NOT NULL DEFAULT 'pending', -- pending/handled/rejected
    handler_id  uuid REFERENCES users(user_id) ON DELETE SET NULL, -- 运营
    handled_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_target   ON reports (target_type, target_id);

-- 13.3 banned_users  封禁记录
CREATE TABLE IF NOT EXISTS banned_users (
    ban_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason      varchar(64) NOT NULL,
    ban_until   timestamptz,                           -- NULL=永久
    banned_by   uuid REFERENCES users(user_id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banned_users_user ON banned_users (user_id, ban_until);

-- 13.4 audit_logs  审核日志（按月分区）
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id    uuid NOT NULL DEFAULT gen_random_uuid(),
    target_id   uuid NOT NULL,
    target_type varchar(32) NOT NULL,                  -- meme_card/meme_video/comment/legion/user
    action      varchar(32) NOT NULL,                  -- machine_pass/machine_reject/manual_pass/manual_reject/hide/delete
    reason      varchar(128),
    result      varchar(16) NOT NULL,                  -- pass/reject/queue
    operator_id uuid REFERENCES users(user_id) ON DELETE SET NULL,
    metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (audit_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS audit_logs_default PARTITION OF audit_logs DEFAULT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_target  ON audit_logs (target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs (operator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action  ON audit_logs (action, created_at DESC);

COMMENT ON TABLE audit_logs IS '审核日志：机审+人审，按 created_at 月分区';

-- =============================================================================
-- 14. AI 成本域 / AI Cost Domain
-- =============================================================================

-- 14.1 ai_cost_logs  AI 调用成本日志（按月分区，对齐 §14 看板）
CREATE TABLE IF NOT EXISTS ai_cost_logs (
    log_id        uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id      uuid REFERENCES users(user_id) ON DELETE SET NULL,
    module       varchar(32) NOT NULL,                 -- creation/image/video/tts/audit/agent/judge
    provider     varchar(32) NOT NULL,                 -- deepseek/glm/siliconflow/volcano/aliyun
    model        varchar(64) NOT NULL,
    tokens_in    int NOT NULL DEFAULT 0,
    tokens_out   int NOT NULL DEFAULT 0,
    images       int NOT NULL DEFAULT 0,
    video_secs   numeric(8,2) NOT NULL DEFAULT 0,
    cost_cents   int NOT NULL,                         -- 分（避免浮点误差）
    latency_ms   int NOT NULL DEFAULT 0,
    status       varchar(16) NOT NULL DEFAULT 'ok',    -- ok/failed/timeout
    request_id   varchar(64),
    created_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (log_id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS ai_cost_logs_default PARTITION OF ai_cost_logs DEFAULT;

CREATE INDEX IF NOT EXISTS idx_ai_cost_user    ON ai_cost_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_module  ON ai_cost_logs (module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_provider ON ai_cost_logs (provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_daily   ON ai_cost_logs (created_at, module);
-- 注：原设计用 date_trunc('day', created_at) 表达式索引，但 timestamptz 上 date_trunc 是 STABLE 非 IMMUTABLE，无法建索引。
--     改用 (created_at, module) 普通索引，按天聚合在应用层用范围查询命中。

COMMENT ON TABLE ai_cost_logs IS 'AI 调用成本日志：日预算熔断看板数据源，按月分区';

-- =============================================================================
-- 15. 向量域 / Vector Domain (pgvector)
-- =============================================================================

-- 15.1 meme_embeddings  梗卡向量（RAG 知识库 + 推荐召回）
CREATE TABLE IF NOT EXISTS meme_embeddings (
    meme_id      uuid PRIMARY KEY REFERENCES meme_cards(meme_id) ON DELETE CASCADE,
    embedding    vector(768) NOT NULL,                 -- bge-m3 / text-embedding-3-small
    model        varchar(64) NOT NULL,
    style_tags   jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_god_meme  boolean NOT NULL DEFAULT false,       -- 仅神梗入 RAG 库
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- HNSW 索引：更新友好，余弦距离 ops
CREATE INDEX IF NOT EXISTS idx_meme_embeddings_hnsw
  ON meme_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_meme_embeddings_god ON meme_embeddings (is_god_meme) WHERE is_god_meme = true;

DROP TRIGGER IF EXISTS trg_meme_embeddings_updated_at ON meme_embeddings;
CREATE TRIGGER trg_meme_embeddings_updated_at BEFORE UPDATE ON meme_embeddings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE meme_embeddings IS '梗卡向量（768 维，bge-m3）：神梗入 RAG 知识库，余弦检索 top5 作为造梗 few-shot';

-- 15.2 user_interest_embeddings  用户兴趣向量（个性化推荐）
CREATE TABLE IF NOT EXISTS user_interest_embeddings (
    user_id           uuid PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    interest_vector   vector(768),                     -- 兴趣标签向量
    behavior_vector   vector(768),                     -- 近期行为聚合向量
    model             varchar(64) NOT NULL,
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_interest_emb_hnsw
  ON user_interest_embeddings USING hnsw (behavior_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_user_interest_emb_int_hnsw
  ON user_interest_embeddings USING hnsw (interest_vector vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMENT ON TABLE user_interest_embeddings IS '用户兴趣向量（768 维）：双塔召回用 behavior_vector';

-- 15.3 prompt_template_embeddings  Prompt 模板向量（模板推荐）
CREATE TABLE IF NOT EXISTS prompt_template_embeddings (
    template_id uuid PRIMARY KEY REFERENCES prompt_templates(template_id) ON DELETE CASCADE,
    embedding   vector(768) NOT NULL,
    tags        jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_template_emb_hnsw
  ON prompt_template_embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- 15. 埋点与审计（Tracking & Audit）— 15.4 analytics_events
-- =============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
    event_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name  varchar(128) NOT NULL,
    user_id     uuid REFERENCES users(user_id) ON DELETE SET NULL,
    properties  jsonb NOT NULL DEFAULT '{}'::jsonb,
    platform    varchar(16) NOT NULL DEFAULT 'app',
    session_id  varchar(128),
    device_id   varchar(128),
    client_ip   inet,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created  ON analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created  ON analytics_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created       ON analytics_events (created_at DESC);

-- =============================================================================
-- 16. 视图与物化视图 / Views & Materialized Views
-- =============================================================================

-- 16.1 视图：v_hot_meme_cards  热门梗卡（published 且未删）
CREATE OR REPLACE VIEW v_hot_meme_cards AS
SELECT meme_id, author_id, type, cover_url, title, tags, legion_id,
       score_avg, score_count, comment_count, share_count, hot_score,
       god_trash_status, published_at
FROM meme_cards
WHERE status = 'published' AND deleted_at IS NULL
ORDER BY hot_score DESC;

COMMENT ON VIEW v_hot_meme_cards IS '热门梗卡视图，直读 feed 用';

-- 16.2 视图：v_pk_active  进行中 PK
CREATE OR REPLACE VIEW v_pk_active AS
SELECT p.pk_id, p.type, p.theme, p.legion_a, p.legion_b,
       p.status, p.score_a, p.score_b, p.start_at, p.end_at,
       a.name AS legion_a_name, b.name AS legion_b_name
FROM pk_matches p
JOIN legions a ON a.legion_id = p.legion_a
JOIN legions b ON b.legion_id = p.legion_b
WHERE p.status IN ('preparing','battling','judging')
  AND p.end_at > now();

COMMENT ON VIEW v_pk_active IS '进行中 PK 视图，PK 大厅用';

-- 16.3 物化视图：mv_user_meme_power  用户梗力值排行（每小时刷新）
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_meme_power AS
SELECT u.user_id, u.nickname, u.avatar_url, u.level, u.meme_power,
       u.defense_value, u.energy_balance,
       COUNT(DISTINCT m.meme_id) AS meme_count,
       COUNT(DISTINCT m.meme_id) FILTER (WHERE m.god_trash_status = 'god') AS god_count,
       COALESCE(AVG(m.score_avg) FILTER (WHERE m.score_count >= 50), 0) AS avg_score
FROM users u
LEFT JOIN meme_cards m ON m.author_id = u.user_id AND m.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.user_id, u.nickname, u.avatar_url, u.level, u.meme_power, u.defense_value, u.energy_balance
ORDER BY u.meme_power DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_meme_power_uid ON mv_user_meme_power (user_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_meme_power_rank ON mv_user_meme_power (meme_power DESC);

COMMENT ON MATERIALIZED VIEW mv_user_meme_power IS '用户梗力值物化视图，每小时刷新一次';

-- 16.4 物化视图：mv_legion_rank  军团排行（每日刷新）
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_legion_rank AS
SELECT l.legion_id, l.name, l.avatar_url, l.level, l.activity_score,
       l.member_count, l.pk_wins, l.pk_losses,
       l.pk_wins + l.pk_losses AS pk_total,
       CASE WHEN (l.pk_wins + l.pk_losses) > 0
            THEN l.pk_wins::numeric / (l.pk_wins + l.pk_losses)
            ELSE 0 END AS win_rate,
       COUNT(DISTINCT m.meme_id) AS meme_count,
       COUNT(DISTINCT m.meme_id) FILTER (WHERE m.god_trash_status = 'god') AS god_count
FROM legions l
LEFT JOIN meme_cards m ON m.legion_id = l.legion_id AND m.deleted_at IS NULL
WHERE l.deleted_at IS NULL AND l.status = 'active'
GROUP BY l.legion_id, l.name, l.avatar_url, l.level, l.activity_score,
         l.member_count, l.pk_wins, l.pk_losses
ORDER BY l.activity_score DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_legion_rank_id ON mv_legion_rank (legion_id);
CREATE INDEX IF NOT EXISTS idx_mv_legion_rank_score ON mv_legion_rank (activity_score DESC);

COMMENT ON MATERIALIZED VIEW mv_legion_rank IS '军团排行榜物化视图，每日刷新';

-- =============================================================================
-- 17. 收尾 / Finalize
-- =============================================================================
-- 授权（按需调整）
-- GRANT CONNECT ON DATABASE meme TO app;
-- GRANT USAGE ON SCHEMA public TO app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app;

-- 提示：分区表未来按月建分区后，需对新分区单独 GRANT。

-- =============================================================================
-- END OF schema.sql
-- =============================================================================
