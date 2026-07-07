import { Injectable, Logger } from '@nestjs/common';
import type { LLMAdapter } from './interfaces.js';
import type { ChatRequest, ChatResponse, ProviderHealth, CostEstimate } from '../interfaces.js';

/**
 * 智谱 GLM-4-Flash LLM Adapter（兜底，免费）
 * 文档：https://open.bigmodel.cn/
 */
@Injectable()
export class GlmAdapter implements LLMAdapter {
  readonly name = 'glm';
  readonly model = 'glm-4-flash';
  readonly pricePerMTokens = { input: 0, output: 0 };
  private readonly logger = new Logger(GlmAdapter.name);

  constructor(
    private readonly apiKey: string | undefined,
    private readonly baseUrl = 'https://open.bigmodel.cn/api/paas/v4',
  ) {}

  async chat(req: ChatRequest): Promise<ChatResponse> {
    if (!this.apiKey) throw new Error('GLM_API_KEY missing');
    this.logger.log(`glm chat: ${req.messages.length} msgs`);
    void this.baseUrl;
    return {
      content: 'TODO: glm response',
      tokensIn: 0,
      tokensOut: 0,
      finishReason: 'stop',
      model: this.model,
    };
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: !!this.apiKey, errorRate: 0, avgLatencyMs: 0 };
  }

  estimateCost(_tokensIn: number, _tokensOut: number): CostEstimate {
    return { costCents: 0, currency: 'CNY' };
  }
}
