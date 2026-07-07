import { Injectable, Logger } from '@nestjs/common';
import type { ImageAdapter } from './interfaces.js';
import type { ImageRequest, ImageResult, ProviderHealth, CostEstimate } from '../interfaces.js';

/**
 * SiliconFlow FLUX.1-schnell Image Adapter（MVP 主力）
 * 价格：¥0.12/张
 * 文档：https://docs.siliconflow.cn/
 */
@Injectable()
export class SiliconFlowAdapter implements ImageAdapter {
  readonly name = 'siliconflow';
  readonly model = 'black-forest-labs/FLUX.1-schnell';
  readonly pricePerImage = 0.12;
  private readonly logger = new Logger(SiliconFlowAdapter.name);

  constructor(
    private readonly apiKey: string | undefined,
    private readonly baseUrl = 'https://api.siliconflow.cn/v1',
  ) {}

  async generate(req: ImageRequest): Promise<ImageResult[]> {
    if (!this.apiKey) throw new Error('SILICONFLOW_API_KEY missing');
    // TODO: 调 /images/generations，上传到 R2，返回 cdn_url
    this.logger.log(`siliconflow generate: ${req.prompt} count=${req.count}`);
    void this.baseUrl;
    return [];
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: !!this.apiKey, errorRate: 0, avgLatencyMs: 0 };
  }

  estimateCost(images: number): CostEstimate {
    return { costCents: Math.round(this.pricePerImage * images * 100), currency: 'CNY' };
  }
}
