import { PKService } from './pk.service.js';
import type { DbType } from '../../database/drizzle.module.js';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type Redis from 'ioredis';
import type { CreatePKDto } from './dto.js';

function mockDb() {
  return { select: jest.fn(), insert: jest.fn(), update: jest.fn(), delete: jest.fn() } as unknown as jest.Mocked<DbType>;
}

function mockRedis(): jest.Mocked<Redis> {
  return { incr: jest.fn().mockResolvedValue(1), expire: jest.fn().mockResolvedValue(1), publish: jest.fn().mockResolvedValue(0) } as unknown as jest.Mocked<Redis>;
}

/** select → from → where → limit (single entity lookup) */
function singleResult(row: unknown) {
  const limit = jest.fn().mockResolvedValue(row ? [row] : []);
  const where = jest.fn().mockReturnValue({ limit });
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** select → from → leftJoin → where → orderBy → limit */
function leftJoinOrderedResult(rows: unknown) {
  const limit = jest.fn().mockResolvedValue(rows);
  const orderBy = jest.fn().mockReturnValue({ limit });
  const where = jest.fn().mockReturnValue({ orderBy });
  const leftJoin = jest.fn().mockReturnValue({ where });
  const from = jest.fn().mockReturnValue({ leftJoin });
  return { from };
}

/** select → from → where (simple, returns array directly) */
function pureWhere(rows: unknown) {
  const where = jest.fn().mockResolvedValue(rows);
  const from = jest.fn().mockReturnValue({ where });
  return { from };
}

/** insert → values (no returning) */
function insertValues() {
  const values = jest.fn().mockResolvedValue(undefined);
  return { values };
}

/** insert → values → returning */
function insertResult(returned: unknown) {
  const returning = jest.fn().mockResolvedValue(returned);
  const values = jest.fn().mockReturnValue({ returning });
  return { values };
}

/** update → set → where */
function updateChain() {
  const where = jest.fn().mockResolvedValue(undefined);
  const set = jest.fn().mockReturnValue({ where });
  return { set };
}

const mockMatch = {
  pkId: 'pk-001', type: 'vote', theme: '谁最强', legionA: 'legion-001', legionB: 'legion-002',
  scoreA: 10, scoreB: 5, status: 'battling', startAt: new Date(), endAt: new Date(Date.now() + 3600_000),
  createdAt: new Date(), updatedAt: new Date(), winnerId: null, createdBy: 'user-001', settledAt: null,
};

describe('PKService', () => {
  let db: jest.Mocked<DbType>;
  let redis: jest.Mocked<Redis>;
  let service: PKService;

  beforeEach(() => {
    db = mockDb(); redis = mockRedis();
    service = new PKService(db as unknown as DbType, redis as unknown as Redis);
  });

  describe('listActive', () => {
    it('should return active PK matches', async () => {
      // 1st select: pkMatches with leftJoin on legions
      (db.select as jest.Mock).mockReturnValueOnce({ from: leftJoinOrderedResult([mockMatch]).from });
      // 2nd select: legions lookup by ids
      (db.select as jest.Mock).mockReturnValueOnce({ from: pureWhere([{ id: 'legion-001', name: 'A', avatarUrl: null }]).from });

      const result = await service.listActive();
      expect(result.items).toHaveLength(1);
    });

    it('should return empty array', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: leftJoinOrderedResult([]).from });

      const result = await service.listActive();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find by id', async () => {
      // findById now does 2 queries: pk match + legion names
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockMatch).from });
      // legion name query — first select needs item for inArray to be non-empty
      const whereFn = jest.fn().mockResolvedValue([{ id: 'legion-001', name: '军团A', avatarUrl: null }]);
      const fromFn = jest.fn().mockReturnValue({ where: whereFn });
      (db.select as jest.Mock).mockReturnValueOnce({ from: fromFn });
      await expect(service.findById('pk-001')).resolves.toBeDefined();
    });

    it('should throw NotFound', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.findById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto: CreatePKDto = { type: 'vote', legionA: 'legion-001', legionB: 'legion-002', theme: '谁更强', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 3600_000).toISOString() };

    it('should create', async () => {
      // 3 selects: legionA, legionB, membership check
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ legionId: 'legion-001' }).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ legionId: 'legion-002' }).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ membershipId: 'mem-001', role: 'leader' }).from });
      // insert pk match with returning
      (db.insert as jest.Mock).mockReturnValueOnce(insertResult([{ pkId: 'pk-001', status: 'challenged' }]));

      const r = await service.create('user-001', dto);
      expect(r.pkId).toBe('pk-001');
    });

    it('should throw if legionA missing', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.create('u', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw if not leader', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ legionId: 'legion-001' }).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ legionId: 'legion-002' }).from });
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.create('u', dto)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('vote', () => {
    it('should vote', async () => {
      // 1 select: match lookup
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockMatch).from });
      // insert: vote record
      (db.insert as jest.Mock).mockReturnValueOnce(insertValues());
      // update: pk match score
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());

      const result = await service.vote('u', 'pk-001', 'legion-001');
      expect(result.ok).toBe(true);
      expect(redis.publish).toHaveBeenCalled();
    });

    it('should throw if not battling', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ ...mockMatch, status: 'challenged' }).from });
      await expect(service.vote('u', 'pk-001', 'legion-001')).rejects.toThrow(BadRequestException);
    });

    it('should throw if legion not participating', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockMatch).from });
      await expect(service.vote('u', 'pk-001', 'legion-003')).rejects.toThrow(BadRequestException);
    });
  });

  describe('settle', () => {
    it('should settle with winner', async () => {
      // 1 select: match lookup (scoreA=10, scoreB=5 → winner=legionA)
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(mockMatch).from });
      // update: pk match status/winner/updatedAt
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());
      // update: winner legion pkWins +1
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());
      // update: loser legion pkLosses +1
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());

      const r = await service.settle('pk-001');
      expect(r.winnerId).toBe('legion-001');
    });

    it('should handle tie', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult({ ...mockMatch, scoreA: 5, scoreB: 5 }).from });
      // Only 1 update: pk match, no legion win/loss updates
      (db.update as jest.Mock).mockReturnValueOnce(updateChain());

      const r = await service.settle('pk-001');
      expect(r.winnerId).toBeNull();
    });

    it('should throw for invalid', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({ from: singleResult(null).from });
      await expect(service.settle('x')).rejects.toThrow(NotFoundException);
    });
  });
});
