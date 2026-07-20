import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { notifications } from '../../database/schema.js';
import { and, eq, desc, sql } from 'drizzle-orm';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export type NotifType = 'comment' | 'like' | 'legion_invite' | 'pk_invite' | 'system';

export interface CreateNotifInput {
  type: NotifType;
  title?: string;
  body?: string;
  payload?: Record<string, unknown>;
  push?: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DbType) {}

  async list(userId: string, page: number = 1, pageSize: number = DEFAULT_PAGE_SIZE) {
    const size = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    const offset = (Math.max(page, 1) - 1) * size;

    const rows = await this.db
      .select({
        notifId: notifications.notifId,
        type: notifications.type,
        title: notifications.title,
        body: notifications.body,
        payload: notifications.payload,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(size)
      .offset(offset);

    const totalRow = await this.db
      .select({ value: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const total = totalRow[0]?.value ?? 0;
    const unreadRow = await this.db
      .select({ value: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const unreadCount = unreadRow[0]?.value ?? 0;

    return {
      items: rows,
      total,
      unreadCount,
      page,
      pageSize: size,
      hasMore: offset + size < total,
    };
  }

  async markRead(userId: string, notifId: string) {
    const updated = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.notifId, notifId), eq(notifications.userId, userId)))
      .returning({ notifId: notifications.notifId, isRead: notifications.isRead });

    if (updated.length === 0) {
      throw new NotFoundException(`通知 ${notifId} 不存在或不属于当前用户`);
    }
    return updated[0];
  }

  async markAllRead(userId: string) {
    const result = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const affectedRows = Array.isArray(result) ? result.length : (result?.rowCount ?? 0);

    this.logger.log(`markAllRead user=${userId} affected=${affectedRows}`);
    return { ok: true as const, affected: affectedRows };
  }

  async sendPush(
    userId: string,
    type: string,
    payload: Record<string, unknown>,
    opts?: {
      title?: string;
      body?: string;
      push?: boolean;
    },
  ) {
    const title = opts?.title ?? null;
    const body = opts?.body ?? null;
    const pushStatus = opts?.push === false ? 'skipped' : 'pending';

    const inserted = await this.db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        body,
        payload,
        isRead: false,
        pushStatus,
      })
      .returning({
        notifId: notifications.notifId,
        type: notifications.type,
        createdAt: notifications.createdAt,
      });

    if (pushStatus === 'pending' && inserted.length > 0) {
      this.logger.log(`sendPush queued user=${userId} type=${type} notif=${inserted[0]?.notifId}`);
    }

    return inserted[0];
  }
}
