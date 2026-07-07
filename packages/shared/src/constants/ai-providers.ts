export const AI_PROVIDER = {
  DEEPSEEK: 'deepseek',
  GLM: 'glm',
  QWEN: 'qwen',
  SILICONFLOW: 'siliconflow',
  TONGYI: 'tongyi',
  VOLCANO: 'volcano',
  JIMENG: 'jimeng',
  ALIYUN_AUDIT: 'aliyun_audit',
} as const;

export type AiProviderName = (typeof AI_PROVIDER)[keyof typeof AI_PROVIDER];

export const LLM_DEFAULT_CHAIN: ReadonlyArray<AiProviderName> = [
  AI_PROVIDER.DEEPSEEK,
  AI_PROVIDER.GLM,
  AI_PROVIDER.QWEN,
];

export const IMAGE_DEFAULT_CHAIN: ReadonlyArray<AiProviderName> = [
  AI_PROVIDER.SILICONFLOW,
  AI_PROVIDER.TONGYI,
];

export const VIDEO_DEFAULT_CHAIN: ReadonlyArray<AiProviderName> = [
  AI_PROVIDER.VOLCANO,
  AI_PROVIDER.SILICONFLOW,
  AI_PROVIDER.JIMENG,
];

export const POLICY = {
  CIRCUIT_ERROR_RATE_THRESHOLD: 0.3,
  CIRCUIT_OPEN_DURATION_MS: 5 * 60_000,
  DAILY_BUDGET_SOFT_LIMIT_CENTS: 10000,
  DAILY_BUDGET_HARD_LIMIT_CENTS: 20000,
  PROMPT_CACHE_TTL_SEC: 24 * 3600,
} as const;
