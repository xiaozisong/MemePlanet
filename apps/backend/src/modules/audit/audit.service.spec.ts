import { AuditService } from './audit.service.js';
import type { DbType } from '../../database/drizzle.module.js';
import { SensitiveWordService } from './sensitive-word.service.js';

function mockDb() {
  return {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as unknown as jest.Mocked<DbType>;
}

/** insert → values → returning */
function insertReturning(rows: unknown) {
  const returning = jest.fn().mockResolvedValue(rows);
  const values = jest.fn().mockReturnValue({ returning });
  return { values };
}

/** insert → values (no returning) */
function insertNoReturn() {
  const values = jest.fn().mockResolvedValue(undefined);
  return { values };
}

function mockSensitive(
  hasSensitive = false,
  matchResults: { word: string; start: number; end: number }[] = [],
): jest.Mocked<SensitiveWordService> {
  return {
    match: jest.fn().mockReturnValue(matchResults),
    hasSensitive: jest.fn().mockReturnValue(hasSensitive),
    mask: jest.fn().mockReturnValue('***'),
  } as unknown as jest.Mocked<SensitiveWordService>;
}

describe('AuditService', () => {
  let db: jest.Mocked<DbType>;
  let sensitive: ReturnType<typeof mockSensitive>;
  let service: AuditService;

  beforeEach(() => {
    db = mockDb();
    sensitive = mockSensitive();
    service = new AuditService(
      db as unknown as DbType,
      sensitive as unknown as SensitiveWordService,
    );
  });

  describe('report', () => {
    it('应成功创建举报并返回 reportId', async () => {
      const reportId = 'report-001';
      (db.insert as jest.Mock).mockReturnValueOnce(
        insertReturning([{ reportId, status: 'pending' }]),
      );

      const result = await service.report('user-001', {
        targetType: 'meme',
        targetId: 'meme-001',
        reason: 'spam',
      });

      expect(result.reportId).toBe('report-001');
      expect(result.status).toBe('pending');
    });

    it('应正确传递 detail 字段', async () => {
      (db.insert as jest.Mock).mockReturnValueOnce(
        insertReturning([{ reportId: 'report-002', status: 'pending' }]),
      );

      await service.report('user-001', {
        targetType: 'comment',
        targetId: 'comment-001',
        reason: '色情内容',
        detail: '截图证据',
      });

      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('insert 返回空数组时应抛出错误', async () => {
      (db.insert as jest.Mock).mockReturnValueOnce(insertReturning([]));

      await expect(
        service.report('user-001', {
          targetType: 'meme',
          targetId: 'meme-001',
          reason: 'spam',
        }),
      ).rejects.toThrow('举报提交失败');
    });
  });

  describe('machineAudit', () => {
    it('DFA 命中时返回 reject 并写 audit_logs', async () => {
      sensitive = mockSensitive(true, [{ word: '法轮功', start: 0, end: 3 }]);
      service = new AuditService(
        db as unknown as DbType,
        sensitive as unknown as SensitiveWordService,
      );
      (db.insert as jest.Mock).mockReturnValueOnce(insertNoReturn());

      const result = await service.machineAudit({
        targetType: 'meme',
        targetId: 'meme-001',
        content: '法轮功是邪教',
      });

      expect(result.result).toBe('reject');
      expect(result.matches).toHaveLength(1);
      expect(result.matches).toBeDefined();
      expect(result.matches![0]!.word).toBe('法轮功');
      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('DFA 未命中时返回 pass 并写 audit_logs', async () => {
      sensitive = mockSensitive(false);
      service = new AuditService(
        db as unknown as DbType,
        sensitive as unknown as SensitiveWordService,
      );
      (db.insert as jest.Mock).mockReturnValueOnce(insertNoReturn());

      const result = await service.machineAudit({
        targetType: 'meme',
        targetId: 'meme-001',
        content: '这个梗好有趣',
      });

      expect(result.result).toBe('pass');
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });
});
