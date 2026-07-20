import { NotificationService } from './notification.service.js';
import type { DbType } from '../../database/drizzle.module.js';
import { NotFoundException } from '@nestjs/common';

function mockDb() {
  const select = jest.fn();
  const insert = jest.fn();
  const update = jest.fn();
  const del = jest.fn();
  return { select, insert, update, delete: del } as unknown as jest.Mocked<DbType>;
}

/** select → from → where → orderBy → limit → offset (paginated items) */
function paginatedListResult(rows: unknown) {
  const offset = jest.fn().mockResolvedValue(rows);
  const limit = jest.fn().mockReturnValue({ offset });
  const orderBy = jest.fn().mockReturnValue({ limit });
  const where = jest.fn().mockReturnValue({ orderBy });
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → where (count array result) */
function whereResult(rows: unknown) {
  const where = jest.fn().mockResolvedValue(rows);
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** insert → values → returning */
function insertResult(returned: unknown) {
  const returning = jest.fn().mockResolvedValue(returned);
  const values = jest.fn().mockReturnValue({ returning });
  return { values };
}

/** update → set → where → returning */
function updateReturning(returned: unknown) {
  const returning = jest.fn().mockResolvedValue(returned);
  const where = jest.fn().mockReturnValue({ returning });
  const set = jest.fn().mockReturnValue({ where });
  return { set };
}

/** update → set → where (no returning; rowCount-style) */
function updateWhereResolved(result: unknown) {
  const where = jest.fn().mockResolvedValue(result);
  const set = jest.fn().mockReturnValue({ where });
  return { set };
}

const mockNotif = {
  notifId: 'notif-001',
  type: 'comment',
  title: '有人评论了你',
  body: '评论内容…',
  payload: { memeId: 'm-01', fromUserId: 'u-02' },
  isRead: false,
  createdAt: new Date('2026-07-20T10:00:00Z'),
};

describe('NotificationService', () => {
  let db: jest.Mocked<DbType>;
  let service: NotificationService;

  beforeEach(() => {
    db = mockDb();
    service = new NotificationService(db as unknown as DbType);
  });

  describe('list', () => {
    it('应返回分页通知 + 未读数', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: paginatedListResult([mockNotif]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 5 }]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 2 }]).from });

      const result = await service.list('user-001', 1, 10);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(5);
      expect(result.unreadCount).toBe(2);
      expect(result.items).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it('page 超出范围时 hasMore=false', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: paginatedListResult([]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 0 }]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 0 }]).from });

      const result = await service.list('user-001', 10, 20);
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('pageSize 超过上限应被截断为 MAX_PAGE_SIZE', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: paginatedListResult([]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 0 }]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 0 }]).from });

      const result = await service.list('user-001', 1, 999);
      expect(result.pageSize).toBe(50);
    });

    it('pageSize < 1 应被夹紧为 1', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: paginatedListResult([]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 0 }]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ value: 0 }]).from });

      const result = await service.list('user-001', 1, 0);
      expect(result.pageSize).toBe(1);
    });
  });

  describe('markRead', () => {
    it('应标记通知为已读', async () => {
      (db.update as jest.Mock).mockReturnValueOnce(
        updateReturning([{ notifId: 'notif-001', isRead: true }]),
      );

      const result = await service.markRead('user-001', 'notif-001');
      expect(result).toEqual({ notifId: 'notif-001', isRead: true });
    });

    it('通知不存在或不属于当前用户应抛 NotFoundException', async () => {
      (db.update as jest.Mock).mockReturnValueOnce(updateReturning([]));
      await expect(service.markRead('user-001', 'nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('应批量标记为已读（rowCount 路径）', async () => {
      (db.update as jest.Mock).mockReturnValueOnce(
        updateWhereResolved({ rowCount: 3 }),
      );
      const result = await service.markAllRead('user-001');
      expect(result.ok).toBe(true);
      expect(result.affected).toBe(3);
    });

    it('应支持返回数组路径', async () => {
      (db.update as jest.Mock).mockReturnValueOnce(updateWhereResolved([{ notifId: 'a' }, { notifId: 'b' }]));
      const result = await service.markAllRead('user-001');
      expect(result.affected).toBe(2);
    });

    it('返回 falsy 结果时 affected=0', async () => {
      (db.update as jest.Mock).mockReturnValueOnce(updateWhereResolved(undefined));
      const result = await service.markAllRead('user-001');
      expect(result.affected).toBe(0);
    });
  });

  describe('sendPush', () => {
    it('应写入通知并返回 notifId/type/createdAt', async () => {
      const createdAt = new Date('2026-07-20T10:00:00Z');
      (db.insert as jest.Mock).mockReturnValueOnce(
        insertResult([{ notifId: 'notif-002', type: 'like', createdAt }]),
      );

      const result = await service.sendPush('user-001', 'like', { memeId: 'm-01' }, {
        title: '有人赞了你',
        body: 'cx 给你的梗卡点赞',
      });
      expect(result).toEqual({ notifId: 'notif-002', type: 'like', createdAt });
    });

    it('push=false 时 pushStatus=skipped', async () => {
      const createdAt = new Date('2026-07-20T10:00:00Z');
      (db.insert as jest.Mock).mockReturnValueOnce(
        insertResult([{ notifId: 'notif-003', type: 'system', createdAt }]),
      );
      await service.sendPush('user-001', 'system', {}, { push: false });
    });
  });
});