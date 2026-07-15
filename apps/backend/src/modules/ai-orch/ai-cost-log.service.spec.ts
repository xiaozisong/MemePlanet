import { AiCostLogService } from './ai-cost-log.service.js';
import type { DbType } from '../../database/drizzle.module.js';

function createMockDb() {
  const insert = jest.fn().mockReturnValue({
    values: jest.fn().mockResolvedValue(undefined),
  });
  const groupBy = jest.fn().mockResolvedValue([]);
  const where = jest.fn().mockReturnValue({ groupBy });
  const from = jest.fn().mockReturnValue({ where });
  const select = jest.fn().mockReturnValue({ from });
  return { insert, select } as unknown as DbType;
}

describe('AiCostLogService — T2.14', () => {
  let db: DbType;
  let service: AiCostLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createMockDb();
    service = new AiCostLogService(db);
  });

  describe('log', () => {
    it('成功写入单条成本日志', async () => {
      await service.log({
        userId: 'user-1',
        module: 'creation',
        provider: 'mock',
        model: 'mock-llm',
        tokensIn: 100,
        tokensOut: 200,
        costCents: 0,
        latencyMs: 50,
      });

      expect(db.insert).toHaveBeenCalledTimes(1);
    });

    it('写入失败时不抛出异常（graceful degradation）', async () => {
      const failingDb = {
        insert: jest.fn().mockImplementation(() => {
          throw new Error('db connection lost');
        }),
      } as unknown as DbType;

      const failingService = new AiCostLogService(failingDb);

      await expect(
        failingService.log({
          module: 'creation',
          provider: 'mock',
          model: 'mock-llm',
          tokensIn: 0,
          tokensOut: 0,
          costCents: 0,
          latencyMs: 0,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('logBatch', () => {
    it('批量写入返回 accepted 数量', async () => {
      const result = await service.logBatch([
        {
          userId: 'user-1',
          module: 'creation',
          provider: 'mock',
          model: 'mock-llm',
          tokensIn: 100,
          tokensOut: 200,
          costCents: 0,
          latencyMs: 50,
        },
        {
          module: 'image',
          provider: 'siliconflow',
          model: 'flux-schnell',
          tokensIn: 0,
          tokensOut: 0,
          costCents: 5,
          latencyMs: 2000,
        },
      ]);

      expect(result).toBe(2);
    });

    it('空数组返回 0', async () => {
      const result = await service.logBatch([]);
      expect(result).toBe(0);
    });
  });
});
