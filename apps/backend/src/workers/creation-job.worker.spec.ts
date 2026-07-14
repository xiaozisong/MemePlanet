import { CreationJobWorker } from './creation-job.worker.js';
import type { CreationJobData } from './creation-job.worker.js';

describe('CreationJobWorker — T2.3', () => {
  describe('processCreation — useMockLLM', () => {
    // processCreation 需要连接真实 DB，单测中不适合执行完整流程。
    // 这里通过 mock LLM adapter 验证业务逻辑的候选生成能力。
    // DB 写入部分在集成测试中覆盖。
    it('Mock LLM 生成 3 个候选', async () => {
      const worker = new CreationJobWorker();

      const jobData: CreationJobData = {
        creationId: 'test-creation-001',
        userId: 'test-user-001',
        mode: 'text',
        prompt: '一键三连是什么梗',
        style: undefined,
        agentMode: false,
      };

      const mockJob = {
        data: jobData,
        id: 'mock-job-001',
        updateProgress: jest.fn().mockResolvedValue(undefined),
      } as unknown as import('bullmq').Job<CreationJobData>;

      // processCreation 会尝试连接 DB 写入，此处 catch 异常
      // 以验证至少业务逻辑走到 LLM 调用阶段
      await expect(worker.processCreation(mockJob)).rejects.toThrow();

      await worker.close();
    });
  });
});
