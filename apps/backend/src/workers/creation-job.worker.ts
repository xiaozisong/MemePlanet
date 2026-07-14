import { Logger } from '@nestjs/common';
import { Worker, QueueEvents, Job } from 'bullmq';
import { CREATION_QUEUE_NAME, CREATION_WORKER_CONFIG, QUEUE_CONNECTION } from './queue-config.js';

export interface CreationJobData {
  creationId: string;
  userId: string;
  mode: string;
  prompt: string;
  style?: string;
  templateId?: string;
  agentMode: boolean;
}

export type CreationJobResult = {
  candidates: Array<{
    idx: number;
    content: string;
    selfScore?: number;
    selfReason?: string;
  }>;
};

/**
 * 造梗 Job Worker
 *
 * 消费 creation_jobs 队列：
 * 1. 接收 CreationJobData（由 CreationService 入队）
 * 2. 调用 LLM 生成 3 候选（当前骨架，T2.3 实现真实 LLM 调用）
 * 3. 写入 creation_candidates 表
 * 4. 更新 creations.status = 'ready'
 * 5. 失败时更新 creations.status = 'failed'
 */
export class CreationJobWorker {
  private readonly logger = new Logger(CreationJobWorker.name);
  private readonly worker: Worker;
  private readonly events: QueueEvents;

  constructor() {
    this.worker = new Worker<CreationJobData, CreationJobResult>(
      CREATION_QUEUE_NAME,
      async (job: Job<CreationJobData>) => {
        this.logger.log(`▶ creation job ${job.id} creation=${job.data.creationId}`);
        return this.processCreation(job);
      },
      {
        connection: QUEUE_CONNECTION,
        concurrency: CREATION_WORKER_CONFIG.concurrency,
        // 单个 Job 超时 60s
        lockDuration: CREATION_WORKER_CONFIG.timeout,
      },
    );

    this.events = new QueueEvents(CREATION_QUEUE_NAME, {
      connection: QUEUE_CONNECTION,
    });

    this.events.on('failed', ({ jobId, failedReason }) =>
      this.logger.error(`creation job ${jobId} failed: ${failedReason}`),
    );

    this.events.on('completed', ({ jobId, returnvalue }) =>
      this.logger.log(`creation job ${jobId} completed: ${JSON.stringify(returnvalue)}`),
    );

    this.worker.on('error', (err) => {
      this.logger.error(`creation worker error: ${err.message}`);
    });
  }

  /**
   * 处理造梗任务
   *
   * 骨架阶段：返回 mock 候选。
   * T2.3 将替换为真实 LLM 调用：prompt 组装 + 3 候选生成 + 自评打分。
   */
  async processCreation(job: Job<CreationJobData>): Promise<CreationJobResult> {
    const { creationId, prompt, style, mode } = job.data;

    // 更新进度
    await job.updateProgress(10);

    // TODO(T2.3): 真实 LLM 调用 — 组装 prompt → 调用 DeepSeek → 解析 3 候选
    // 当前阶段返回 mock 候选用于流程验证
    const candidates = [
      {
        idx: 0,
        content: `${prompt}${style ? `（${style}风格版本A）` : '（版本A）'}`,
        selfScore: 7.5,
        selfReason: '表达清晰，梗点突出',
      },
      {
        idx: 1,
        content: `${prompt}${style ? `（${style}风格版本B）` : '（版本B）'}`,
        selfScore: 8.0,
        selfReason: '创意丰富，容易传播',
      },
      {
        idx: 2,
        content: `${prompt}${style ? `（${style}风格版本C）` : '（版本C）'}`,
        selfScore: 6.5,
        selfReason: '直白易懂，但稍显平淡',
      },
    ];

    await job.updateProgress(50);

    // TODO(T2.3): 写入 creation_candidates 表 + 更新 creations.status = 'ready'
    this.logger.log(`creation ${creationId} processed — 3 candidates generated (mode=${mode})`);

    await job.updateProgress(100);

    return { candidates };
  }

  async close(): Promise<void> {
    await this.worker.close();
    this.events.close();
  }
}
