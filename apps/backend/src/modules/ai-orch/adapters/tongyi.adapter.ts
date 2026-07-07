import { Injectable, Logger } from '@nestjs/common';
import type { ImageAdapter } from './interfaces.js';
import type { ImageRequest, ImageResult, ProviderHealth, CostEstimate } from '../interfaces.js';

/**
 * 通义万相 Image Adapter（兜底）
 * 价格：¥0.16/张，新用户 500 张免费额度
 */
@Injectable()
export class TongyiAdapter implements ImageAdapter {
  readonly name = 'tongyi';
  readonly model = 'wanx-v1';
  readonly pricePerImage = 0.16;
  private readonly logger = new Logger(TongyiAdapter.name);

  constructor(private readonly apiKey: string | undefined) {}

  async generate(req: ImageRequest): Promise<ImageResult[]> {
    if (!this.apiKey) throw new Error('TONGYI_API_KEY missing');
    this.logger.log(`tongyi generate: ${req.prompt} count=${req.count}`);
    return [];
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: !!this.apiKey, errorRate: 0, avgLatencyMs: 0 };
  }

  estimateCost(images: number): CostEstimate {
    return { costCents: Math.round(this.pricePerImage * images * 100), currency: 'CNY' };
  }
}
