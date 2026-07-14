import type { TTSRequest, TTSResult, ProviderHealth, CostEstimate } from '../interfaces.js';
import type { TTSAdapter } from './interfaces.js';

/**
 * TTS Mock Adapter — T1.9
 */
export class MockTTSAdapter implements TTSAdapter {
  readonly name: string;
  readonly model = 'mock-tts';
  readonly pricePer1kChars = 0.02;

  constructor(name = 'mock-tts') {
    this.name = name;
  }

  async synthesize(_req: TTSRequest): Promise<TTSResult> {
    return {
      audioUrl: 'https://cdn.example.com/mock/tts.mp3',
      durationMs: 3000,
    };
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: true, errorRate: 0, avgLatencyMs: 5 };
  }

  estimateCost(chars: number): CostEstimate {
    return { costCents: Math.round((chars / 1000) * this.pricePer1kChars * 100), currency: 'CNY' };
  }
}
