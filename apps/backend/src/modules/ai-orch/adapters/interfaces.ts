import type { ChatRequest, ChatResponse, ProviderHealth, CostEstimate } from '../interfaces.js';

export interface LLMAdapter {
  readonly name: string;
  readonly model: string;
  /** 输入/输出单价（元/百万 tokens） */
  readonly pricePerMTokens: { input: number; output: number };
  chat(req: ChatRequest): Promise<ChatResponse>;
  health(): Promise<ProviderHealth>;
  estimateCost(tokensIn: number, tokensOut: number): CostEstimate;
}

export interface ImageAdapter {
  readonly name: string;
  readonly model: string;
  readonly pricePerImage: number; // 元/张
  generate(req: import('../interfaces.js').ImageRequest): Promise<import('../interfaces.js').ImageResult[]>;
  health(): Promise<ProviderHealth>;
  estimateCost(images: number): CostEstimate;
}

export interface VideoAdapter {
  readonly name: string;
  readonly model: string;
  readonly pricePerSecond: number; // 元/秒
  submit(req: import('../interfaces.js').VideoRequest): Promise<import('../interfaces.js').VideoTaskHandle>;
  poll(taskId: string): Promise<import('../interfaces.js').VideoResult>;
  health(): Promise<ProviderHealth>;
  estimateCost(seconds: number): CostEstimate;
}

export interface TTSAdapter {
  readonly name: string;
  readonly model: string;
  readonly pricePer1kChars: number;
  synthesize(req: import('../interfaces.js').TTSRequest): Promise<import('../interfaces.js').TTSResult>;
  health(): Promise<ProviderHealth>;
  estimateCost(chars: number): CostEstimate;
}
