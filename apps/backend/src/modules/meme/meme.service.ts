import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import type Redis from 'ioredis';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { REDIS } from '../../database/redis.module.js';
import { memeCards, creations } from '../../database/schema.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateMemeDto } from './dto.js';
import type { MemeStatus } from '../../database/schema.js';

const MEME_CACHE_TTL = 600; // 10min
const MEME_CACHE_PREFIX = 'meme:detail:';

@Injectable()
export class MemeService {
  private readonly logger = new Logger(MemeService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly audit: AuditService,
  ) {}

  /**
   * 发布梗卡
   *
   * 流程：
   * 1. 如果提供了 creationId，校验该造梗记录属于当前用户且状态为 ready
   * 2. INSERT meme_cards（status = 'pending_audit'）
   * 3. 自动触发机审（AuditService.machineAudit）
   * 4. 根据审核结果流转状态：
   *    - pass → 'published'
   *    - manual_review → 'manual_review'
   *    - reject → 'rejected'
   */
  async publish(userId: string, dto: CreateMemeDto) {
    // 1. 如果关联造梗记录，校验有效性
    if (dto.creationId) {
      const creation = await this.db
        .select({ status: creations.status, userId: creations.userId })
        .from(creations)
        .where(eq(creations.creationId, dto.creationId))
        .limit(1);

      if (!creation[0]) {
        throw new BadRequestException('关联的造梗记录不存在');
      }
      if (creation[0].userId !== userId) {
        throw new BadRequestException('关联的造梗记录不属于当前用户');
      }
      if (creation[0].status !== 'ready') {
        throw new BadRequestException('造梗尚未完成，请等待候选生成');
      }
    }

    // 2. INSERT meme_cards（status = 'pending_audit'）
    const rows = await this.db
      .insert(memeCards)
      .values({
        authorId: userId,
        creationId: dto.creationId ?? null,
        type: dto.type,
        title: dto.title,
        coverUrl: dto.coverUrl ?? null,
        tags: dto.tags,
        legionId: dto.legionId ?? null,
        status: 'pending_audit',
        isAiGenerated: true,
        watermarked: true,
      })
      .returning({ memeId: memeCards.memeId, status: memeCards.status });

    const meme = rows[0]!;
    this.logger.log(`meme created user=${userId} id=${meme.memeId} type=${dto.type}`);

    // 3. 自动机审
    const auditResult = await this.audit.machineAudit({
      targetType: 'meme_card',
      targetId: meme.memeId,
      content: dto.title,
    });

    // 4. 根据审核结果流转状态
    const statusMap: Record<string, MemeStatus> = {
      pass: 'published',
      manual_review: 'manual_review',
      reject: 'rejected',
    };
    const nextStatus = statusMap[auditResult.result] ?? 'manual_review';

    await this.db
      .update(memeCards)
      .set({
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(memeCards.memeId, meme.memeId));

    this.logger.log(`meme ${meme.memeId} audit=${auditResult.result} → status=${nextStatus}`);

    return {
      memeId: meme.memeId,
      status: nextStatus,
      auditResult: auditResult.result,
    };
  }

  /**
   * 查询梗卡详情
   *
   * 返回完整梗卡信息，包含 AI 标识字段
   */
  async findById(id: string) {
    const cacheKey = `${MEME_CACHE_PREFIX}${id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return this.enrichAiLabel(JSON.parse(cached));
    }

    const row = await this.db
      .select()
      .from(memeCards)
      .where(and(eq(memeCards.memeId, id), sql`${memeCards.deletedAt} IS NULL`))
      .limit(1);

    if (!row[0]) {
      throw new NotFoundException('梗卡不存在');
    }

    await this.redis.setex(cacheKey, MEME_CACHE_TTL, JSON.stringify(row[0]));

    return this.enrichAiLabel(row[0]);
  }

  /**
   * 查询梗卡审核状态（T2.9）
   *
   * 返回 status + audit 信息，用于客户端轮询审核进度
   */
  async getStatus(id: string) {
    const row = await this.db
      .select({
        memeId: memeCards.memeId,
        status: memeCards.status,
        isAiGenerated: memeCards.isAiGenerated,
        publishedAt: memeCards.publishedAt,
        createdAt: memeCards.createdAt,
      })
      .from(memeCards)
      .where(eq(memeCards.memeId, id))
      .limit(1);

    if (!row[0]) {
      throw new NotFoundException('梗卡不存在');
    }
    return this.enrichAiLabel(row[0]);
  }

  /**
   * Feed 流（已发布梗卡，按创建时间倒序）
   * T3.2 阶段会改为热度召回，当前仅作骨架
   */
  async feed(page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const items = await this.db
      .select()
      .from(memeCards)
      .where(and(eq(memeCards.status, 'published'), sql`${memeCards.deletedAt} IS NULL`))
      .orderBy(desc(memeCards.createdAt))
      .limit(pageSize)
      .offset(offset);

    const countResult = await this.db
      .select({ total: sql<number>`count(*)` })
      .from(memeCards)
      .where(and(eq(memeCards.status, 'published'), sql`${memeCards.deletedAt} IS NULL`));

    const total = Number(countResult[0]?.total ?? 0);
    const hasMore = offset + pageSize < total;

    return { items: items.map((item) => this.enrichAiLabel(item)), page, pageSize, total, hasMore };
  }

  /**
   * AI 标识字段富化
   *
   * 为 MI MVP 阶段的每个 AI 生成梗卡附加人类可读的"AI 辅助创作"标识，
   * 满足合规要求。图片角标占位（图 M2）。
   */
  private enrichAiLabel<T extends { isAiGenerated?: boolean | null }>(
    row: T,
  ): T & {
    aiLabel: string | null;
  } {
    return {
      ...row,
      aiLabel: row.isAiGenerated ? 'AI 辅助创作' : null,
    };
  }
}
