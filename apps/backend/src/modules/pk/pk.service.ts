import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { REDIS } from '../../database/redis.module.js';
import { pkMatches, pkVotes, legions, legionMembers } from '../../database/schema.js';
import { and, eq, isNull, desc, sql, inArray } from 'drizzle-orm';
import type Redis from 'ioredis';
import type { CreatePKDto } from './dto.js';
import { PK_VOTE_PER_USER_PER_DAY } from '@memestar/shared';

const VOTE_DAILY_KEY = 'pk:vote:daily:'; // pk:vote:daily:<userId>:<pkId>
const PAGE_SIZE = 20;

@Injectable()
export class PKService {
  private readonly logger = new Logger(PKService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async listActive() {
    const now = new Date();
    const items = await this.db
      .select({
        pkId: pkMatches.pkId,
        type: pkMatches.type,
        theme: pkMatches.theme,
        legionA: pkMatches.legionA,
        legionB: pkMatches.legionB,
        status: pkMatches.status,
        scoreA: pkMatches.scoreA,
        scoreB: pkMatches.scoreB,
        startAt: pkMatches.startAt,
        endAt: pkMatches.endAt,
        legionAName: legions.name,
        legionBName: legions.name,
      })
      .from(pkMatches)
      .leftJoin(legions, eq(pkMatches.legionA, legions.legionId))
      // Can't left join twice easily in drizzle, use raw SQL for the view
      .where(
        and(
          inArray(pkMatches.status, ['preparing', 'battling', 'judging']),
          sql`${pkMatches.endAt} > ${now}`,
        ),
      )
      .orderBy(desc(pkMatches.createdAt))
      .limit(PAGE_SIZE);

    // Use raw SQL query for the v_pk_active view (joins legions twice)
    if (items.length === 0) {
      return { items: [] };
    }

    // Get legion names for both sides
    const legionIds = [...new Set(items.map((i) => i.legionA).concat(items.map((i) => i.legionB)))];
    const legionMap = new Map<string, string>();
    if (legionIds.length > 0) {
      const legionsData = await this.db
        .select({ id: legions.legionId, name: legions.name, avatarUrl: legions.avatarUrl })
        .from(legions)
        .where(inArray(legions.legionId, legionIds));
      for (const l of legionsData) {
        legionMap.set(l.id, l.name);
      }
    }

    const enriched = items.map((item) => ({
      ...item,
      legionAName: legionMap.get(item.legionA) ?? '',
      legionBName: legionMap.get(item.legionB) ?? '',
    }));

    return { items: enriched };
  }

  async findById(id: string) {
    const match = await this.db
      .select({
        pkId: pkMatches.pkId,
        type: pkMatches.type,
        legionA: pkMatches.legionA,
        legionB: pkMatches.legionB,
        theme: pkMatches.theme,
        startAt: pkMatches.startAt,
        endAt: pkMatches.endAt,
        status: pkMatches.status,
        scoreA: pkMatches.scoreA,
        scoreB: pkMatches.scoreB,
        winnerId: pkMatches.winnerId,
        mvpUserId: pkMatches.mvpUserId,
        isOfficial: pkMatches.isOfficial,
        createdAt: pkMatches.createdAt,
        updatedAt: pkMatches.updatedAt,
      })
      .from(pkMatches)
      .where(eq(pkMatches.pkId, id))
      .limit(1);

    if (!match[0]) throw new NotFoundException('PK 不存在');

    const legionIds = [match[0].legionA, match[0].legionB].filter(Boolean) as string[];
    const legionMap = new Map<string, { name: string; avatarUrl: string | null }>();
    if (legionIds.length > 0) {
      const legionRows = await this.db
        .select({
          id: legions.legionId,
          name: legions.name,
          avatarUrl: legions.avatarUrl,
        })
        .from(legions)
        .where(inArray(legions.legionId, legionIds));
      for (const l of legionRows) {
        legionMap.set(l.id, { name: l.name, avatarUrl: l.avatarUrl });
      }
    }

    const m = match[0];
    return {
      ...m,
      legionAName: legionMap.get(m.legionA)?.name ?? '',
      legionAAvatarUrl: legionMap.get(m.legionA)?.avatarUrl ?? null,
      legionBName: legionMap.get(m.legionB)?.name ?? '',
      legionBAvatarUrl: legionMap.get(m.legionB)?.avatarUrl ?? null,
    };
  }

  async create(userId: string, dto: CreatePKDto) {
    // Verify both legions exist and user is leader of legionA
    const [legionA] = await this.db
      .select()
      .from(legions)
      .where(and(eq(legions.legionId, dto.legionA), isNull(legions.deletedAt)))
      .limit(1);

    if (!legionA) throw new NotFoundException('发起军团不存在');

    const [legionB] = await this.db
      .select()
      .from(legions)
      .where(and(eq(legions.legionId, dto.legionB), isNull(legions.deletedAt)))
      .limit(1);

    if (!legionB) throw new NotFoundException('目标军团不存在');

    // Check user is leader or vice_leader of legionA
    const [membership] = await this.db
      .select()
      .from(legionMembers)
      .where(
        and(
          eq(legionMembers.legionId, dto.legionA),
          eq(legionMembers.userId, userId),
          isNull(legionMembers.leftAt),
          inArray(legionMembers.role, ['leader', 'vice_leader']),
        ),
      )
      .limit(1);

    if (!membership) throw new ForbiddenException('只有团长或副团长才能发起 PK');

    const [match] = await this.db
      .insert(pkMatches)
      .values({
        type: dto.type,
        legionA: dto.legionA,
        legionB: dto.legionB,
        theme: dto.theme,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        status: 'challenged',
      })
      .returning();

    if (!match) throw new Error('PK 创建失败');

    this.logger.log(`PK created: ${match.pkId} by user ${userId}`);
    return { pkId: match.pkId, status: 'challenged' };
  }

  async vote(userId: string, pkId: string, legionId: string) {
    // Verify PK is in battleground
    const [match] = await this.db.select().from(pkMatches).where(eq(pkMatches.pkId, pkId)).limit(1);

    if (!match) throw new NotFoundException('PK 不存在');
    if (match.status !== 'battling') throw new BadRequestException('PK 不在投票阶段');

    // Verify legion is one of the participants
    if (match.legionA !== legionId && match.legionB !== legionId) {
      throw new BadRequestException('该军团未参与此 PK');
    }

    // Check daily vote limit via Redis
    const dailyKey = `${VOTE_DAILY_KEY}${userId}:${pkId}`;
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const voteCount = await this.redis.incr(dailyKey);
    if (voteCount === 1) {
      // First vote today — set TTL to end of day
      const ttl = Math.floor((today.getTime() - Date.now()) / 1000);
      if (ttl > 0) await this.redis.expire(dailyKey, ttl);
    }

    if (voteCount > PK_VOTE_PER_USER_PER_DAY) {
      throw new BadRequestException(`每人每天最多投 ${PK_VOTE_PER_USER_PER_DAY} 票`);
    }

    // Insert vote record
    await this.db.insert(pkVotes).values({ pkId, userId, legionId });

    // Update PK score
    const scoreField = legionId === match.legionA ? 'scoreA' : 'scoreB';
    await this.db
      .update(pkMatches)
      .set({
        [scoreField]: sql`${sql.raw(scoreField === 'scoreA' ? 'score_a' : 'score_b')} + 1`,
      })
      .where(eq(pkMatches.pkId, pkId));

    // Publish score via Redis pubsub for real-time updates
    await this.redis.publish(
      'pk:vote',
      JSON.stringify({ pkId, legionId, userId, timestamp: Date.now() }),
    );

    this.logger.log(
      `Vote recorded: user=${userId} pk=${pkId} legion=${legionId} count=${voteCount}`,
    );
    return { ok: true, votesToday: voteCount };
  }

  async settle(pkId: string) {
    const [match] = await this.db
      .select()
      .from(pkMatches)
      .where(and(eq(pkMatches.pkId, pkId), inArray(pkMatches.status, ['judging', 'battling'])))
      .limit(1);

    if (!match) throw new NotFoundException('PK 不存在或不可结算');

    const winnerId =
      match.scoreA > match.scoreB
        ? match.legionA
        : match.scoreB > match.scoreA
          ? match.legionB
          : null;

    await this.db
      .update(pkMatches)
      .set({
        status: 'settled',
        winnerId,
        updatedAt: sql`now()`,
      })
      .where(eq(pkMatches.pkId, pkId));

    if (winnerId) {
      // Update win/loss counts
      await this.db
        .update(legions)
        .set({ pkWins: sql`${legions.pkWins} + 1` })
        .where(eq(legions.legionId, winnerId));

      const loserId = winnerId === match.legionA ? match.legionB : match.legionA;
      await this.db
        .update(legions)
        .set({ pkLosses: sql`${legions.pkLosses} + 1` })
        .where(eq(legions.legionId, loserId));
    }

    this.logger.log(`PK settled: ${pkId} winner=${winnerId}`);
    return { pkId, status: 'settled', winnerId };
  }
}
