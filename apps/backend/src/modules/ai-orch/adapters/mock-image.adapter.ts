import type { ImageRequest, ImageResult, ProviderHealth, CostEstimate } from '../interfaces.js';
import type { ImageAdapter } from './interfaces.js';

/**
 * 图像生成 Mock Adapter — T1.9
 */
export class MockImageAdapter implements ImageAdapter {
  readonly name: string;
  readonly model = 'mock-image';
  readonly pricePerImage = 0.01;

  constructor(name = 'mock-image') {
    this.name = name;
  }

  async generate(req: ImageRequest): Promise<ImageResult[]> {
    return Array.from({ length: req.count }, (_, i) => ({
      imageUrl: `https://cdn.example.com/mock/${this.name}/${i}.png`,
      width: req.width ?? 1024,
      height: req.height ?? 1024,
      seed: i,
    }));
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: true, errorRate: 0, avgLatencyMs: 10 };
  }

  estimateCost(images: number): CostEstimate {
    return { costCents: Math.round(images * this.pricePerImage * 100), currency: 'CNY' };
  }
}
