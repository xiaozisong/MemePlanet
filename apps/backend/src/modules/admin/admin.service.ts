import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { REDIS } from '../../database/redis.module.js';
import {
  reports,
  bannedUsers,
  users,
  memeCards,
  aiCostLogs,
  pkMatches,
  auditLogs,
} from '../../database/schema.js';
import { eq, desc, asc, count, sql, inArray, gte, sum } from 'drizzle-orm';
import type Redis from 'ioredis';

const PAGE_SIZE = 20;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  /**
   * 审核队列：reports + meme_cards (status=pending_audit/manual_review) 按优先级排序
   */
  async auditQueue() {
    // Pending reports
    const pendingReports = await this.db
      .select({
        id: reports.reportId,
        type: sql`'report'::text`.as('type'),
        targetType: reports.targetType,
        targetId: reports.targetId,
        reason: reports.reason,
        detail: reports.detail,
        status: reports.status,
        createdAt: reports.createdAt,
        reporterId: reports.reporterId,
      })
      .from(reports)
      .where(eq(reports.status, 'pending'))
      .orderBy(asc(reports.createdAt))
      .limit(PAGE_SIZE);

    // Pending audit meme cards
    const pendingMemes = await this.db
      .select({
        id: memeCards.memeId,
        type: sql`'meme_audit'::text`.as('type'),
        targetType: sql`'meme'::text`.as('target_type'),
        targetId: memeCards.memeId,
        reason: sql`'机审需人工复核'::text`.as('reason'),
        detail: memeCards.title,
        status: sql`'pending'::text`.as('status'),
        createdAt: memeCards.createdAt,
        reporterId: memeCards.authorId,
      })
      .from(memeCards)
      .where(inArray(memeCards.status, ['pending_audit', 'manual_review']))
      .orderBy(asc(memeCards.createdAt))
      .limit(PAGE_SIZE);

    const items = [...pendingReports, ...pendingMemes].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    return { items };
  }

  /**
   * 审核操作：通过/驳回/下架
   * action: approve / reject / takedown
   */
  async auditAction(operatorId: string, auditId: string, action: string, reason?: string) {
    const validActions = ['approve', 'reject', 'takedown'];
    if (!validActions.includes(action)) {
      throw new BadRequestException(`无效的审核操作：${action}`);
    }

    // Find the report — try reports table first
    const [report] = await this.db
      .select()
      .from(reports)
      .where(eq(reports.reportId, auditId))
      .limit(1);

    if (report) {
      await this.db
        .update(reports)
        .set({
          status: action === 'approve' ? 'rejected' : 'handled',
          handlerId: operatorId,
          handledAt: new Date(),
        })
        .where(eq(reports.reportId, auditId));

      // If takedown, mark the target meme as hidden
      if (action === 'takedown' && report.targetType === 'meme') {
        await this.db
          .update(memeCards)
          .set({ status: 'hidden' })
          .where(eq(memeCards.memeId, report.targetId));
      }
    } else {
      // Try meme_cards (audit queue)
      const [meme] = await this.db
        .select()
        .from(memeCards)
        .where(eq(memeCards.memeId, auditId))
        .limit(1);

      if (!meme) throw new NotFoundException('审核项不存在');

      const newStatus =
        action === 'approve' ? 'published' : action === 'reject' ? 'rejected' : 'hidden';

      await this.db
        .update(memeCards)
        .set({ status: newStatus })
        .where(eq(memeCards.memeId, auditId));
    }

    // Log to audit_logs
    await this.db.insert(auditLogs).values({
      targetId: auditId,
      targetType: 'audit',
      action,
      reason: reason ?? null,
      result: action,
      operatorId,
      metadata: { reason: reason ?? null },
    });

    this.logger.log(
      `Audit action: operator=${operatorId} audit=${auditId} action=${action} reason=${reason ?? 'null'}`,
    );
    return { auditId, action, result: action };
  }

  async listUsers(page: number) {
    const offset = (page - 1) * PAGE_SIZE;
    const items = await this.db
      .select({
        userId: users.userId,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        phone: users.phone,
        status: users.status,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        level: users.level,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    const totalResult = await this.db.select({ total: count() }).from(users);

    return { items, page, total: Number(totalResult[0]?.total ?? 0) };
  }

  async banUser(operatorId: string, userId: string, reason: string, until?: string) {
    const [user] = await this.db.select().from(users).where(eq(users.userId, userId)).limit(1);

    if (!user) throw new NotFoundException('用户不存在');

    const banUntil = until ? new Date(until) : null;

    await this.db.insert(bannedUsers).values({
      userId,
      reason,
      banUntil,
      bannedBy: operatorId,
    });

    await this.db.update(users).set({ status: 'banned' }).where(eq(users.userId, userId));

    // Log
    await this.db.insert(auditLogs).values({
      targetId: userId,
      targetType: 'user',
      action: 'ban',
      reason,
      result: 'banned',
      operatorId,
      metadata: { banUntil: banUntil?.toISOString() ?? 'permanent' },
    });

    this.logger.log(
      `User banned: operator=${operatorId} user=${userId} reason=${reason} until=${banUntil?.toISOString() ?? 'permanent'}`,
    );
    return { userId, banned: true, banUntil: banUntil?.toISOString() ?? null };
  }

  async dashboard() {
    // Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Online users via Redis (rough estimate — online users are users with active sessions in last 5 min)
    let online = 0;
    try {
      // We'd track online status via Redis SET with TTL 300s
      // For now, just count active users from users table updated in last 5 min
      const [onlineResult] = await this.db
        .select({ total: count() })
        .from(users)
        .where(sql`${users.lastLoginAt} > NOW() - INTERVAL '5 minutes'`);
      online = Number(onlineResult?.total ?? 0);
    } catch {
      online = 0;
    }

    // Active PKs
    const [activePKsResult] = await this.db
      .select({ total: count() })
      .from(pkMatches)
      .where(inArray(pkMatches.status, ['preparing', 'battling', 'judging']));

    // Memes created today
    const [memesTodayResult] = await this.db
      .select({ total: count() })
      .from(memeCards)
      .where(gte(memeCards.createdAt, today));

    // AI cost today (in cents)
    const [aiCostResult] = await this.db
      .select({ total: sum(aiCostLogs.costCents) })
      .from(aiCostLogs)
      .where(gte(aiCostLogs.createdAt, today));

    return {
      online,
      activePKs: Number(activePKsResult?.total ?? 0),
      memesCreatedToday: Number(memesTodayResult?.total ?? 0),
      aiCostTodayCents: Number(aiCostResult?.total ?? 0),
    };
  }
}
