import { Logger } from '@nestjs/common';
import { Worker, QueueEvents } from 'bullmq';
import { AGENT_STEPS } from '@memestar/shared';

/**
 * Pro 造梗 Agent Job Worker
 * 3 步精简版：RAG 检索 → 3 候选生成 → 自评选优
 * 对齐 TechnicalDesign §8.6.2 / M1-Sprint-Plan AIO/CRE 任务
 */
export class AgentJobWorker {
  private readonly logger = new Logger(AgentJobWorker.name);
  private readonly worker: Worker;

  constructor() {
    // TODO: 共享 Redis 连接，与 backend 同实例
    this.worker = new Worker(
      'agent_jobs',
      async (job) => {
        this.logger.log(`▶ agent job ${job.id} step=${job.data.step ?? 'start'}`);
        // TODO: 实际 3 步流程
        //   1) RAG: pgvector 检索神梗 top5 作为 few-shot
        //   2) Generate: DeepSeek V3 生成 3 候选
        //   3) Self-Score: 结构化输出打分选最优
        //   失败降级：单次 prompt 模式返回 3 候选 + 退能量
        const step = (job.data.step as keyof typeof AGENT_STEPS | undefined) ?? AGENT_STEPS.GENERATE;
        this.logger.log(`  - 处理 ${step}`);
        return { ok: true };
      },
      { connection: { host: process.env.REDIS_HOST ?? 'localhost', port: Number(process.env.REDIS_PORT ?? 6379) } },
    );

    const events = new QueueEvents('agent_jobs', {
      connection: { host: process.env.REDIS_HOST ?? 'localhost', port: Number(process.env.REDIS_PORT ?? 6379) },
    });
    events.on('failed', ({ jobId, failedReason }) =>
      this.logger.error(`agent job ${jobId} failed: ${failedReason}`),
    );
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
