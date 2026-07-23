import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { ratings, memeCards } from '../../database/schema.js';
import { AuditService } from '../audit/audit.service.js';
import { SensitiveWordService } from '../audit/sensitive-word.service.js';
import type { CreateRatingDto, CreateCommentDto } from './dto.js';
import type { RatingDimensions } from '../../database/schema.js';

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    private readonly audit: AuditService,
    private readonly sensitive: SensitiveWordService,
  ) {}

  /**
   * 评分（T3.5）
   *
   * 流程：
   * 1. 校验梗卡存在且已发布
   * 2. 加权计算（MVP: 评审官 1.5x / 普通 1.0x）
   * 3. INSERT（唯一约束 meme_id + user_id，ON CONFLICT 覆盖）
   * 4. 同步重算评分统计
   */
  async rate(userId: string, dto: CreateRatingDto) {
    const meme = await this.db
      .select({ memeId: memeCards.memeId, authorId: memeCards.authorId })
      .from(memeCards)
      .where(eq(memeCards.memeId, dto.memeId))
      .limit(1);

    if (!meme[0]) {
      throw new NotFoundException('梗卡不存在');
    }
    if (meme[0].authorId === userId) {
      throw new BadRequestException('不能给自己的梗卡评分');
    }

    const isJudge = false; // MVP: 手动标记，后续扩展
    const weight = isJudge ? '1.50' : '1.00';

    const result = await this.db
      .insert(ratings)
      .values({
        memeId: dto.memeId,
        userId,
        star: dto.star,
        dimensions: (dto.dimensions ?? {}) as RatingDimensions,
        isJudge,
        weight,
        isGodTrashVote: dto.isGodTrashVote ?? false,
        comment: dto.comment ?? null,
      })
      .onConflictDoUpdate({
        target: [ratings.memeId, ratings.userId],
        set: {
          star: dto.star,
          dimensions: (dto.dimensions ?? {}) as RatingDimensions,
          isGodTrashVote: dto.isGodTrashVote ?? false,
          comment: dto.comment ?? null,
          weight,
        },
      })
      .returning({ scoreId: ratings.scoreId });

    this.logger.log(`rated user=${userId} meme=${dto.memeId} star=${dto.star} weight=${weight}`);

    await this.recomputeMemeScore(dto.memeId);

    return { scoreId: result[0]?.scoreId, star: dto.star, weight, memeId: dto.memeId };
  }

  /**
   * 重新计算梗卡评分统计（加权平均 + 各维度均值 + 神/烂梗判定）
   */
  private async recomputeMemeScore(memeId: string) {
    const stats = await this.db
      .select({
        totalRatings: sql<number>`count(*)::int`,
        avgStar: sql<string>`coalesce(avg(${ratings.star}), 0)`,
        avgWeightedStar: sql<string>`coalesce(sum(${ratings.star}::numeric * ${ratings.weight}::numeric) / nullif(sum(${ratings.weight}::numeric), 0), 0)`,
        avgLaugh: sql<string>`coalesce(avg((${ratings.dimensions} ->> 'laugh')::int), 0)`,
        avgCreative: sql<string>`coalesce(avg((${ratings.dimensions} ->> 'creative')::int), 0)`,
        avgSpread: sql<string>`coalesce(avg((${ratings.dimensions} ->> 'spread')::int), 0)`,
        oneStarCount: sql<number>`sum(case when ${ratings.star} = 1 then 1 else 0 end)::int`,
      })
      .from(ratings)
      .where(eq(ratings.memeId, memeId));

    const s = stats[0]!;
    const oneStarPercent = s.totalRatings > 0 ? (s.oneStarCount / s.totalRatings) * 100 : 0;

    await this.db
      .update(memeCards)
      .set({ updatedAt: new Date() })
      .where(eq(memeCards.memeId, memeId));

    this.logger.log(
      `recomputed meme=${memeId}: ratings=${s.totalRatings} avg=${Number(s.avgStar).toFixed(2)} weighted=${Number(s.avgWeightedStar).toFixed(2)}`,
    );

    if (s.totalRatings >= 200) {
      let newStatus: 'god' | 'trash' | null = null;
      if (Number(s.avgWeightedStar) >= 4.2 && oneStarPercent < 15) {
        newStatus = 'god';
        this.logger.log(`God meme: ${memeId}`);
      }
      if (Number(s.avgWeightedStar) <= 2.5 && oneStarPercent > 50) {
        newStatus = 'trash';
        this.logger.log(`Trash meme: ${memeId}`);
      }

      // 实际更新 meme_cards 表的 god_trash_status
      if (newStatus) {
        await this.db
          .update(memeCards)
          .set({ godTrashStatus: newStatus, updatedAt: sql`now()` })
          .where(eq(memeCards.memeId, memeId));
      }
    }

    return {
      totalRatings: s.totalRatings,
      avgStar: Number(s.avgStar),
      avgWeightedStar: Number(s.avgWeightedStar),
      avgLaugh: Number(s.avgLaugh),
      avgCreative: Number(s.avgCreative),
      avgSpread: Number(s.avgSpread),
      oneStarPercent,
    };
  }

  /**
   * 获取梗卡评分统计（T3.5）
   */
  async getMemeScore(memeId: string) {
    return this.recomputeMemeScore(memeId);
  }

  /**
   * 获取用户对梗卡的评分回显
   */
  async getUserRating(userId: string, memeId: string) {
    const rows = await this.db
      .select()
      .from(ratings)
      .where(and(eq(ratings.memeId, memeId), eq(ratings.userId, userId)))
      .limit(1);

    return rows[0] ?? null;
  }

  // ── 评论相关（T3.6）──

  /**
   * 评论列表（按热度倒序，分页）
   */
  async listComments(memeId: string, page: number, pageSize: number = 20) {
    // MVP: 评论功能走 ratings 表的 comment 字段，完整楼中楼待迁移 comments 表
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        scoreId: ratings.scoreId,
        userId: ratings.userId,
        star: ratings.star,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
      })
      .from(ratings)
      .where(
        and(
          eq(ratings.memeId, memeId),
          sql`${ratings.comment} IS NOT NULL`,
          sql`${ratings.comment} != ''`,
        ),
      )
      .orderBy(sql`${ratings.star} DESC, ${ratings.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    const totalRows = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(ratings)
      .where(
        and(
          eq(ratings.memeId, memeId),
          sql`${ratings.comment} IS NOT NULL`,
          sql`${ratings.comment} != ''`,
        ),
      );

    const total = totalRows[0]?.total ?? 0;

    const hasMore = offset + pageSize < total;

    return { memeId, items, page, pageSize, total, hasMore };
  }

  /**
   * 创建评分评论（T3.6 + 敏感词过滤）
   *
   * 流程：
   * 1. DFA 敏感词检测
   * 2. INSERT 到 ratings.comment（关联评分）
   */
  async createComment(userId: string, dto: CreateCommentDto) {
    // 1. 敏感词过滤
    if (this.sensitive.hasSensitive(dto.content)) {
      this.logger.warn(`comment blocked by DFA user=${userId} memes=${dto.memeId}`);
      throw new BadRequestException('评论包含敏感词，请修改后重试');
    }

    // 2. 校验梗卡存在
    const meme = await this.db
      .select({ memeId: memeCards.memeId })
      .from(memeCards)
      .where(eq(memeCards.memeId, dto.memeId))
      .limit(1);

    if (!meme[0]) {
      throw new NotFoundException('梗卡不存在');
    }

    // 3. 插入评分记录（含评论）
    const result = await this.db
      .insert(ratings)
      .values({
        memeId: dto.memeId,
        userId,
        star: 5, // 默认满分（仅评论时）
        dimensions: {},
        isJudge: false,
        weight: '1.00',
        comment: dto.content,
      })
      .onConflictDoUpdate({
        target: [ratings.memeId, ratings.userId],
        set: { comment: dto.content },
      })
      .returning({ scoreId: ratings.scoreId });

    this.logger.log(`comment created user=${userId} meme=${dto.memeId}`);

    return { commentId: result[0]?.scoreId, memeId: dto.memeId };
  }

  /**
   * 神梗/烂梗判定审查（T3.5）
   *
   * 条件：评分人数 ≥ 10 自动判定
   * - 神梗：加权均分 ≥ 4.2 且 1 星 < 15%
   * - 烂梗：加权均分 ≤ 2.5 且 1 星 > 50%
   */
  async judgeGodTrash(memeId: string) {
    const stats = await this.recomputeMemeScore(memeId);

    if (stats.totalRatings < 10) {
      return { memeId, result: 'pending', reason: '评分人数不足 10', stats };
    }

    if (stats.avgWeightedStar >= 4.2 && stats.oneStarPercent < 15) {
      return { memeId, result: 'god', reason: '神梗', stats };
    }

    if (stats.avgWeightedStar <= 2.5 && stats.oneStarPercent > 50) {
      return { memeId, result: 'trash', reason: '烂梗', stats };
    }

    return { memeId, result: 'normal', reason: '普通梗', stats };
  }
}
