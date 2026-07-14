import type { ChatRequest, ChatResponse, ProviderHealth, CostEstimate } from '../interfaces.js';
import type { LLMAdapter } from './interfaces.js';

/**
 * LLM Mock Adapter — T1.9
 * 用于单元测试，不依赖真实 API key。
 */
export class MockLLMAdapter implements LLMAdapter {
  readonly name: string;
  readonly model = 'mock-llm';
  readonly pricePerMTokens = { input: 1, output: 2 };

  private readonly response: string;

  constructor(name = 'mock-llm', response = 'Mock LLM response') {
    this.name = name;
    this.response = response;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    return {
      content: this.response,
      tokensIn: 50,
      tokensOut: 30,
      finishReason: 'stop',
      model: this.model,
      toolCalls: req.tools ? [] : undefined,
    };
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: true, errorRate: 0, avgLatencyMs: 5 };
  }

  estimateCost(tokensIn: number, tokensOut: number): CostEstimate {
    const yuan =
      (tokensIn / 1_000_000) * this.pricePerMTokens.input +
      (tokensOut / 1_000_000) * this.pricePerMTokens.output;
    return { costCents: Math.round(yuan * 100), currency: 'CNY' };
  }
}

/**
 * 会抛错的 Mock LLM — 用于测试降级链路
 */
export class FailLLMAdapter implements LLMAdapter {
  readonly name: string;
  readonly model = 'fail-llm';
  readonly pricePerMTokens = { input: 1, output: 2 };
  private readonly errMsg: string;

  constructor(name = 'fail-llm', errMsg = 'provider unavailable') {
    this.name = name;
    this.errMsg = errMsg;
  }

  async chat(): Promise<ChatResponse> {
    throw new Error(this.errMsg);
  }

  async health(): Promise<ProviderHealth> {
    return { name: this.name, healthy: false, errorRate: 1, avgLatencyMs: 0 };
  }

  estimateCost(): CostEstimate {
    return { costCents: 0, currency: 'CNY' };
  }
}
