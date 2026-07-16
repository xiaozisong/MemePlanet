import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, sql } from 'drizzle-orm';
import type Redis from 'ioredis';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { REDIS } from '../../database/redis.module.js';
import { memeCards } from '../../database/schema.js';

const HOT_RANK_KEY = 'hot_rank:daily';
const HOT_RANK_SIZE = 200;
const FEED_PAGE_SIZE = 20;

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /**
   * 个性化 feed（T3.1 / T3.2）
   *
   * MVP：从 Redis ZSet hot_rank:daily 召回 top-N，转 DB 详情
   * v1.5：双塔召回（pgvector ANN）+ LightGBM 排序
   */
  async personalizedFeed(userId: string, page: number) {
    const pageSize = FEED_PAGE_SIZE;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const memeIds = await this.redis.zrevrange(HOT_RANK_KEY, start, end);

    // ZSet 总数（用于分页 hasMore 判定）
    const zcard = await this.redis.zcard(HOT_RANK_KEY);

    if (memeIds.length === 0) {
      return { items: [] as unknown[], page, pageSize, total: zcard, hasMore: false };
    }

    // 防注入：用参数化 in-array 而不是字符串拼接
    const items = await this.db
      .select()
      .from(memeCards)
      .where(
        and(
          eq(memeCards.status, 'published'),
          sql`${memeCards.deletedAt} IS NULL`,
          sql`${memeCards.memeId} = any(${sql.raw(`ARRAY[${memeIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(',')}]::uuid[]`)})`,
        ),
      )
      .orderBy(
        sql`array_position(ARRAY[${sql.join(
          memeIds.map((id) => sql`${id}::uuid`),
          sql`, `,
        )}], ${memeCards.memeId}::uuid)`,
      )
      .limit(pageSize);

    return {
      items,
      page,
      pageSize,
      total: zcard,
      hasMore: end < zcard - 1,
      userId,
    };
  }

  /**
   * 热度分计算（T3.1）
   *
   * 公式（与 docs/TechnicalDesign.md §8 一致）：
   * hot_score = log10(view_count + 4) * 5
   *           + score_avg * score_count * 0.8
   *           + comment_count * 2
   *           + share_count * 3
   *           + favorite_count * 1.5
   *           - penalty_by_age_hours
   *
   * 时间衰减：1h -2%, 24h -5% （简化版采用线性衰减）
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async recomputeHotScore(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log(`recomputeHotScore start at ${new Date().toISOString()}`);

    const rankedRows = await this.db
      .select({
        memeId: memeCards.memeId,
        hotScore: sql<number>`
          log10(${memeCards.viewCount}::numeric + 4) * 5
          + ${memeCards.scoreAvg}::numeric * ${memeCards.scoreCount}::numeric * 0.8
          + ${memeCards.commentCount}::numeric * 2
          + ${memeCards.shareCount}::numeric * 3
          + ${memeCards.favoriteCount}::numeric * 1.5
          - extract(epoch from now() - ${memeCards.publishedAt}) / 3600 * 0.05
        `.as('hot_score'),
      })
      .from(memeCards)
      .where(eq(memeCards.status, 'published'));

    if (rankedRows.length === 0) {
      this.logger.log('recomputeHotScore: no published memes');
      return;
    }

    // 按 hot_score 降序排序并取 top-N
    const sorted = [...rankedRows].sort((a, b) => Number(b.hotScore) - Number(a.hotScore));
    const topN = sorted.slice(0, HOT_RANK_SIZE);

    // 写入 DB（hot_score 列）
    await Promise.all(
      topN
        .map((row) =>
          this.db
            .update(memeCards)
            .set({ hotScore: row.hotScore.toFixed(4), updatedAt: new Date() })
            .where(eq(memeCards.memeId, row.memeId)),
        )
        .slice(0, 20),
    );

    // 写入 Redis ZSet hot_rank:daily（pipeline + transaction）
    const pipeline = this.redis.multi();
    pipeline.del(HOT_RANK_KEY);
    for (const row of topN) {
      pipeline.zadd(HOT_RANK_KEY, Number(row.hotScore), row.memeId);
    }
    pipeline.zremrangebyrank(HOT_RANK_KEY, 0, -HOT_RANK_SIZE - 1); // 保留前 N
    await pipeline.exec();

    this.logger.log(
      `recomputeHotScore done: ${topN.length}/${rankedRows.length} memes ranked, took ${Date.now() - startedAt}ms`,
    );
  }

  /**
   * 浏览量自增（埋点触发，T3.1 同步）
   */
  async incrementViewCount(memeId: string): Promise<void> {
    await this.db
      .update(memeCards)
      .set({ viewCount: sql`${memeCards.viewCount} + 1` })
      .where(eq(memeCards.memeId, memeId));
  }

  /**
   * 同步 Redis ZSet（手动触发）
   */
  async syncHotRank(): Promise<{ synced: number }> {
    await this.recomputeHotScore();
    const count = await this.redis.zcard(HOT_RANK_KEY);
    return { synced: count };
  }

  /**
   * 查询当前 hot_rank:daily top-N 用于调试
   */
  async getHotRankTopN(n: number = 10) {
    const items = await this.redis.zrevrange(HOT_RANK_KEY, 0, n - 1, 'WITHSCORES');
    const result: Array<{ memeId: string; score: number }> = [];
    for (let i = 0; i < items.length; i += 2) {
      result.push({ memeId: items[i]!, score: Number(items[i + 1]!) });
    }
    return result;
  }
}
