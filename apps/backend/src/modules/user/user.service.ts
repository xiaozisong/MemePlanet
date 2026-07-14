import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, inArray, sql, lte } from 'drizzle-orm';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { REDIS } from '../../database/redis.module.js';
import type Redis from 'ioredis';
import {
  users,
  userProfiles,
  userInterestTags,
  userBadges,
  userFollows,
} from '../../database/schema.js';
import {
  VALID_TAG_NAMES,
  INTEREST_TAGS,
  COLD_START_FEED_CONFIG,
} from './interest-tags.constants.js';
import { MAX_ENERGY, computeLevelProgress } from './power.const.js';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /**
   * 获取用户基础资料（users + user_profiles 兴趣标签快照）
   * T1.5 会扩展为完整主页只读接口，此处先返回基础字段。
   */
  async findById(userId: string) {
    const userRow = await this.db
      .select({
        userId: users.userId,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        bio: users.bio,
        level: users.level,
        memePower: users.memePower,
        defenseValue: users.defenseValue,
        energyBalance: users.energyBalance,
        isPro: users.isPro,
        status: users.status,
      })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);

    const u = userRow[0];
    if (!u) throw new NotFoundException('用户不存在');

    return u;
  }

  /**
   * 个人主页只读接口（T1.5）
   *
   * 返回完整 UserHome 视图：基础资料 + is_pro + is_following + legion_ids
   * + stats{meme_count, god_meme_count, avg_score, pk_wins} + badges。
   *
   * 实现策略：
   * - users / user_badges / user_follows：Drizzle ORM 查询（schema 已就位）
   * - meme_cards / legion_members / pk_rewards：raw SQL via db.execute
   *   （这些表的 Drizzle schema 尚未编写，留待 S2/S3 内容/军团/PK Sprint）
   * - raw SQL 用 try/catch 包裹，表不存在或列缺失时安全降级为 0/[]，避免阻塞主页接口
   */
  async findHomeById(viewerId: string, userId: string): Promise<UserHomeResponse> {
    const u = await this.findById(userId);

    // is_following：循观看者 → 该用户是否已关注
    const isFollowing = viewerId === userId ? false : await this.checkFollowing(viewerId, userId);

    // badges：从结构化表取（user_badges 已在 Drizzle schema 中）
    const badgeRows = await this.db
      .select({ badgeCode: userBadges.badgeCode })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
    const badges = badgeRows.map((r) => r.badgeCode);

    // 兴趣标签快照（个人主页可选展示）
    const profileRow = await this.db
      .select({ interestTags: userProfiles.interestTags })
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);
    const interestTags = profileRow[0]?.interestTags ?? [];

    // 统计数据（raw SQL stub，表缺失时降级）
    const { memeCount, godMemeCount, avgScore } = await this.safeMemeStats(userId);
    const legionIds = await this.safeLegionIds(userId);
    const pkWins = await this.safePkWins(userId);

    return {
      userId: u.userId,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl ?? null,
      bio: u.bio ?? null,
      level: u.level,
      memePower: u.memePower,
      defenseValue: u.defenseValue,
      isPro: u.isPro ?? false,
      isFollowing,
      legionIds,
      stats: {
        memeCount,
        godMemeCount,
        avgScore,
        pkWins,
      },
      badges,
      interestTags,
    };
  }

  /** 当前观看者是否关注了目标用户 */
  private async checkFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const rows = await this.db
      .select({ followerId: userFollows.followerId })
      .from(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followeeId, followeeId)))
      .limit(1);
    return rows.length > 0;
  }

  /**
   * 用户的梗卡统计：published 数 / 神梗数 / 平均评分
   * raw SQL stub：meme_cards 表 Drizzle schema 未编写，直接走 SQL。
   * 失败（如 schema 缺列）时安全降级为 0。
   */
  private async safeMemeStats(userId: string): Promise<{
    memeCount: number;
    godMemeCount: number;
    avgScore: number;
  }> {
    try {
      const result = await this.db.execute<{
        meme_count: number;
        god_meme_count: number;
        avg_score: string | number | null;
      }>(sql`
        SELECT
          COUNT(*) FILTER (
            WHERE status = 'published' AND deleted_at IS NULL
          )::int AS meme_count,
          COUNT(*) FILTER (
            WHERE status = 'published' AND deleted_at IS NULL
              AND god_trash_status = 'god'
          )::int AS god_meme_count,
          COALESCE(
            AVG(score_avg) FILTER (
              WHERE status = 'published' AND deleted_at IS NULL
            ),
            0
          )::numeric(4,2) AS avg_score
        FROM meme_cards
        WHERE author_id = ${userId}
      `);
      const row = result.rows[0] ?? {
        meme_count: 0,
        god_meme_count: 0,
        avg_score: 0,
      };
      const avgScore = row.avg_score === null ? 0 : Number(row.avg_score) || 0;
      return {
        memeCount: Number(row.meme_count) || 0,
        godMemeCount: Number(row.god_meme_count) || 0,
        avgScore: Math.round(avgScore * 100) / 100,
      };
    } catch (err) {
      this.logger.warn(`safeMemeStats fallback for user ${userId}: ${(err as Error).message}`);
      return { memeCount: 0, godMemeCount: 0, avgScore: 0 };
    }
  }

  /**
   * 用户当前所属军团 ID 列表（≤3）
   * raw SQL stub：legion_members 表 Drizzle schema 未编写，直接走 SQL。
   * 失败时降级为空数组。
   */
  private async safeLegionIds(userId: string): Promise<string[]> {
    try {
      const result = await this.db.execute<{ legion_id: string }>(sql`
        SELECT legion_id
        FROM legion_members
        WHERE user_id = ${userId}
          AND left_at IS NULL
        ORDER BY joined_at ASC
      `);
      return result.rows.map((r) => r.legion_id);
    } catch (err) {
      this.logger.warn(`safeLegionIds fallback for user ${userId}: ${(err as Error).message}`);
      return [];
    }
  }

  /**
   * 用户作为参赛者赢下的 PK 场次数（统计 pk_rewards 中作为获胜方 reward）
   * raw SQL stub：pk_rewards 表 Drizzle schema 未编写，直接走 SQL。
   * 失败时降级为 0。
   */
  private async safePkWins(userId: string): Promise<number> {
    try {
      const result = await this.db.execute<{ cnt: number }>(sql`
        SELECT COUNT(*)::int AS cnt
        FROM pk_rewards
        WHERE user_id = ${userId}
          AND reward_type IN ('win_member', 'mvp')
      `);
      return Number(result.rows[0]?.cnt) || 0;
    } catch (err) {
      this.logger.warn(`safePkWins fallback for user ${userId}: ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * 更新个人资料（昵称/头像/签名/性别/生日）
   * TODO T1.5+.2: 昵称敏感词校验 + 30 天改一次限制
   */
  async updateProfile(userId: string, dto: Record<string, unknown>) {
    this.logger.log(`updateProfile ${userId}: ${JSON.stringify(dto)}`);
    const allowed: Record<string, unknown> = {};
    for (const k of ['nickname', 'avatarUrl', 'bio', 'gender', 'birthday'] as const) {
      if (dto[k] !== undefined) allowed[k] = dto[k];
    }

    await this.db
      .update(users)
      .set({ ...allowed, updatedAt: new Date() })
      .where(eq(users.userId, userId));

    return this.findById(userId);
  }

  /**
   * 获取当前用户的兴趣标签列表（结构化表 + jsonb 快照双查，以结构化表为准）
   */
  async getInterestTags(userId: string): Promise<{ tags: string[]; coldStart: ColdStartConfig }> {
    const rows = await this.db
      .select({ tag: userInterestTags.tag, weight: userInterestTags.weight })
      .from(userInterestTags)
      .where(eq(userInterestTags.userId, userId));

    const tags = rows.map((r) => r.tag);
    return {
      tags,
      coldStart: {
        interestRatio: COLD_START_FEED_CONFIG.interestRatio,
        newRatio: COLD_START_FEED_CONFIG.newRatio,
        interestTags: tags.slice(0, COLD_START_FEED_CONFIG.maxTags),
      },
    };
  }

  /**
   * 更新用户兴趣标签（结构化表 upsert + jsonb 快照同步）。
   * 校验：3~10 个、必须命中字典、不重复。
   */
  async updateInterestTags(
    userId: string,
    tags: string[],
  ): Promise<{ userId: string; interestTags: string[] }> {
    // 校验用户存在
    const exists = await this.db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    if (!exists[0]) throw new NotFoundException('用户不存在');

    // 校验标签字典
    const invalid = tags.filter((t) => !VALID_TAG_NAMES.has(t));
    if (invalid.length > 0) {
      throw new BadRequestException(`不支持的兴趣标签：${invalid.join(', ')}`);
    }

    // 校验唯一
    const uniqueTags = Array.from(new Set(tags));
    if (uniqueTags.length < 3 || uniqueTags.length > 10) {
      throw new BadRequestException('兴趣标签必须 3~10 个');
    }

    // 1) 删除旧的结构化标签
    await this.db.delete(userInterestTags).where(eq(userInterestTags.userId, userId));

    // 2) 插入新标签（默认 weight=1.00）
    await this.db.insert(userInterestTags).values(
      uniqueTags.map((tag) => ({
        userId,
        tag,
        weight: '1.00',
      })),
    );

    // 3) 同步 jsonb 快照到 user_profiles
    await this.db
      .insert(userProfiles)
      .values({
        userId,
        interestTags: uniqueTags,
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { interestTags: uniqueTags, updatedAt: new Date() },
      });

    this.logger.log(`updateInterestTags ${userId}: ${uniqueTags.join(',')}`);
    return { userId, interestTags: uniqueTags };
  }

  /**
   * 获取兴趣标签字典（前端冷启动选择页用）
   */
  getInterestTagDict() {
    return INTEREST_TAGS;
  }

  /**
   * 冷启动 feed 比例配置
   */
  getColdStartConfig() {
    return COLD_START_FEED_CONFIG;
  }

  async getMemePower(userId: string) {
    const u = await this.findById(userId);
    const levelProgress = computeLevelProgress(u.memePower);
    return {
      userId,
      memePower: u.memePower,
      level: u.level,
      defenseValue: u.defenseValue,
      energyBalance: u.energyBalance,
      maxEnergy: MAX_ENERGY,
      levelProgress,
    };
  }

  /**
   * 等级详情（GET /users/me/level）
   * 含梗力值、等级、进度、能量余额与上限。
   */
  async getLevelDetail(userId: string) {
    const u = await this.findById(userId);
    const levelProgress = computeLevelProgress(u.memePower);
    return {
      userId,
      memePower: u.memePower,
      level: u.level,
      defenseValue: u.defenseValue,
      energyBalance: u.energyBalance,
      maxEnergy: MAX_ENERGY,
      isPro: u.isPro ?? false,
      levelProgress,
    };
  }

  /**
   * 乐观锁扣减能量（T1.6）
   *
   * UPDATE users SET energy_balance = energy_balance - cost
   * WHERE user_id = ? AND energy_balance >= cost
   *
   * @returns true 扣减成功 / false 能量不足
   */
  async deductEnergy(userId: string, cost: number): Promise<boolean> {
    if (cost <= 0) return true;

    const result = await this.db.execute<{ ok: boolean }>(sql`
      UPDATE users
      SET energy_balance = energy_balance - ${cost},
          updated_at = now()
      WHERE user_id = ${userId}
        AND energy_balance >= ${cost}
      RETURNING true AS ok
    `);
    return result.rows[0]?.ok ?? false;
  }

  /**
   * 每日北京时间 06:00 能量恢复 cron（T1.6）
   *
   * 将所有非 deleted 用户的 energy_balance 重置为 MAX_ENERGY（100）。
   * 使用 Redis 60s 分布式锁防重复执行（多个 worker 实例）。
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async dailyEnergyRestore(): Promise<void> {
    const lockKey = 'cron:daily-energy-restore';
    const acquired = await this.redis.set(lockKey, '1', 'PX', 60000, 'NX');
    if (!acquired) {
      this.logger.log('dailyEnergyRestore skipped — lock held by another instance');
      return;
    }

    try {
      await this.db
        .update(users)
        .set({ energyBalance: MAX_ENERGY, updatedAt: new Date() })
        .where(and(lte(users.energyBalance, MAX_ENERGY - 1), sql`${users.deletedAt} IS NULL`));

      this.logger.log(`dailyEnergyRestore done — reset energy_balance to ${MAX_ENERGY}`);
    } catch (err) {
      this.logger.error(`dailyEnergyRestore failed: ${(err as Error).message}`);
    } finally {
      await this.redis.del(lockKey);
    }
  }
}

export interface ColdStartConfig {
  interestRatio: number;
  newRatio: number;
  interestTags: string[];
}

/**
 * GET /users/:id 个人主页只读响应
 * 对齐 docs/openapi.yaml UserHome schema + docs/API-Spec.md §4.7
 */
export interface UserHomeResponse {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  memePower: number;
  defenseValue: number;
  isPro: boolean;
  isFollowing: boolean;
  legionIds: string[];
  stats: {
    memeCount: number;
    godMemeCount: number;
    avgScore: number;
    pkWins: number;
  };
  badges: string[];
  /** 兴趣标签快照（M1 范围内可选展示，对齐 user_profiles.interest_tags） */
  interestTags: string[];
}

export { and, inArray, userProfiles, userInterestTags };
