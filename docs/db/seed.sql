-- =============================================================================
-- 「梗星球」MemeChatAI · 种子数据 / Seed Data
-- -----------------------------------------------------------------------------
-- 版本:    v1.0.0
-- 适配:    schema.sql v1.0.0（先执行 schema.sql 再执行本文件）
-- 说明:    包含官方 Prompt 模板、TTS 音色、敏感词样例、示例军团、示例神梗
--          （含 embedding）、运营后台初始账号。
-- =============================================================================

-- =============================================================================
-- 1. 运营后台初始账号 / Admin Account
-- =============================================================================
-- 该账号为运营管理员，is_official=true；无密码（登录走 Supabase Auth）。
-- 实际部署时通过 Supabase 创建后由 Webhook 同步过来；此处预置一条记录便于本地调试。
INSERT INTO users (user_id, supabase_uid, nickname, avatar_url, status, is_official, level, meme_power, energy_balance)
VALUES (
    '00000000-0000-0000-0000-admin0001'::uuid,
    NULL,
    '梗星球运营官',
    'https://cdn.example.com/avatars/official.png',
    'active',
    true,
    99,
    99999,
    99999
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, interest_tags, badges, privacy, notification_pref)
VALUES (
    '00000000-0000-0000-0000-admin0001'::uuid,
    '["官方","运营","审核"]'::jsonb,
    '["official"]'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb
)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- 2. 官方 Prompt 模板 / Official Prompt Templates（5 个）
-- =============================================================================
-- 对齐 PRD §5 模块 2：抽象段子 / 阴阳怪气 / 谐音梗 / 反转梗 / 表情包配文

INSERT INTO prompt_templates (template_id, mode, name, system_prompt, user_template, style, variables, is_official, status)
VALUES
(
    'tpl-0001-abstract-0001-0001'::uuid,
    'text',
    '抽象段子',
    '你是 Z 世代抽象文化段子手。请基于用户给的关键词，生成 1 条 50 字以内的抽象段子，要求：信息密度高、跳脱逻辑、有"破防"笑点；不要俗套、不要解释。输出 JSON 数组，每条一个元素。',
    '关键词：{{keyword}}\n风格倾向：{{style}}\n请生成 3 条候选。',
    'abstract',
    '["keyword","style"]'::jsonb,
    true,
    'active'
),
(
    'tpl-0002-yin-yang-0001-0001'::uuid,
    'text',
    '阴阳怪气',
    '你是擅长阴阳怪气表达的段子手。用"看似夸赞实则嘲讽"的句式生成段子，要求反讽精准、不直接攻击、留白让读者会心一笑。输出 JSON 数组。',
    '对象/事件：{{keyword}}\n请生成 3 条阴阳怪气风格的候选。',
    'yin_yang',
    '["keyword"]'::jsonb,
    true,
    'active'
),
(
    'tpl-0003-homophone-0001-0001'::uuid,
    'text',
    '谐音梗',
    '你是中文谐音梗创作专家。请基于关键词挖掘同音/近音/谐音联想，生成 3 条谐音梗候选，要求谐音自然、不生硬、有"哦~原来如此"的笑点。输出 JSON 数组。',
    '关键词：{{keyword}}\n请生成 3 条谐音梗候选。',
    'homophone',
    '["keyword"]'::jsonb,
    true,
    'active'
),
(
    'tpl-0004-twist-0001-0001'::uuid,
    'text',
    '反转梗',
    '你是擅长结尾反转的段子手。结构：铺垫情境 → 抛出预期 → 结尾反转打破预期。要求 50 字以内、反转必须出人意料但又自洽。输出 JSON 数组。',
    '情境：{{keyword}}\n请生成 3 条带反转结构的候选。',
    'twist',
    '["keyword"]'::jsonb,
    true,
    'active'
),
(
    'tpl-0005-meme-caption-0001-0001'::uuid,
    'image',
    '表情包配文',
    '你是表情包文案专家。请基于用户描述的场景，生成适合叠加在图片上的简短配文（≤15 字），要求：口语化、强反差、易传播。输出 JSON 数组，每条含 caption 字段。',
    '场景：{{keyword}}\n请生成 3 条表情包配文候选。',
    'meme_caption',
    '["keyword"]'::jsonb,
    true,
    'active'
)
ON CONFLICT (template_id) DO NOTHING;

-- =============================================================================
-- 3. TTS 音色配置 / TTS Voice Config（4 种）
-- =============================================================================
-- TTS 音色配置以单独的 app 配置表存（此处用 media_assets.metadata 兜底），
-- 但为简化种子，存入一张轻量配置表。schema.sql 未单独建表，这里用通用 jsonb 配置插入到一个常量表。
-- 若需结构化，可后续在 schema.sql 中新增 tts_voices 表。

-- 简化：用 DO 块 + 临时表方式落 4 条音色配置；正式版建议抽到独立表。
CREATE TABLE IF NOT EXISTS tts_voices (
    voice_id    varchar(32) PRIMARY KEY,
    name        varchar(32) NOT NULL,
    provider    varchar(32) NOT NULL DEFAULT 'volcano',
    speaker_id  varchar(64),
    style       varchar(32),
    description varchar(140),
    enabled     boolean NOT NULL DEFAULT true
);

INSERT INTO tts_voices (voice_id, name, provider, speaker_id, style, description)
VALUES
('voice_funny',   '搞怪音',  'volcano', 'zh_male_funny',    'funny',    '夸张搞怪男声，适合抽象段子'),
('voice_dongbei', '东北音',  'volcano', 'zh_female_dongbei','northeast','东北大姐口音，接地气'),
('voice_yujie',   '御姐音',  'volcano', 'zh_female_yujie',  'mature',   '成熟御姐女声，阴阳怪气必备'),
('voice_robot',   '机器人音','volcano', 'zh_male_robot',    'robot',    '机械合成感，适合 AI 主题梗')
ON CONFLICT (voice_id) DO NOTHING;

-- =============================================================================
-- 4. 敏感词库样例 / Sensitive Words Sample（20 条）
-- =============================================================================
INSERT INTO sensitive_words (word, category, level)
VALUES
('政治敏感词1', 'political', 1),
('政治敏感词2', 'political', 1),
('色情词1',     'pornographic', 1),
('色情词2',     'pornographic', 1),
('色情词3',     'pornographic', 2),
('暴恐词1',     'violent', 1),
('暴恐词2',     'violent', 1),
('诈骗词1',     'fraud', 1),
('诈骗词2',     'fraud', 2),
('诈骗词3',     'fraud', 2),
('未成年保护1','minor', 1),
('未成年保护2','minor', 1),
('引战词1',     'troll', 2),
('引战词2',     'troll', 3),
('引战词3',     'troll', 3),
('低俗词1',     'troll', 2),
('低俗词2',     'troll', 3),
('违禁词1',     'political', 1),
('违禁词2',     'fraud', 2),
('违禁词3',     'pornographic', 1)
ON CONFLICT (word, category) DO NOTHING;

-- =============================================================================
-- 5. 示例军团 / Sample Legions（3 个）
-- =============================================================================
-- 用 admin 账号作为 leader，3 个不同主题军团
INSERT INTO legions (legion_id, name, slogan, leader_id, level, activity_score, member_count, member_cap, join_mode, theme_tags, status)
VALUES
(
    'lg-0001-abstract-0001-0001'::uuid,
    '抽象艺术团',
    '生活太抽象，我们更抽象',
    '00000000-0000-0000-0000-admin0001'::uuid,
    3, 1200, 1, 500, 'approval',
    '["抽象","段子","整活"]'::jsonb,
    'active'
),
(
    'lg-0002-yin-yang-0001-0001'::uuid,
    '阴阳怪气联盟',
    '表面笑嘻嘻，心里 mmp',
    '00000000-0000-0000-0000-admin0001'::uuid,
    2, 800, 1, 500, 'public',
    '["阴阳","反讽","互联网"]'::jsonb,
    'active'
),
(
    'lg-0003-emoji-0001-0001'::uuid,
    '表情包研究所',
    '万物皆可表情包',
    '00000000-0000-0000-0000-admin0001'::uuid,
    1, 300, 1, 500, 'public',
    '["表情包","梗图","二次元"]'::jsonb,
    'active'
)
ON CONFLICT (legion_id) DO NOTHING;

-- leader 自动成为各军团成员
INSERT INTO legion_members (legion_id, user_id, role, contribution)
VALUES
('lg-0001-abstract-0001-0001'::uuid, '00000000-0000-0000-0000-admin0001'::uuid, 'leader', 100),
('lg-0002-yin-yang-0001-0001'::uuid, '00000000-0000-0000-0000-admin0001'::uuid, 'leader', 80),
('lg-0003-emoji-0001-0001'::uuid,    '00000000-0000-0000-0000-admin0001'::uuid, 'leader', 50)
ON CONFLICT (legion_id, user_id) DO NOTHING;

-- 军团等级配置（1-5 级样例）
INSERT INTO legion_levels (level, name, activity_required, member_cap, badges_unlocked)
VALUES
(1, '新军团',     0,    500, '["founder"]'::jsonb),
(2, '活跃军团',   500,  800, '["founder","active_30d"]'::jsonb),
(3, '整活军团',   2000, 1200, '["founder","active_30d","pk_3wins"]'::jsonb),
(4, '神梗军团',   8000, 2000, '["founder","active_30d","pk_3wins","god_100"]'::jsonb),
(5, '传说军团',   30000,5000, '["founder","active_30d","pk_3wins","god_100","legend"]'::jsonb)
ON CONFLICT (level) DO NOTHING;

-- =============================================================================
-- 6. 示例神梗 / Sample God Meme（含 embedding）
-- =============================================================================
-- 1 条示例神梗：作者=运营官，归属=抽象艺术团，type=text，god_trash_status=god
INSERT INTO meme_cards (
    meme_id, author_id, type, title, tags, legion_id,
    score_avg, score_count, comment_count, share_count, hot_score,
    god_trash_status, status, is_ai_generated, watermarked, published_at
)
VALUES (
    'meme-0001-god-0001-0001-0001'::uuid,
    '00000000-0000-0000-0000-admin0001'::uuid,
    'text',
    '我的生活就像薛定谔的猫，没打开盒子里面前，我既是富的也是穷的——打开之后，就只是穷的。',
    '["抽象","反转","薛定谔"]'::jsonb,
    'lg-0001-abstract-0001-0001'::uuid,
    4.65,
    233,
    18,
    42,
    8.92,
    'god',
    'published',
    true,
    true,
    now() - interval '2 days'
)
ON CONFLICT (meme_id) DO NOTHING;

-- 同步插入到向量库（768 维示例向量，用 0.02 填充避免零向量）
-- 实际生产由 RAG Worker 调 bge-m3 生成。
INSERT INTO meme_embeddings (meme_id, embedding, model, style_tags, is_god_meme)
VALUES (
    'meme-0001-god-0001-0001-0001'::uuid,
    (
        -- 构造一个 768 维的示例向量（归一化前每维 0.036，实际生产由 bge-m3 生成）。
        -- pgvector 支持 text 形式 cast：'[0.036,0.036,...]'::vector(768)
        ('[' || (SELECT string_agg('0.036', ',') FROM generate_series(1, 768)) || ']')::vector(768)
    ),
    'bge-m3',
    '["抽象","反转","薛定谔"]'::jsonb,
    true
)
ON CONFLICT (meme_id) DO NOTHING;

-- 神梗判定记录
INSERT INTO god_trash_judgments (meme_id, result, score_avg, score_count, one_star_rate)
VALUES (
    'meme-0001-god-0001-0001-0001'::uuid,
    'god',
    4.65,
    233,
    0.086
)
ON CONFLICT DO NOTHING;

-- 3 条标签字典（与示例神梗 tags 对齐）
INSERT INTO meme_tags (name, category, use_count)
VALUES
('抽象',  'style', 1),
('反转',  'style', 1),
('薛定谔','topic', 1)
ON CONFLICT (name) DO UPDATE SET use_count = meme_tags.use_count + 1;

-- 关联梗卡与标签
INSERT INTO meme_card_tags (meme_id, tag_id)
SELECT 'meme-0001-god-0001-0001-0001'::uuid, tag_id FROM meme_tags
WHERE name IN ('抽象','反转','薛定谔')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. 普通用户示例 / Sample Normal User（便于本地联调）
-- =============================================================================
INSERT INTO users (user_id, nickname, status, level, meme_power, energy_balance, is_pro)
VALUES (
    '00000000-0000-0000-0000-user00001'::uuid,
    '整活新秀小明',
    'active',
    5,
    320,
    80,
    true
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, interest_tags, badges)
VALUES (
    '00000000-0000-0000-0000-user00001'::uuid,
    '["抽象","谐音梗","二次元"]'::jsonb,
    '["first_god_meme","7day_streak"]'::jsonb
)
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- 8. 物化视图刷新 / Refresh Materialized Views
-- =============================================================================
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_meme_power;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_legion_rank;

-- =============================================================================
-- END OF seed.sql
-- =============================================================================
