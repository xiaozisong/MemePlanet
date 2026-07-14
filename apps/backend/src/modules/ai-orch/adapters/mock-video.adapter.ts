import type {
  VideoRequest,
  VideoTaskHandle,
  VideoResult,
  ProviderHealth,
  CostEstimate,
} from '../interfaces.js';
import type { VideoAdapter } from './interfaces.js';

/**
 * 视频生成 Mock Adapter — T1.9
 */
export class MockVideoAdapter implements VideoAdapter {
  readonly name: string;
  readonly model = 'mock-video';
  readonly pricePerSecond = 0.1;

  private taskIdCounter = 0;

  constructor(name = 'mock-video') {
    this.name = name;
  }

  async submit(_req: VideoRequest): Promise<VideoTaskHandle> {
    this.taskIdCounter += 1;
    return { taskId: `mock-task-${this.taskIdCounter}`, status: 'queued' };
  }

  async poll(taskId: string): Promise<VideoResult> {
    return {
      videoUrl: `https://cdn.example.com/mock/${taskId}.mp4`,
      coverUrl: `https://cdn.example.com/mock/${taskId}.jpg`,
      duration: 10,
      isFallback: false,
      externalTaskId: taskId,
    };
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: true, errorRate: 0, avgLatencyMs: 20 };
  }

  estimateCost(seconds: number): CostEstimate {
    return { costCents: Math.round(seconds * this.pricePerSecond * 100), currency: 'CNY' };
  }
}
