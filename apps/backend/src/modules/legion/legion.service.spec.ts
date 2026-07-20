import { LegionService } from './legion.service.js';
import type { DbType } from '../../database/drizzle.module.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

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

/** select → from → where → limit (single entity lookup) */
function singleResult(row: unknown) {
  const limit = jest.fn().mockResolvedValue(row ? [row] : []);
  const where = jest.fn().mockReturnValue({ limit });
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → where (count() with where, returns array directly) */
function whereResult(rows: unknown) {
  const where = jest.fn().mockResolvedValue(rows);
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → leftJoin → where → orderBy (members query, no limit) */
function leftJoinOrderedResult(rows: unknown) {
  const orderBy = jest.fn().mockResolvedValue(rows);
  const where = jest.fn().mockReturnValue({ orderBy });
  const leftJoin = jest.fn().mockReturnValue({ where });
  const from = jest.fn().mockReturnValue({ leftJoin });
  return { from };
}

/** insert → values → returning */
function insertResult(returned: unknown) {
  const returning = jest.fn().mockResolvedValue(returned);
  const values = jest.fn().mockReturnValue({ returning });
  return { values };
}

/** insert → values (no returning) */
function insertValues() {
  const values = jest.fn().mockResolvedValue(undefined);
  return { values };
}

/** update → set → where */
function updateChain() {
  const where = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn().mockReturnValue({ where });
  return { set };
}

const mockLegion = {
  legionId: 'legion-001',
  name: '测试军团',
  slogan: '冲冲冲',
  leaderId: 'user-001',
  memberCount: 1,
  memberCap: 500,
  status: 'active',
  activityScore: 100,
  level: 1,
  themeTags: [],
  joinMode: 'public',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  pkWins: 0,
  pkLosses: 0,
};

const mockMember = {
  membershipId: 'mem-001',
  legionId: 'legion-001',
  userId: 'user-002',
  role: 'member',
  contribution: 10,
  joinedAt: new Date(),
  leftAt: null,
  nickname: '用户2',
  avatarUrl: null,
};

describe('LegionService', () => {
  let db: jest.Mocked<DbType>;
  let service: LegionService;

  beforeEach(() => {
    db = mockDb();
    service = new LegionService(db as unknown as DbType);
  });

  describe('list', () => {
    it('should return paginated legions', async () => {
      // 1st select: items (paginated)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: paginatedListResult([mockLegion]).from,
      });
      // 2nd select: count
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ total: 1 }]).from });

      const result = await service.list(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });

    it('should filter empty result by keyword', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: paginatedListResult([]).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ total: 0 }]).from });

      const result = await service.list(1, '测试');
      expect(result.total).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return legion with members', async () => {
      // 1st select: legion lookup (where + limit)
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockLegion).from });
      // 2nd select: members (leftJoin + where + orderBy, no limit)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: leftJoinOrderedResult([mockMember]).from,
      });

      const result = await service.findById('legion-001');
      expect(result.legionId).toBe('legion-001');
      expect(result.members).toHaveLength(1);
    });

    it('should throw NotFoundException if legion does not exist', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a legion and add creator as leader', async () => {
      // 1st select: count of existing legions for user
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ total: 0 }]).from });
      // 1st insert: legion with returning
      (db.insert as jest.Mock).mockReturnValueOnce({
        values: insertResult([{ legionId: 'legion-001', status: 'active' }]).values,
      });
      // 2nd insert: leader membership (no returning)
      (db.insert as jest.Mock).mockReturnValueOnce({ values: insertValues().values });

      const result = await service.create('user-001', {
        name: '新军团',
        slogan: '必胜',
        themeTags: ['搞笑'],
        joinMode: 'public',
      });
      expect(result.legionId).toBe('legion-001');
      expect(result.status).toBe('active');
    });

    it('should throw if user already in max legions', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ total: 3 }]).from });
      await expect(
        service.create('user-001', { name: 'a', themeTags: [], joinMode: 'public' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('join', () => {
    it('should join an active legion with capacity', async () => {
      // 1st select: legion lookup
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockLegion).from });
      // 2nd select: existing membership check
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      // 3rd select: user legion count
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ total: 0 }]).from });
      // insert: new membership (no returning)
      (db.insert as jest.Mock).mockReturnValueOnce({ values: insertValues().values });
      // update: increment member count
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());

      const result = await service.join('user-003', 'legion-001');
      expect(result.ok).toBe(true);
    });

    it('should throw if legion does not exist', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.join('user-003', 'legion-001')).rejects.toThrow(NotFoundException);
    });

    it('should throw if legion is full', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: singleResult({ ...mockLegion, memberCount: 500, memberCap: 500 }).from,
      });
      await expect(service.join('user-003', 'legion-001')).rejects.toThrow(BadRequestException);
    });

    it('should throw if already a member', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockLegion).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockMember).from });
      await expect(service.join('user-002', 'legion-001')).rejects.toThrow(BadRequestException);
    });

    it('should throw if user in max legions', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockLegion).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: whereResult([{ total: 3 }]).from });
      await expect(service.join('user-003', 'legion-001')).rejects.toThrow(BadRequestException);
    });
  });

  describe('leave', () => {
    it('should leave a legion', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: singleResult({ ...mockMember, role: 'member' }).from,
      });
      // 1st update: set leftAt on membership
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());
      // 2nd update: decrement legion member count
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());

      const result = await service.leave('user-002', 'legion-001');
      expect(result.ok).toBe(true);
    });

    it('should throw if leader tries to leave', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: singleResult({ ...mockMember, role: 'leader' }).from,
      });
      await expect(service.leave('user-002', 'legion-001')).rejects.toThrow(ForbiddenException);
    });

    it('should throw if not a member', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.leave('user-003', 'legion-001')).rejects.toThrow(BadRequestException);
    });
  });
});
