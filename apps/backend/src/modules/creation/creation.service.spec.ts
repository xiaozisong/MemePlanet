import { CreationService } from './creation.service.js';
import type { DbType } from '../../database/drizzle.module.js';
import { UserService } from '../user/user.service.js';
import { CreationQueueService } from './creation-queue.service.js';
import type { CreateCreationDto } from './dto.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ── Mock helpers ──

function createMockChain() {
  // chain: select -> from -> where -> (limit | orderBy)
  const limit = jest.fn().mockResolvedValue([]);
  const orderBy = jest.fn().mockReturnThis();
  const where = jest.fn().mockReturnValue({ limit, orderBy });
  const from = jest.fn().mockReturnValue({ where });
  const select = jest.fn().mockReturnValue({ from });
  return { select, from, where, limit, orderBy };
}

function createMockDb(): DbType {
  const selectChain = createMockChain();
  const insertReturning = jest
    .fn()
    .mockResolvedValue([{ creationId: 'creation-001', status: 'pending' }]);
  const insertValues = jest.fn().mockReturnValue({ returning: insertReturning });
  const insert = jest.fn().mockReturnValue({ values: insertValues });
  const updateSet = jest.fn().mockReturnValue({});
  const update = jest.fn().mockReturnValue({ set: updateSet, where: jest.fn() });
  const deleteWhere = jest.fn().mockReturnValue({});
  const del = jest.fn().mockReturnValue({ where: deleteWhere });
  return {
    select: selectChain.select,
    insert,
    update,
    delete: del,
  } as unknown as DbType;
}

function createMockUserService(): jest.Mocked<UserService> {
  return {
    deductEnergy: jest.fn(),
  } as unknown as jest.Mocked<UserService>;
}

function createMockQueueService(): CreationQueueService {
  return {
    enqueueCreation: jest.fn().mockResolvedValue('mock-job-id'),
    getQueueStats: jest
      .fn()
      .mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }),
    onModuleDestroy: jest.fn(),
  } as unknown as CreationQueueService;
}

describe('CreationService — T2.1', () => {
  let db: DbType;
  let userService: jest.Mocked<UserService>;
  let queueService: CreationQueueService;
  let service: CreationService;

  const validDto: CreateCreationDto = {
    mode: 'text',
    agentMode: false,
    prompt: '一键三连是什么梗',
    style: undefined,
    templateId: undefined,
  };

  beforeEach(() => {
    db = createMockDb();
    userService = createMockUserService();
    queueService = createMockQueueService();
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
      }),
    });
    service = new CreationService(db, userService, queueService);
  });

  describe('start — 能量扣减乐观锁', () => {
    it('能量充足时成功创建', async () => {
      userService.deductEnergy.mockResolvedValue(true);

      const result = await service.start('user-1', validDto);

      expect(userService.deductEnergy).toHaveBeenCalledWith('user-1', 1);
      expect(result).toEqual({ creationId: 'creation-001', status: 'pending' });
    });

    it('能量不足抛出 BadRequestException', async () => {
      userService.deductEnergy.mockResolvedValue(false);

      await expect(service.start('user-1', validDto)).rejects.toThrow(BadRequestException);
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('Agent 模式扣减 ENERGY_COST_AGENT=3', async () => {
      userService.deductEnergy.mockResolvedValue(true);

      await service.start('user-1', { ...validDto, agentMode: true });

      expect(userService.deductEnergy).toHaveBeenCalledWith('user-1', 3);
    });

    it('图片模式扣减 ENERGY_COST_IMAGE=5', async () => {
      userService.deductEnergy.mockResolvedValue(true);

      await service.start('user-1', { ...validDto, mode: 'image' });

      expect(userService.deductEnergy).toHaveBeenCalledWith('user-1', 5);
    });
  });

  describe('并发扣减不超扣（乐观锁语义）', () => {
    it('20 并发仅 5 个扣减成功（能量=5），其余抛 BadRequestException', async () => {
      // 模拟能量=5，只允许 5 次扣减成功
      let remaining = 5;
      userService.deductEnergy.mockImplementation(async () => {
        if (remaining > 0) {
          remaining -= 1;
          return true;
        }
        return false;
      });

      const results = await Promise.allSettled(
        Array.from({ length: 20 }, () => service.start('user-1', { ...validDto, mode: 'image' })),
      );

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(5);
      expect(rejected.length).toBe(15);
      expect(userService.deductEnergy).toHaveBeenCalledTimes(20);
    });
  });

  describe('24h prompt 去重', () => {
    it('命中 24h 内同 prompt+style 直接返回已有', async () => {
      // 让 select 命中一条记录
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ creationId: 'existing-001' }]),
          }),
        }),
      });

      // getStatus 在命中去重路径里被调用，模拟返回
      jest.spyOn(service, 'getStatus').mockResolvedValueOnce({
        creationId: 'existing-001',
        status: 'ready',
        candidates: [],
      } as never);

      const result = await service.start('user-1', validDto);

      expect(result).toEqual({
        creationId: 'existing-001',
        status: 'ready',
        candidates: [],
      });
      expect(userService.deductEnergy).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('chooseCandidate', () => {
    it('idx 范围外抛 BadRequestException', async () => {
      await expect(service.chooseCandidate('user-1', 'creation-001', 3)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('造梗记录不存在抛 NotFoundException', async () => {
      // select 返回空
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.chooseCandidate('user-1', 'creation-001', 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('regenerate', () => {
    it('记录不存在抛 NotFoundException', async () => {
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.regenerate('user-1', 'creation-001')).rejects.toThrow(NotFoundException);
    });
  });
});
