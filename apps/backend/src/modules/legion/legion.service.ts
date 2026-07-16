import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { legions, legionMembers, users } from '../../database/schema.js';
import { and, eq, isNull, like, desc, count, sql } from 'drizzle-orm';
import type { CreateLegionDto } from './dto.js';

const MAX_LEGIONS_PER_USER = 3;
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class LegionService {
  private readonly logger = new Logger(LegionService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DbType) {}

  async list(page: number, keyword?: string) {
    const offset = (page - 1) * DEFAULT_PAGE_SIZE;
    const conditions = [isNull(legions.deletedAt)];

    if (keyword) {
      conditions.push(like(legions.name, `%${keyword}%`));
    }

    const where = and(...conditions);

    const items = await this.db
      .select()
      .from(legions)
      .where(where)
      .orderBy(desc(legions.activityScore), desc(legions.level))
      .limit(DEFAULT_PAGE_SIZE)
      .offset(offset);

    const totalResult = await this.db.select({ total: count() }).from(legions).where(where);

    return { items, page, total: Number(totalResult[0]?.total ?? 0), pageSize: DEFAULT_PAGE_SIZE };
  }

  async findById(id: string) {
    const legion = await this.db
      .select()
      .from(legions)
      .where(and(eq(legions.legionId, id), isNull(legions.deletedAt)))
      .limit(1);

    if (!legion[0]) throw new NotFoundException('军团不存在');

    const members = await this.db
      .select({
        userId: legionMembers.userId,
        role: legionMembers.role,
        contribution: legionMembers.contribution,
        joinedAt: legionMembers.joinedAt,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
      })
      .from(legionMembers)
      .leftJoin(users, eq(legionMembers.userId, users.userId))
      .where(and(eq(legionMembers.legionId, id), isNull(legionMembers.leftAt)))
      .orderBy(desc(legionMembers.contribution));

    return { ...legion[0], members };
  }

  async create(userId: string, dto: CreateLegionDto) {
    const existingCount = await this.db
      .select({ total: count() })
      .from(legionMembers)
      .where(and(eq(legionMembers.userId, userId), isNull(legionMembers.leftAt)));

    if (Number(existingCount[0]?.total ?? 0) >= MAX_LEGIONS_PER_USER) {
      throw new BadRequestException(`每人最多加入 ${MAX_LEGIONS_PER_USER} 个军团`);
    }

    const [legion] = await this.db
      .insert(legions)
      .values({
        name: dto.name,
        slogan: dto.slogan,
        avatarUrl: dto.avatarUrl,
        themeTags: dto.themeTags ?? [],
        leaderId: userId,
        joinMode: dto.joinMode ?? 'approval',
        memberCount: 1,
        memberCap: 500,
        status: 'active',
      })
      .returning();

    if (!legion) throw new Error('军团创建失败');

    await this.db.insert(legionMembers).values({
      legionId: legion.legionId,
      userId,
      role: 'leader',
      contribution: 0,
    });

    this.logger.log(`Legion created: ${legion.legionId} by user ${userId}`);
    return { legionId: legion.legionId, status: 'active' };
  }

  async join(userId: string, legionId: string) {
    const legion = await this.db
      .select()
      .from(legions)
      .where(and(eq(legions.legionId, legionId), isNull(legions.deletedAt)))
      .limit(1);

    if (!legion[0]) throw new NotFoundException('军团不存在');
    if (legion[0].status !== 'active') throw new BadRequestException('军团当前不可加入');

    if (legion[0].memberCount >= legion[0].memberCap) {
      throw new BadRequestException('军团成员已满');
    }

    const existing = await this.db
      .select()
      .from(legionMembers)
      .where(
        and(
          eq(legionMembers.legionId, legionId),
          eq(legionMembers.userId, userId),
          isNull(legionMembers.leftAt),
        ),
      )
      .limit(1);

    if (existing[0]) throw new BadRequestException('已是该军团成员');

    const userLegionCount = await this.db
      .select({ total: count() })
      .from(legionMembers)
      .where(and(eq(legionMembers.userId, userId), isNull(legionMembers.leftAt)));

    if (Number(userLegionCount[0]?.total ?? 0) >= MAX_LEGIONS_PER_USER) {
      throw new BadRequestException(`每人最多加入 ${MAX_LEGIONS_PER_USER} 个军团`);
    }

    await this.db.insert(legionMembers).values({ legionId, userId, role: 'member' });

    await this.db
      .update(legions)
      .set({ memberCount: sql`${legions.memberCount} + 1` })
      .where(eq(legions.legionId, legionId));

    return { ok: true };
  }

  async leave(userId: string, legionId: string) {
    const membership = await this.db
      .select()
      .from(legionMembers)
      .where(
        and(
          eq(legionMembers.legionId, legionId),
          eq(legionMembers.userId, userId),
          isNull(legionMembers.leftAt),
        ),
      )
      .limit(1);

    if (!membership[0]) throw new BadRequestException('你不是该军团成员');
    if (membership[0].role === 'leader') throw new ForbiddenException('团长不能退出，请先转让团长');

    await this.db
      .update(legionMembers)
      .set({ leftAt: sql`now()` })
      .where(eq(legionMembers.membershipId, membership[0].membershipId));

    await this.db
      .update(legions)
      .set({ memberCount: sql`GREATEST(${legions.memberCount} - 1, 0)` })
      .where(eq(legions.legionId, legionId));

    return { ok: true };
  }
}
