import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { shares, favorites, memeCards } from '../../database/schema.js';
import type { FavoriteDto, ShareDto } from './dto.js';

@Injectable()
export class FavoriteShareService {
  private readonly logger = new Logger(FavoriteShareService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DbType) {}

  // ── 收藏 ──

  /**
   * 收藏梗卡（幂等：已收藏则忽略）
   *
   * 流程：
   * 1. 校验梗卡存在
   * 2. INSERT favorites（ON CONFLICT DO NOTHING）
   * 3. meme_cards.favorite_count + 1
   */
  async favorite(userId: string, dto: FavoriteDto) {
    const meme = await this.db
      .select({ memeId: memeCards.memeId })
      .from(memeCards)
      .where(eq(memeCards.memeId, dto.memeId))
      .limit(1);

    if (!meme[0]) throw new NotFoundException('梗卡不存在');

    const [existing] = await this.db
      .select({ userId: favorites.userId })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.memeId, dto.memeId)))
      .limit(1);

    if (existing) {
      return { ok: true, favorited: true, message: '已收藏' };
    }

    await this.db.insert(favorites).values({ userId, memeId: dto.memeId });

    await this.db
      .update(memeCards)
      .set({ favoriteCount: sql`${memeCards.favoriteCount} + 1` })
      .where(eq(memeCards.memeId, dto.memeId));

    this.logger.log(`user=${userId} favorited meme=${dto.memeId}`);
    return { ok: true, favorited: true };
  }

  /**
   * 取消收藏
   *
   * 流程：
   * 1. DELETE favorites WHERE user_id AND meme_id
   * 2. meme_cards.favorite_count - 1（不低于 0）
   */
  async unfavorite(userId: string, memeId: string) {
    const meme = await this.db
      .select({ memeId: memeCards.memeId })
      .from(memeCards)
      .where(eq(memeCards.memeId, memeId))
      .limit(1);

    if (!meme[0]) throw new NotFoundException('梗卡不存在');

    const [existing] = await this.db
      .select({ userId: favorites.userId })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.memeId, memeId)))
      .limit(1);

    if (!existing) {
      return { ok: true, favorited: false, message: '未收藏' };
    }

    await this.db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.memeId, memeId)));

    await this.db
      .update(memeCards)
      .set({ favoriteCount: sql`GREATEST(${memeCards.favoriteCount} - 1, 0)` })
      .where(eq(memeCards.memeId, memeId));

    this.logger.log(`user=${userId} unfavorited meme=${memeId}`);
    return { ok: true, favorited: false };
  }

  /**
   * 用户收藏列表
   */
  async userFavorites(userId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        memeId: favorites.memeId,
        createdAt: favorites.createdAt,
      })
      .from(favorites)
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countResult = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    const count = countResult[0]?.total ?? 0;

    return {
      list: items,
      total: count,
      page,
      pageSize,
      hasMore: offset + items.length < count,
    };
  }

  /**
   * 检查用户是否已收藏某梗卡
   */
  async isFavorited(userId: string, memeId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ userId: favorites.userId })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.memeId, memeId)))
      .limit(1);

    return !!row;
  }

  // ── 转发 ──

  /**
   * 转发梗卡（每次转发都记录一条 share，不幂等）
   *
   * 流程：
   * 1. 校验梗卡存在
   * 2. INSERT shares
   * 3. meme_cards.share_count + 1
   */
  async share(userId: string, dto: ShareDto) {
    const meme = await this.db
      .select({ memeId: memeCards.memeId })
      .from(memeCards)
      .where(eq(memeCards.memeId, dto.memeId))
      .limit(1);

    if (!meme[0]) throw new NotFoundException('梗卡不存在');

    await this.db.insert(shares).values({
      userId,
      memeId: dto.memeId,
      channel: dto.channel,
    });

    await this.db
      .update(memeCards)
      .set({ shareCount: sql`${memeCards.shareCount} + 1` })
      .where(eq(memeCards.memeId, dto.memeId));

    this.logger.log(`user=${userId} shared meme=${dto.memeId} channel=${dto.channel}`);
    return { ok: true };
  }

  /**
   * 梗卡转发记录列表
   */
  async listShares(memeId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select({
        shareId: shares.shareId,
        userId: shares.userId,
        channel: shares.channel,
        createdAt: shares.createdAt,
      })
      .from(shares)
      .where(eq(shares.memeId, memeId))
      .orderBy(desc(shares.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countResult = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(shares)
      .where(eq(shares.memeId, memeId));
    const count = countResult[0]?.total ?? 0;

    return {
      list: items,
      total: count,
      page,
      pageSize,
      hasMore: offset + items.length < count,
    };
  }
}
