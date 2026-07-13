import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { users, userProfiles, userInterestTags } from '../../database/schema.js';
import {
  VALID_TAG_NAMES,
  INTEREST_TAGS,
  COLD_START_FEED_CONFIG,
} from './interest-tags.constants.js';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DbType) {}

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
    // TODO T1.6: level = f(meme_power)
    const u = await this.findById(userId);
    return {
      userId,
      memePower: u.memePower,
      level: u.level,
      defenseValue: u.defenseValue,
      energyBalance: u.energyBalance,
    };
  }

  async deductEnergy(userId: string, cost: number): Promise<boolean> {
    // 乐观锁：UPDATE users SET energy_balance = energy_balance - cost
    //         WHERE user_id = ? AND energy_balance >= cost
    // TODO T1.6
    void userId;
    void cost;
    throw new NotFoundException('deductEnergy 未实现');
  }
}

export interface ColdStartConfig {
  interestRatio: number;
  newRatio: number;
  interestTags: string[];
}

export { and, inArray, userProfiles, userInterestTags };
