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
  index,
  inet,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
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
};

export type Schema = typeof schema;
