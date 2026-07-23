/**
 * Drizzle ORM schema —— MemeChatAI 后端权威类型化 DDL
 *
 * 与 `docs/db/schema.sql` 字段对齐；本文件是 TS 视角的权威，
 * SQL 仍是数据库实际建表的权威来源（见 `30-context-maintenance.mdc`）。
 *
 * 命名约定：
 * - 表名复数 snake_case（与 SQL 一致）
 * - 列名 snake_case（与 SQL 一致）
 * - TS 导出使用 camelCase 别名（drizzle 自动 camelCase 映射用的就是这些标识符）
 *
 * 注：当前只覆盖 **用户域** 5 张表（S1 T1.1 范围）。
 * 其余域随 Sprint 推进逐步补充：
 * - 内容域（meme_card / meme_embedding / meme_stats）
 * - 互动域（rating / comment / like / share）
 * - 军团域（legions / legion_members / pk / pk_votes）
 * - AI/任务域（creation_session / prompt_template / ai_cost_log）
 * - 审核域（audit_log / sensitive_words）
 * - 埋点域（analytics_event）
 */

import {
  boolean,
  check,
  customType,
  date,
  decimal,
  foreignKey,
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  bigserial,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// -----------------------------------------------------------------------------
// 联合类型注解（仅 TS 侧；SQL 列仍是 varchar + CHECK，与 docs/db/schema.sql 对齐）
// -----------------------------------------------------------------------------

/** users.status 列允许值：active/banned/teen_mode/deleted */
export type UserStatus = 'active' | 'banned' | 'teen_mode' | 'deleted';

/** users.gender 列允许值：male/female/other/unknown */
export type Gender = 'male' | 'female' | 'other' | 'unknown';

/** user_badges.badge_type 列允许值：achievement/cosmetic */
export type BadgeType = 'achievement' | 'cosmetic';

// -----------------------------------------------------------------------------
// 3.1 users —— 用户主表（Supabase Auth 同步）
// -----------------------------------------------------------------------------

export const users = pgTable(
  'users',
  {
    userId: uuid('user_id').primaryKey().defaultRandom(),
    supabaseUid: uuid('supabase_uid').unique(),
    phone: varchar('phone', { length: 20 }).unique(),
    email: text('email').unique(),
    nickname: varchar('nickname', { length: 32 }).notNull(),
    avatarUrl: varchar('avatar_url', { length: 512 }),
    gender: varchar('gender', { length: 16 }),
    birthday: date('birthday'),
    bio: varchar('bio', { length: 140 }),
    level: integer('level').notNull().default(1),
    memePower: integer('meme_power').notNull().default(0),
    defenseValue: integer('defense_value').notNull().default(0),
    energyBalance: integer('energy_balance').notNull().default(100),
    legionCount: integer('legion_count').notNull().default(0),
    status: varchar('status', { length: 16 }).notNull().default('active'),
    isPro: boolean('is_pro').notNull().default(false),
    isOfficial: boolean('is_official').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    nicknameTrgmIdx: index('idx_users_nickname_trgm').using('gin', sql`${t.nickname} gin_trgm_ops`),
    statusIdx: index('idx_users_status')
      .on(t.status)
      .where(sql`${t.deletedAt} IS NULL`),
    createdAtIdx: index('idx_users_created_at').on(t.createdAt),
    isProIdx: index('idx_users_is_pro')
      .on(t.isPro)
      .where(sql`${t.isPro} = true`),
    statusCheck: check(
      'chk_users_status',
      sql`${t.status} IN ('active', 'banned', 'teen_mode', 'deleted')`,
    ),
  }),
);

// -----------------------------------------------------------------------------
// 3.2 user_profiles —— 用户扩展资料
// -----------------------------------------------------------------------------

/** JSON 形态的兴趣标签快照（array<string>，结构化版本见 user_interest_tags） */
export type InterestTags = string[];
/** 勋章列表（jsonb 快照；结构化版本见 user_badges） */
export type BadgeSnapshot = Array<{ code: string; acquiredAt: string }>;
export type PrivacyPref = Record<string, boolean | string>;
export type NotificationPref = Record<string, boolean | string>;

export const userProfiles = pgTable(
  'user_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    interestTags: jsonb('interest_tags')
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<InterestTags>(),
    badges: jsonb('badges')
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<BadgeSnapshot>(),
    privacy: jsonb('privacy')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<PrivacyPref>(),
    notificationPref: jsonb('notification_pref')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<NotificationPref>(),
    teenModeUntil: timestamp('teen_mode_until', { withTimezone: true }),
    nicknameChangedAt: timestamp('nickname_changed_at', {
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    interestTagsIdx: index('idx_user_profiles_interest_tags').using('gin', t.interestTags),
  }),
);

// -----------------------------------------------------------------------------
// 3.3 user_interest_tags —— 用户兴趣标签（结构化）
// -----------------------------------------------------------------------------

export const userInterestTags = pgTable(
  'user_interest_tags',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    tag: varchar('tag', { length: 32 }).notNull(),
    weight: decimal('weight', { precision: 5, scale: 2 }).notNull().default('1.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.tag] }),
    tagIdx: index('idx_user_interest_tags_tag').on(t.tag),
  }),
);

// -----------------------------------------------------------------------------
// 3.4 user_badges —— 用户勋章
// -----------------------------------------------------------------------------

export const userBadges = pgTable(
  'user_badges',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    badgeCode: varchar('badge_code', { length: 64 }).notNull(),
    badgeType: varchar('badge_type', { length: 16 }).notNull(),
    acquiredAt: timestamp('acquired_at', { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Record<string, unknown>>(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.badgeCode] }),
    typeIdx: index('idx_user_badges_type').on(t.badgeType),
  }),
);

// -----------------------------------------------------------------------------
// 3.5 user_follows —— 用户关注关系
// -----------------------------------------------------------------------------

export const userFollows = pgTable(
  'user_follows',
  {
    followerId: uuid('follower_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    followeeId: uuid('followee_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.followerId, t.followeeId] }),
    followeeIdx: index('idx_user_follows_followee').on(t.followeeId, sql`${t.createdAt} DESC`),
    selfFollowCheck: check('chk_follow_self', sql`${t.followerId} <> ${t.followeeId}`),
  }),
);

// -----------------------------------------------------------------------------
// 4.1 prompt_templates —— 造梗 Prompt 模板库
// -----------------------------------------------------------------------------

/** prompt_templates.mode 列允许值 */
export type PromptMode = 'text' | 'image' | 'script';

export const promptTemplates = pgTable(
  'prompt_templates',
  {
    templateId: uuid('template_id').primaryKey().defaultRandom(),
    mode: varchar('mode', { length: 16 }).notNull(),
    name: varchar('name', { length: 64 }).notNull(),
    systemPrompt: text('system_prompt').notNull(),
    userTemplate: text('user_template').notNull(),
    style: varchar('style', { length: 32 }),
    variables: jsonb('variables')
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<string[]>(),
    exampleOutput: jsonb('example_output').$type<unknown>(),
    isOfficial: boolean('is_official').notNull().default(false),
    creatorId: uuid('creator_id').references(() => users.userId, {
      onDelete: 'set null',
    }),
    useCount: integer('use_count').notNull().default(0),
    status: varchar('status', { length: 16 }).notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    modeIdx: index('idx_prompt_templates_mode').on(t.mode),
    officialIdx: index('idx_prompt_templates_official').on(t.isOfficial, t.status),
    useCountIdx: index('idx_prompt_templates_use_count').on(t.useCount),
  }),
);

// -----------------------------------------------------------------------------
// 4.2 analytics_events —— 埋点事件表
// -----------------------------------------------------------------------------

export type AnalyticsEventName = string;

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    eventId: uuid('event_id').primaryKey().defaultRandom(),
    eventName: varchar('event_name', { length: 128 }).notNull(),
    userId: uuid('user_id').references(() => users.userId, { onDelete: 'set null' }),
    properties: jsonb('properties')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Record<string, unknown>>(),
    platform: varchar('platform', { length: 16 }).notNull().default('app'),
    sessionId: varchar('session_id', { length: 128 }),
    deviceId: varchar('device_id', { length: 128 }),
    clientIp: inet('client_ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameCreatedIdx: index('idx_analytics_events_name_created').on(t.eventName, t.createdAt),
    userCreatedIdx: index('idx_analytics_events_user_created').on(t.userId, t.createdAt),
    createdIdx: index('idx_analytics_events_created').on(t.createdAt),
  }),
);

// -----------------------------------------------------------------------------
// 4.2 creations —— 造梗会话（覆盖单次 prompt 与 Agent 模式）
// -----------------------------------------------------------------------------

/** creations.status 列允许值 */
export type CreationStatus = 'pending' | 'ready' | 'published' | 'failed';

/** creations.mode 列允许值（复用 PromptMode 语义） */
export type CreationMode = 'text' | 'image' | 'script';

export const creations = pgTable(
  'creations',
  {
    creationId: uuid('creation_id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    mode: varchar('mode', { length: 16 }).notNull(),
    agentMode: boolean('agent_mode').notNull().default(false),
    agentJobId: uuid('agent_job_id'),
    prompt: text('prompt').notNull(),
    promptHash: varchar('prompt_hash', { length: 64 }),
    style: varchar('style', { length: 32 }),
    templateId: uuid('template_id').references(() => promptTemplates.templateId, {
      onDelete: 'set null',
    }),
    chosenCandidate: integer('chosen_candidate'),
    energyCost: integer('energy_cost').notNull().default(0),
    modelVersion: varchar('model_version', { length: 64 }),
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('idx_creations_user_created').on(t.userId, t.createdAt),
    promptHashIdx: index('idx_creations_prompt_hash')
      .on(t.promptHash)
      .where(sql`${t.promptHash} IS NOT NULL`),
    agentModeIdx: index('idx_creations_agent_mode')
      .on(t.agentMode, t.status)
      .where(sql`${t.agentMode} = true`),
    statusCreatedIdx: index('idx_creations_status_created').on(t.status, t.createdAt),
    statusCheck: check(
      'chk_creations_status',
      sql`${t.status} IN ('pending', 'ready', 'published', 'failed')`,
    ),
  }),
);

// -----------------------------------------------------------------------------
// 4.3 creation_candidates —— 造梗候选（3 候选 + 自评打分）
// -----------------------------------------------------------------------------

export const creationCandidates = pgTable(
  'creation_candidates',
  {
    candidateId: uuid('candidate_id').primaryKey().defaultRandom(),
    creationId: uuid('creation_id')
      .notNull()
      .references(() => creations.creationId, { onDelete: 'cascade' }),
    idx: integer('idx').notNull(),
    content: text('content'),
    imageUrl: varchar('image_url', { length: 512 }),
    selfScore: decimal('self_score', { precision: 4, scale: 2 }),
    selfReason: text('self_reason'),
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.creationId, t.idx] }),
    creationIdx: index('idx_creation_candidates_creation').on(t.creationId),
  }),
);

// -----------------------------------------------------------------------------
// 5. 内容域 / Content Domain
// -----------------------------------------------------------------------------

// 5.1 meme_tags —— 标签字典（规范化标签）
// smallserial（自增 smallint）映射为 serial('tag_id')

export const memeTags = pgTable('meme_tags', {
  tagId: serial('tag_id').primaryKey(),
  name: varchar('name', { length: 32 }).notNull().unique(),
  category: varchar('category', { length: 32 }),
  useCount: integer('use_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5.2 meme_cards —— 梗卡主表

export type MemeCardType = 'text' | 'image' | 'video';
export type GodTrashStatus = 'pending' | 'god' | 'trash';
export type MemeStatus =
  'draft' | 'pending_audit' | 'published' | 'manual_review' | 'rejected' | 'offline';

// tsvector 自定义类型（Drizzle 无原生 tsvector 支持）
const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
});

export const memeCards = pgTable(
  'meme_cards',
  {
    memeId: uuid('meme_id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    creationId: uuid('creation_id').references(() => creations.creationId, {
      onDelete: 'set null',
    }),
    type: varchar('type', { length: 16 }).notNull(),
    coverUrl: varchar('cover_url', { length: 512 }),
    title: text('title').notNull(),
    titleTsv: tsvector('title_tsv'),
    tags: jsonb('tags')
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<string[]>(),
    legionId: uuid('legion_id'),
    scoreAvg: decimal('score_avg', { precision: 3, scale: 2 }).notNull().default('0'),
    scoreCount: integer('score_count').notNull().default(0),
    commentCount: integer('comment_count').notNull().default(0),
    shareCount: integer('share_count').notNull().default(0),
    favoriteCount: integer('favorite_count').notNull().default(0),
    viewCount: integer('view_count').notNull().default(0),
    completionRate: decimal('completion_rate', { precision: 4, scale: 3 }).notNull().default('0'),
    hotScore: decimal('hot_score', { precision: 10, scale: 4 }).notNull().default('0'),
    godTrashStatus: varchar('god_trash_status', { length: 16 }).notNull().default('pending'),
    status: varchar('status', { length: 16 }).notNull().default('draft'),
    isAiGenerated: boolean('is_ai_generated').notNull().default(true),
    watermarked: boolean('watermarked').notNull().default(true),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    authorCreatedIdx: index('idx_meme_cards_author_created').on(t.authorId, t.createdAt),
    legionStatusIdx: index('idx_meme_cards_legion_status')
      .on(t.legionId, t.status)
      .where(sql`${t.legionId} IS NOT NULL`),
    hotScoreIdx: index('idx_meme_cards_hot_score')
      .on(t.hotScore)
      .where(sql`${t.status} = 'published' AND ${t.deletedAt} IS NULL`),
    statusPublishedIdx: index('idx_meme_cards_status_published')
      .on(t.status, t.publishedAt)
      .where(sql`${t.status} = 'published'`),
    godTrashIdx: index('idx_meme_cards_god_trash')
      .on(t.godTrashStatus)
      .where(sql`${t.godTrashStatus} <> 'pending'`),
    tagsGinIdx: index('idx_meme_cards_tags_gin').using('gin', t.tags),
    titleTsvIdx: index('idx_meme_cards_title_tsv').using('gin', t.titleTsv),
    titleTrgmIdx: index('idx_meme_cards_title_trgm').using('gin', sql`${t.title} gin_trgm_ops`),
    typeCheck: check('chk_meme_type', sql`${t.type} IN ('text', 'image', 'video')`),
    gtCheck: check('chk_meme_gt_status', sql`${t.godTrashStatus} IN ('pending', 'god', 'trash')`),
    statusCheck: check(
      'chk_meme_status',
      sql`${t.status} IN ('draft', 'pending_audit', 'published', 'manual_review', 'rejected', 'offline')`,
    ),
  }),
);

// 5.3 meme_card_tags —— 梗卡-标签关联（结构化聚合）

export const memeCardTags = pgTable(
  'meme_card_tags',
  {
    memeId: uuid('meme_id')
      .notNull()
      .references(() => memeCards.memeId, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => memeTags.tagId, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.memeId, t.tagId] }),
    tagIdx: index('idx_meme_card_tags_tag').on(t.tagId),
  }),
);

// -----------------------------------------------------------------------------
// 14.1 ai_cost_logs —— AI 调用成本日志（日预算熔断看板数据源）
// -----------------------------------------------------------------------------

/** ai_cost_logs.module 允许值 */
export type AiCostModule = 'creation' | 'image' | 'video' | 'tts' | 'audit' | 'agent' | 'judge';

/** ai_cost_logs.provider 允许值 */
export type AiCostProvider = 'deepseek' | 'glm' | 'siliconflow' | 'volcano' | 'aliyun' | 'mock';

/** ai_cost_logs.status 允许值 */
export type AiCostStatus = 'ok' | 'failed' | 'timeout';

export const aiCostLogs = pgTable(
  'ai_cost_logs',
  {
    logId: uuid('log_id').notNull().defaultRandom(),
    userId: uuid('user_id').references(() => users.userId, { onDelete: 'set null' }),
    module: varchar('module', { length: 32 }).notNull(),
    provider: varchar('provider', { length: 32 }).notNull(),
    model: varchar('model', { length: 64 }).notNull(),
    tokensIn: integer('tokens_in').notNull().default(0),
    tokensOut: integer('tokens_out').notNull().default(0),
    images: integer('images').notNull().default(0),
    videoSecs: decimal('video_secs', { precision: 8, scale: 2 }).notNull().default('0'),
    costCents: integer('cost_cents').notNull(),
    latencyMs: integer('latency_ms').notNull().default(0),
    status: varchar('status', { length: 16 }).notNull().default('ok'),
    requestId: varchar('request_id', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.logId, t.createdAt] }),
    userIdx: index('idx_ai_cost_user').on(t.userId, t.createdAt),
    moduleIdx: index('idx_ai_cost_module').on(t.module, t.createdAt),
    providerIdx: index('idx_ai_cost_provider').on(t.provider, t.createdAt),
    dailyIdx: index('idx_ai_cost_daily').on(t.createdAt, t.module),
  }),
);

// -----------------------------------------------------------------------------
// 7. 互动域 / Interaction Domain
// -----------------------------------------------------------------------------

// 7.1 ratings —— 评分（一人一梗一评，普通表 MVP 不分区）

export type RatingDimensions = { laugh?: number; creative?: number; spread?: number };

export const ratings = pgTable(
  'ratings',
  {
    scoreId: uuid('score_id').notNull().defaultRandom(),
    memeId: uuid('meme_id')
      .notNull()
      .references(() => memeCards.memeId, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    star: smallint('star').notNull(),
    dimensions: jsonb('dimensions')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<RatingDimensions>(),
    isJudge: boolean('is_judge').notNull().default(false),
    weight: decimal('weight', { precision: 4, scale: 2 }).notNull().default('1.00'),
    isGodTrashVote: boolean('is_god_trash_vote').notNull().default(false),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.scoreId] }),
    memeUserUq: uniqueIndex('uq_ratings_meme_user').on(t.memeId, t.userId),
    memeCreatedIdx: index('idx_ratings_meme_created').on(t.memeId, t.createdAt),
    userCreatedIdx: index('idx_ratings_user_created').on(t.userId, t.createdAt),
    dimensionsGinIdx: index('idx_ratings_dimensions_gin').using('gin', t.dimensions),
    starCheck: check('chk_ratings_star', sql`${t.star} BETWEEN 1 AND 5`),
  }),
);

// 7.2 comments —— 评论（楼中楼 + 神评 + 造梗接龙）

export type CommentStatus = 'published' | 'hidden' | 'deleted';

export const comments = pgTable(
  'comments',
  {
    commentId: uuid('comment_id').primaryKey().defaultRandom(),
    memeId: uuid('meme_id')
      .notNull()
      .references(() => memeCards.memeId, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),
    content: text('content').notNull(),
    likeCount: integer('like_count').notNull().default(0),
    isGodComment: boolean('is_god_comment').notNull().default(false),
    isMemeCard: boolean('is_meme_card').notNull().default(false),
    refMemeId: uuid('ref_meme_id').references(() => memeCards.memeId, {
      onDelete: 'set null',
    }),
    status: varchar('status', { length: 16 }).notNull().default('published'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    memeCreatedIdx: index('idx_comments_meme_created')
      .on(t.memeId, t.createdAt)
      .where(sql`${t.deletedAt} IS NULL`),
    parentIdx: index('idx_comments_parent')
      .on(t.parentId)
      .where(sql`${t.parentId} IS NOT NULL`),
    userCreatedIdx: index('idx_comments_user_created').on(t.userId, t.createdAt),
    godCommentIdx: index('idx_comments_god_comment')
      .on(t.memeId)
      .where(sql`${t.isGodComment} = true`),
    selfRef: foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.commentId],
      name: 'fk_comments_parent',
    }).onDelete('cascade'),
    statusCheck: check(
      'chk_comments_status',
      sql`${t.status} IN ('published', 'hidden', 'deleted')`,
    ),
  }),
);

// 7.3 shares —— 转发记录（站内/站外）

export const shares = pgTable(
  'shares',
  {
    shareId: uuid('share_id').primaryKey().defaultRandom(),
    memeId: uuid('meme_id')
      .notNull()
      .references(() => memeCards.memeId, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.userId, { onDelete: 'set null' }),
    channel: varchar('channel', { length: 16 }).notNull(), // in_app/wechat/douyin/qq/link
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    memeCreatedIdx: index('idx_shares_meme_created').on(t.memeId, t.createdAt),
    userCreatedIdx: index('idx_shares_user_created').on(t.userId, t.createdAt),
  }),
);

// 7.4 favorites —— 收藏

export const favorites = pgTable(
  'favorites',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    memeId: uuid('meme_id')
      .notNull()
      .references(() => memeCards.memeId, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.memeId] }),
    userCreatedIdx: index('idx_favorites_user_created').on(t.userId, t.createdAt),
    memeCreatedIdx: index('idx_favorites_meme_created').on(t.memeId, t.createdAt),
  }),
);

// -----------------------------------------------------------------------------
// 8. 军团队 / Legion Domain
// -----------------------------------------------------------------------------

export type JoinMode = 'public' | 'approval';
export type LegionStatus = 'active' | 'frozen' | 'dissolved';
export type LegionRole = 'leader' | 'vice_leader' | 'member';

export const legions = pgTable(
  'legions',
  {
    legionId: uuid('legion_id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 64 }).notNull().unique(), // citext in SQL
    slogan: varchar('slogan', { length: 140 }),
    avatarUrl: varchar('avatar_url', { length: 512 }),
    themeTags: jsonb('theme_tags')
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<string[]>(),
    leaderId: uuid('leader_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'restrict' }),
    level: integer('level').notNull().default(1),
    activityScore: integer('activity_score').notNull().default(0),
    memberCount: integer('member_count').notNull().default(0),
    memberCap: integer('member_cap').notNull().default(500),
    joinMode: varchar('join_mode', { length: 16 }).notNull().default('approval').$type<JoinMode>(),
    badges: jsonb('badges')
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<string[]>(),
    pkWins: integer('pk_wins').notNull().default(0),
    pkLosses: integer('pk_losses').notNull().default(0),
    status: varchar('status', { length: 16 }).notNull().default('active').$type<LegionStatus>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    levelActivityIdx: index('idx_legions_level_activity')
      .on(t.level, t.activityScore)
      .where(sql`${t.deletedAt} IS NULL`),
    statusIdx: index('idx_legions_status')
      .on(t.status)
      .where(sql`${t.deletedAt} IS NULL`),
    themeTagsGinIdx: index('idx_legions_theme_tags').using('gin', t.themeTags),
  }),
);

export const legionMembers = pgTable(
  'legion_members',
  {
    membershipId: uuid('membership_id').primaryKey().defaultRandom(),
    legionId: uuid('legion_id')
      .notNull()
      .references(() => legions.legionId, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    role: varchar('role', { length: 16 }).notNull().default('member').$type<LegionRole>(),
    contribution: integer('contribution').notNull().default(0),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    leftAt: timestamp('left_at', { withTimezone: true }),
  },
  (t) => ({
    legionUserUq: uniqueIndex('uq_legion_members').on(t.legionId, t.userId),
    userIdx: index('idx_legion_members_user')
      .on(t.userId)
      .where(sql`${t.leftAt} IS NULL`),
    legionContributionIdx: index('idx_legion_members_legion')
      .on(t.legionId, t.contribution)
      .where(sql`${t.leftAt} IS NULL`),
    roleIdx: index('idx_legion_members_role')
      .on(t.role)
      .where(sql`${t.role} IN ('leader','vice_leader')`),
  }),
);

// -----------------------------------------------------------------------------
// 9. PK 域 / PK Domain
// -----------------------------------------------------------------------------

export type PKType = 'creation' | 'vote' | 'hotness';
export type PKStatus =
  | 'idle'
  | 'challenged'
  | 'accepted'
  | 'preparing'
  | 'battling'
  | 'judging'
  | 'settled'
  | 'declined'
  | 'archived';

export const pkMatches = pgTable(
  'pk_matches',
  {
    pkId: uuid('pk_id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 16 }).notNull().$type<PKType>(),
    legionA: uuid('legion_a')
      .notNull()
      .references(() => legions.legionId, { onDelete: 'restrict' }),
    legionB: uuid('legion_b')
      .notNull()
      .references(() => legions.legionId, { onDelete: 'restrict' }),
    theme: varchar('theme', { length: 140 }).notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 16 }).notNull().default('idle').$type<PKStatus>(),
    scoreA: decimal('score_a', { precision: 10, scale: 4 }).notNull().default('0'),
    scoreB: decimal('score_b', { precision: 10, scale: 4 }).notNull().default('0'),
    winnerId: uuid('winner_id').references(() => legions.legionId, { onDelete: 'set null' }),
    mvpUserId: uuid('mvp_user_id').references(() => users.userId, { onDelete: 'set null' }),
    rewardState: jsonb('reward_state')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Record<string, unknown>>(),
    isOfficial: boolean('is_official').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusEndIdx: index('idx_pk_status_end').on(t.status, t.endAt),
    legionAIdx: index('idx_pk_legion_a').on(t.legionA, t.status),
    legionBIdx: index('idx_pk_legion_b').on(t.legionB, t.status),
    winnerIdx: index('idx_pk_winner')
      .on(t.winnerId)
      .where(sql`${t.winnerId} IS NOT NULL`),
    officialIdx: index('idx_pk_official')
      .on(t.isOfficial, t.startAt)
      .where(sql`${t.isOfficial} = true`),
  }),
);

export const pkVotes = pgTable(
  'pk_votes',
  {
    voteId: uuid('vote_id').primaryKey().defaultRandom(),
    pkId: uuid('pk_id')
      .notNull()
      .references(() => pkMatches.pkId, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    legionId: uuid('legion_id')
      .notNull()
      .references(() => legions.legionId, { onDelete: 'cascade' }),
    votedAt: timestamp('voted_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pkLegionIdx: index('idx_pk_votes_pk_legion').on(t.pkId, t.legionId),
    userDateIdx: index('idx_pk_votes_user_date').on(t.userId, t.votedAt),
  }),
);

// -----------------------------------------------------------------------------
// 10. 聊天域 / Chat Domain
// -----------------------------------------------------------------------------

export type RoomType = 'private' | 'legion' | 'system';
export type MsgType = 'text' | 'image' | 'meme' | 'voice' | 'system';

export const chatRooms = pgTable(
  'chat_rooms',
  {
    roomId: uuid('room_id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 16 }).notNull().$type<RoomType>(),
    legionId: uuid('legion_id').references(() => legions.legionId, { onDelete: 'cascade' }),
    userA: uuid('user_a').references(() => users.userId, { onDelete: 'cascade' }),
    userB: uuid('user_b').references(() => users.userId, { onDelete: 'cascade' }),
    lastMsgAt: timestamp('last_msg_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    legionIdx: index('idx_chat_rooms_legion')
      .on(t.legionId)
      .where(sql`${t.legionId} IS NOT NULL`),
    privateIdx: index('idx_chat_rooms_private')
      .on(t.userA, t.userB)
      .where(sql`${t.type} = 'private'`),
    lastMsgIdx: index('idx_chat_rooms_last_msg').on(t.lastMsgAt),
  }),
);

// messages 是分区表，Drizzle 支持有限，只做类型定义不做迁移
// 查询走 raw SQL 见 chat.service.ts
export const messages = pgTable(
  'messages',
  {
    messageId: uuid('message_id').notNull().defaultRandom(),
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.roomId, { onDelete: 'cascade' }),
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    msgType: varchar('msg_type', { length: 16 }).notNull().$type<MsgType>(),
    content: text('content'),
    extra: jsonb('extra')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.messageId, t.createdAt] }),
    roomCreatedIdx: index('idx_messages_room_created').on(t.roomId, t.createdAt),
    senderIdx: index('idx_messages_sender').on(t.senderId, t.createdAt),
    extraGinIdx: index('idx_messages_extra_gin').using('gin', t.extra),
  }),
);

export const messageReads = pgTable(
  'message_reads',
  {
    roomId: uuid('room_id')
      .notNull()
      .references(() => chatRooms.roomId, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    lastReadAt: timestamp('last_read_at', { withTimezone: true }).notNull().defaultNow(),
    lastReadMsgId: uuid('last_read_msg_id'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roomId, t.userId] }),
  }),
);

export const notifications = pgTable(
  'notifications',
  {
    notifId: uuid('notif_id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    type: varchar('type', { length: 32 }).notNull(),
    title: varchar('title', { length: 140 }),
    body: text('body'),
    payload: jsonb('payload')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Record<string, unknown>>(),
    isRead: boolean('is_read').notNull().default(false),
    pushStatus: varchar('push_status', { length: 16 }).notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('idx_notifications_user_created').on(t.userId, t.createdAt),
    unreadIdx: index('idx_notifications_unread')
      .on(t.userId)
      .where(sql`${t.isRead} = false`),
    typeIdx: index('idx_notifications_type').on(t.type, t.createdAt),
  }),
);

// -----------------------------------------------------------------------------
// 13. 安全域 / Safety Domain
// -----------------------------------------------------------------------------

export const sensitiveWords = pgTable(
  'sensitive_words',
  {
    wordId: bigserial('word_id', { mode: 'number' }).primaryKey(),
    word: varchar('word', { length: 64 }).notNull(),
    category: varchar('category', { length: 32 }).notNull(),
    level: smallint('level').notNull().default(1),
    variants: jsonb('variants')
      .notNull()
      .default(sql`'[]'::jsonb`)
      .$type<string[]>(),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    wordCategoryUq: uniqueIndex('uq_sensitive_words').on(t.word, t.category),
    wordTrgmIdx: index('idx_sensitive_words_word_trgm').using('gin', sql`${t.word} gin_trgm_ops`),
    levelIdx: index('idx_sensitive_words_level')
      .on(t.level)
      .where(sql`${t.enabled} = true`),
  }),
);

export const reports = pgTable(
  'reports',
  {
    reportId: uuid('report_id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    targetType: varchar('target_type', { length: 16 }).notNull(),
    targetId: uuid('target_id').notNull(),
    reason: varchar('reason', { length: 64 }).notNull(),
    detail: text('detail'),
    status: varchar('status', { length: 16 }).notNull().default('pending'),
    handlerId: uuid('handler_id').references(() => users.userId, { onDelete: 'set null' }),
    handledAt: timestamp('handled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusCreatedIdx: index('idx_reports_status').on(t.status, t.createdAt),
    targetIdx: index('idx_reports_target').on(t.targetType, t.targetId),
  }),
);

export const bannedUsers = pgTable(
  'banned_users',
  {
    banId: uuid('ban_id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    reason: varchar('reason', { length: 64 }).notNull(),
    banUntil: timestamp('ban_until', { withTimezone: true }),
    bannedBy: uuid('banned_by').references(() => users.userId, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('idx_banned_users_user').on(t.userId, t.banUntil),
  }),
);

// audit_logs 是分区表，查询走 raw SQL（见 admin.service.ts）
export const auditLogs = pgTable(
  'audit_logs',
  {
    auditId: uuid('audit_id').notNull().defaultRandom(),
    targetId: uuid('target_id').notNull(),
    targetType: varchar('target_type', { length: 32 }).notNull(),
    action: varchar('action', { length: 32 }).notNull(),
    reason: varchar('reason', { length: 128 }),
    result: varchar('result', { length: 16 }).notNull(),
    operatorId: uuid('operator_id').references(() => users.userId, { onDelete: 'set null' }),
    metadata: jsonb('metadata')
      .notNull()
      .default(sql`'{}'::jsonb`)
      .$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.auditId, t.createdAt] }),
    targetIdx: index('idx_audit_logs_target').on(t.targetType, t.targetId, t.createdAt),
    operatorIdx: index('idx_audit_logs_operator').on(t.operatorId, t.createdAt),
    actionIdx: index('idx_audit_logs_action').on(t.action, t.createdAt),
  }),
);

// 分区表默认分区（Drizzle 不直接支持 PARTITION，标记为 raw SQL 迁移）
// 对应的 SQL: CREATE TABLE IF NOT EXISTS messages_default PARTITION OF messages DEFAULT;
//            CREATE TABLE IF NOT EXISTS audit_logs_default PARTITION OF audit_logs DEFAULT;

// -----------------------------------------------------------------------------
// Schema bundle —— 传给 drizzle(pool, { schema }) 做类型化查询
// -----------------------------------------------------------------------------

export const schema = {
  users,
  userProfiles,
  userInterestTags,
  userBadges,
  userFollows,
  promptTemplates,
  analyticsEvents,
  creations,
  creationCandidates,
  memeTags,
  memeCards,
  memeCardTags,
  aiCostLogs,
  ratings,
  comments,
  shares,
  favorites,
  legions,
  legionMembers,
  pkMatches,
  pkVotes,
  chatRooms,
  messages,
  messageReads,
  notifications,
  sensitiveWords,
  reports,
  bannedUsers,
  auditLogs,
};

export type Schema = typeof schema;
