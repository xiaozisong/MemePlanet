import { Logger } from '@nestjs/common';
import { Worker, QueueEvents } from 'bullmq';

/**
 * 视频生成 Job Worker
 * - 豆包 Seedance 2.0 mini 主力 / 标准档 Pro 高端
 * - SiliconFlow/即梦 fallback
 * - 图片+TTS+Ken Burns 兜底（ffmpeg）
 * 对齐 TechnicalDesign §4.7 / §7.2
 */
export class VideoJobWorker {
  private readonly logger = new Logger(VideoJobWorker.name);
  private readonly worker: Worker;

  constructor() {
    this.worker = new Worker(
      'video_jobs',
      async (job) => {
        this.logger.log(`▶ video job ${job.id}`);
        // TODO: 1) submit to provider 2) poll/webhook 3) ffmpeg 烧录水印/字幕
        //       4) 上传 R2 5) 入审核队列
        return { ok: true };
      },
      {
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      },
    );

    const events = new QueueEvents('video_jobs', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    });
    events.on('failed', ({ jobId, failedReason }) =>
      this.logger.error(`video job ${jobId} failed: ${failedReason}`),
    );
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
