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
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
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
// Schema bundle —— 传给 drizzle(pool, { schema }) 做类型化查询
// -----------------------------------------------------------------------------

export const schema = {
  users,
  userProfiles,
  userInterestTags,
  userBadges,
  userFollows,
};

export type Schema = typeof schema;
