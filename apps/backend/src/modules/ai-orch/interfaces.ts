// AI 编排层统一抽象接口，对齐 TechnicalDesign §8.1

export interface ChatRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  /** 是否启用 function calling */
  tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>;
  /** 流式回调 */
  onToken?: (delta: string) => void;
}

export interface ChatResponse {
  content: string;
  tokensIn: number;
  tokensOut: number;
  finishReason: 'stop' | 'length' | 'tool_call' | 'error';
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  model: string;
}

export interface ImageRequest {
  prompt: string;
  /** 1-3 候选；MVP 默认 1，用户主动"再来一次" */
  count: 1 | 2 | 3;
  width?: number;
  height?: number;
  style?: string;
}

export interface ImageResult {
  imageUrl: string;
  width: number;
  height: number;
  seed?: number;
}

export interface VideoRequest {
  prompt?: string;
  /** 文生视频/图生视频/兜底图片TTS */
  sourceType: 'text_to_video' | 'image_to_video' | 'fallback_image_tts';
  /** 图生视频的输入图片 URL */
  imageUrl?: string;
  duration: 5 | 10 | 15;
  /** 模型档位 */
  tier?: 'mini' | 'standard';
}

export interface VideoResult {
  videoUrl: string;
  coverUrl: string;
  duration: number;
  isFallback: boolean;
  externalTaskId?: string;
}

export interface VideoTaskHandle {
  taskId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
}

export interface TTSRequest {
  text: string;
  voiceId: string;
  speed?: number;
}

export interface TTSResult {
  audioUrl: string;
  durationMs: number;
}

export interface ProviderHealth {
  name: string;
  healthy: boolean;
  errorRate: number;
  avgLatencyMs: number;
}

export interface CostEstimate {
  costCents: number;
  currency: 'CNY';
}
