import { AdminService } from './admin.service.js';
import type { DbType } from '../../database/drizzle.module.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type Redis from 'ioredis';

function mockDb() {
  return { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() } as unknown as jest.Mocked<DbType>;
}

function mockRedis(): jest.Mocked<Redis> {
  return {} as unknown as jest.Mocked<Redis>;
}

/** select → from → where → orderBy → limit (auditQueue patterns) */
function orderedLimitResult(rows: unknown) {
  const limit = jest.fn().mockResolvedValue(rows);
  const orderBy = jest.fn().mockReturnValue({ limit });
  const where = jest.fn().mockReturnValue({ orderBy });
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → where (no limit/orderBy) */
function pureWhereResult(rows: unknown) {
  const where = jest.fn().mockResolvedValue(rows);
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → where → limit */
function singleResult(row: unknown) {
  const limit = jest.fn().mockResolvedValue(row ? [row] : []);
  const where = jest.fn().mockReturnValue({ limit });
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → orderBy → limit → offset (listUsers) */
function paginatedResult(rows: unknown) {
  const offset = jest.fn().mockResolvedValue(rows);
  const limit = jest.fn().mockReturnValue({ offset });
  const orderBy = jest.fn().mockReturnValue({ limit });
  const from = jest.fn().mockReturnValue({ orderBy });
  return { from };
}

/** select → from (no where, like count query) */
function fromOnlyResult(rows: unknown) {
  const from = jest.fn().mockResolvedValue(rows);
  return { from };
}

/** insert → values */
function insertValues(valuesResult?: unknown) {
  const values = jest.fn().mockResolvedValue(valuesResult ?? undefined);
  return { values };
}

/** update → set → where */
function updateChain() {
  const where = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn().mockReturnValue({ where });
  return { set };
}

const mockReport = {
  reportId: 'report-001', targetType: 'meme', targetId: 'meme-001',
  reason: 'spam', detail: '垃圾广告', status: 'pending',
  createdAt: new Date(), reporterId: 'user-001',
};

const mockUser = {
  userId: 'user-001', nickname: '测试用户', phone: '13800138000',
  status: 'active', createdAt: new Date(), lastLoginAt: new Date(),
  level: 1, avatarUrl: null,
};

describe('AdminService', () => {
  let db: jest.Mocked<DbType>;
  let redis: jest.Mocked<Redis>;
  let service: AdminService;

  beforeEach(() => {
    db = mockDb(); redis = mockRedis();
    service = new AdminService(db as unknown as DbType, redis as unknown as Redis);
  });

  describe('auditQueue', () => {
    it('should return combined audit queue', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: orderedLimitResult([mockReport]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: orderedLimitResult([]).from });
      const result = await service.auditQueue();
      expect(result.items).toHaveLength(1);
    });
    it('should return empty queue', async () => {
      (db.select as jest.Mock).mockReturnValue({ from: orderedLimitResult([]).from });
      const result = await service.auditQueue();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('auditAction', () => {
    it('should approve a report', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockReport).from });
      (db.update as jest.Mock).mockReturnValue(updateChain());
      (db.insert as jest.Mock).mockReturnValue(insertValues());

      const result = await service.auditAction('admin-001', 'report-001', 'approve');
      expect(result.action).toBe('approve');
    });
    it('should handle meme card audit (fallback)', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ memeId: 'meme-001', status: 'pending_audit' }).from });
      (db.update as jest.Mock).mockReturnValue(updateChain());
      (db.insert as jest.Mock).mockReturnValue(insertValues());

      const result = await service.auditAction('admin-001', 'meme-001', 'approve');
      expect(result.action).toBe('approve');
    });
    it('should throw for invalid action', async () => {
      await expect(service.auditAction('admin-001', 'r', 'invalid')).rejects.toThrow(BadRequestException);
    });
    it('should throw NotFound for unknown', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.auditAction('admin-001', 'unknown', 'approve')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: paginatedResult([mockUser]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: fromOnlyResult([{ total: 1 }]).from });
      const result = await service.listUsers(1);
      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
    });
  });

  describe('banUser', () => {
    it('should ban a user', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockUser).from });
      (db.insert as jest.Mock).mockReturnValue(insertValues());
      (db.update as jest.Mock).mockReturnValue(updateChain());

      const result = await service.banUser('admin-001', 'user-001', '违规');
      expect(result.banned).toBe(true);
    });
    it('should throw if user not found', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.banUser('admin-001', 'x', 't')).rejects.toThrow(NotFoundException);
    });
  });

  describe('dashboard', () => {
    it('should return stats', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: pureWhereResult([{ total: 10 }]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: pureWhereResult([{ total: 3 }]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: pureWhereResult([{ total: 15 }]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: pureWhereResult([{ total: 500 }]).from });
      const result = await service.dashboard();
      expect(result.online).toBe(10);
      expect(result.activePKs).toBe(3);
      expect(result.memesCreatedToday).toBe(15);
      expect(result.aiCostTodayCents).toBe(500);
    });
    it('should handle empty results', async () => {
      (db.select as jest.Mock).mockReturnValue({ from: pureWhereResult([]).from });
      const result = await service.dashboard();
      expect(result.online).toBe(0);
    });
  });
});
