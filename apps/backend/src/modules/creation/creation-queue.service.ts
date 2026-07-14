import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import {
  CREATION_QUEUE_NAME,
  CREATION_JOB_CONFIG,
  QUEUE_CONNECTION,
} from '../../workers/queue-config.js';
import type { CreationJobData } from '../../workers/creation-job.worker.js';

@Injectable()
export class CreationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(CreationQueueService.name);
  private readonly queue: Queue<CreationJobData>;
  private readonly events: QueueEvents;

  constructor() {
    this.queue = new Queue<CreationJobData>(CREATION_QUEUE_NAME, {
      connection: QUEUE_CONNECTION,
      defaultJobOptions: CREATION_JOB_CONFIG,
    });

    this.events = new QueueEvents(CREATION_QUEUE_NAME, {
      connection: QUEUE_CONNECTION,
    });

    this.events.on('failed', ({ jobId, failedReason }) =>
      this.logger.warn(`job ${jobId} failed: ${failedReason}`),
    );

    this.logger.log(`BullMQ queue "${CREATION_QUEUE_NAME}" initialized`);
  }

  /**
   * 入队造梗任务
   *
   * @param creationId 刚刚 INSERT 的 creation_id
   * @param userId 用户 ID
   * @param data 任务数据
   * @param priority Job 优先级（越小越优先，Pro 用户用低值）
   */
  async enqueueCreation(
    creationId: string,
    userId: string,
    data: {
      mode: string;
      prompt: string;
      style?: string;
      templateId?: string;
      agentMode: boolean;
    },
    priority = 10,
  ): Promise<string> {
    const job = await this.queue.add(
      `creation:${creationId}`,
      {
        creationId,
        userId,
        mode: data.mode,
        prompt: data.prompt,
        style: data.style,
        templateId: data.templateId,
        agentMode: data.agentMode,
      },
      {
        priority,
        jobId: `creation:${creationId}`, // 幂等 jobId 防重复入队
      },
    );

    this.logger.log(
      `enqueued creation job creationId=${creationId} mode=${data.mode} priority=${priority} jobId=${job.id}`,
    );
    return job.id ?? '';
  }

  /** 等待队列清空并关闭连接 */
  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    this.events.close();
    this.logger.log('BullMQ queue closed');
  }

  /** 获取队列统计数据 */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
  }
}
