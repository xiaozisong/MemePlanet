import { Injectable, Logger } from '@nestjs/common';
import type { VideoAdapter } from './interfaces.js';
import type { VideoRequest, VideoTaskHandle, VideoResult, ProviderHealth, CostEstimate } from '../interfaces.js';

/**
 * 字节火山方舟 豆包 Seedance 2.0 Video Adapter（MVP 主力）
 * - mini 档：~¥0.3-0.5/秒（5s≈¥1.5-2.5）
 * - 标准档：~¥1/秒（Pro 高端）
 * 文档：https://www.volcengine.com/docs/6791/
 */
@Injectable()
export class DoubaoAdapter implements VideoAdapter {
  readonly name = 'volcano';
  readonly model = 'seedance-2-mini';
  readonly pricePerSecond = 0.4;
  private readonly logger = new Logger(DoubaoAdapter.name);

  constructor(
    private readonly apiKey: string | undefined,
    private readonly appId: string | undefined,
  ) {}

  async submit(req: VideoRequest): Promise<VideoTaskHandle> {
    if (!this.apiKey) throw new Error('VOLCANO_API_KEY missing');
    // TODO: 调火山方舟提交任务，记录 external_task_id + webhook_secret
    this.logger.log(`doubao submit: type=${req.sourceType} dur=${req.duration} tier=${req.tier ?? 'mini'}`);
    void this.appId;
    return { taskId: 'placeholder', status: 'queued' };
  }

  async poll(taskId: string): Promise<VideoResult> {
    // TODO: 轮询任务状态
    this.logger.log(`doubao poll ${taskId}`);
    return {
      videoUrl: '',
      coverUrl: '',
      duration: 5,
      isFallback: false,
      externalTaskId: taskId,
    };
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: !!this.apiKey, errorRate: 0, avgLatencyMs: 0 };
  }

  estimateCost(seconds: number): CostEstimate {
    return { costCents: Math.round(this.pricePerSecond * seconds * 100), currency: 'CNY' };
  }
}
