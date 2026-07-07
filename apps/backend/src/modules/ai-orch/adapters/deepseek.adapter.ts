import { Injectable, Logger } from '@nestjs/common';
import type { LLMAdapter } from './interfaces.js';
import type { ChatRequest, ChatResponse, ProviderHealth, CostEstimate } from '../interfaces.js';

/**
 * DeepSeek V3 LLM Adapter（MVP 主力）
 * 价格：¥1/M 输入，¥2/M 输出（缓存命中 ¥0.1）
 * 文档：https://api-docs.deepseek.com/
 */
@Injectable()
export class DeepSeekAdapter implements LLMAdapter {
  readonly name = 'deepseek';
  readonly model = 'deepseek-chat';
  readonly pricePerMTokens = { input: 1, output: 2 };
  private readonly logger = new Logger(DeepSeekAdapter.name);

  constructor(
    private readonly apiKey: string | undefined,
    private readonly baseUrl = 'https://api.deepseek.com',
  ) {}

  async chat(req: ChatRequest): Promise<ChatResponse> {
    if (!this.apiKey) throw new Error('DEEPSEEK_API_KEY missing');
    // TODO: 调用 /v1/chat/completions
    this.logger.log(`deepseek chat: ${req.messages.length} msgs`);
    void this.baseUrl;
    return {
      content: 'TODO: deepseek response',
      tokensIn: 0,
      tokensOut: 0,
      finishReason: 'stop',
      model: this.model,
    };
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: !!this.apiKey, errorRate: 0, avgLatencyMs: 0 };
  }

  estimateCost(tokensIn: number, tokensOut: number): CostEstimate {
    const yuan = (tokensIn / 1_000_000) * this.pricePerMTokens.input +
      (tokensOut / 1_000_000) * this.pricePerMTokens.output;
    return { costCents: Math.round(yuan * 100), currency: 'CNY' };
  }
}
