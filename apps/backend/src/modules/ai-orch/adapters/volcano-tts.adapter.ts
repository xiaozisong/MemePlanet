import { Injectable, Logger } from '@nestjs/common';
import type { TTSAdapter } from './interfaces.js';
import type { TTSRequest, TTSResult, ProviderHealth, CostEstimate } from '../interfaces.js';

/**
 * 火山引擎 TTS Adapter
 * 4 种音色，按字符计费极低
 */
@Injectable()
export class VolcanoTTSAdapter implements TTSAdapter {
  readonly name = 'volcano_tts';
  readonly model = 'volcano-tts';
  readonly pricePer1kChars = 0.01;
  private readonly logger = new Logger(VolcanoTTSAdapter.name);

  constructor(
    private readonly appId: string | undefined,
    private readonly token: string | undefined,
    private readonly cluster = 'volcano_tts',
  ) {}

  async synthesize(req: TTSRequest): Promise<TTSResult> {
    if (!this.appId || !this.token) throw new Error('VOLCANO_TTS_APPID/TOKEN missing');
    // TODO: 调用 HTTP TTS API
    this.logger.log(`tts: voice=${req.voiceId} chars=${req.text.length}`);
    void this.cluster;
    return { audioUrl: '', durationMs: 0 };
  }

  async health(): Promise<ProviderHealth> {
    return {
      name: this.name,
      healthy: !!(this.appId && this.token),
      errorRate: 0,
      avgLatencyMs: 0,
    };
  }

  estimateCost(chars: number): CostEstimate {
    return { costCents: Math.round((chars / 1000) * this.pricePer1kChars * 100), currency: 'CNY' };
  }
}
