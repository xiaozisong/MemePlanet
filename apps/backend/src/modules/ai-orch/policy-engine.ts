import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeepSeekAdapter,
  GlmAdapter,
  SiliconFlowAdapter,
  TongyiAdapter,
  DoubaoAdapter,
  VolcanoTTSAdapter,
} from './adapters/index.js';
import type { LLMAdapter, ImageAdapter, VideoAdapter, TTSAdapter } from './adapters/interfaces.js';
import { AI_PROVIDER, POLICY } from '@memestar/shared';

interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  appId?: string;
  tts?: { appId?: string; token?: string; cluster?: string };
}
interface AIConfig {
  deepseek?: AIProviderConfig;
  glm?: AIProviderConfig;
  siliconflow?: AIProviderConfig;
  tongyi?: AIProviderConfig;
  volcano?: AIProviderConfig;
}

interface ProviderState {
  errorCount: number;
  successCount: number;
  circuitOpenUntil: number;
  lastErrorAt?: number;
}

/**
 * Policy Engine：降级 / 熔断 / 限流 / 成本追踪
 * 对齐 TechnicalDesign §8.1
 */
@Injectable()
export class PolicyEngine {
  private readonly logger = new Logger(PolicyEngine.name);
  private readonly states = new Map<string, ProviderState>();
  private readonly dailySpendCents = new Map<string, number>(); // key=provider+date
  private readonly llmChain: LLMAdapter[];
  private readonly imageChain: ImageAdapter[];
  private readonly videoChain: VideoAdapter[];
  private readonly tts: TTSAdapter | undefined;

  constructor(config: ConfigService) {
    const ai = config.get<AIConfig>('ai');
    const deepseekKey = ai?.deepseek?.apiKey;
    const glmKey = ai?.glm?.apiKey;
    const sfKey = ai?.siliconflow?.apiKey;
    const tongyiKey = ai?.tongyi?.apiKey;
    const volKey = ai?.volcano?.apiKey;
    const volAppId = ai?.volcano?.appId;
    const ttsAppId = ai?.volcano?.tts?.appId;
    const ttsToken = ai?.volcano?.tts?.token;

    this.llmChain = [
      new DeepSeekAdapter(deepseekKey, ai?.deepseek?.baseUrl),
      new GlmAdapter(glmKey, ai?.glm?.baseUrl),
    ];
    this.imageChain = [
      new SiliconFlowAdapter(sfKey, ai?.siliconflow?.baseUrl),
      new TongyiAdapter(tongyiKey),
    ];
    this.videoChain = [new DoubaoAdapter(volKey, volAppId)];
    if (ttsAppId && ttsToken) {
      this.tts = new VolcanoTTSAdapter(ttsAppId, ttsToken, ai?.volcano?.tts?.cluster);
    }
  }

  /** 按链路降级执行 LLM 调用 */
  async chat(req: Parameters<LLMAdapter['chat']>[0]): Promise<ReturnType<LLMAdapter['chat']>> {
    return this.runChain(this.llmChain, (p) => p.chat(req), AI_PROVIDER.DEEPSEEK);
  }

  async generateImage(req: Parameters<ImageAdapter['generate']>[0]) {
    return this.runChain(this.imageChain, (p) => p.generate(req), AI_PROVIDER.SILICONFLOW);
  }

  async submitVideo(req: Parameters<VideoAdapter['submit']>[0]) {
    return this.runChain(this.videoChain, (p) => p.submit(req), AI_PROVIDER.VOLCANO);
  }

  getTTS(): TTSAdapter | undefined {
    return this.tts;
  }

  // ---- 熔断 / 限流 ----

  private isCircuitOpen(name: string): boolean {
    const s = this.states.get(name);
    if (!s) return false;
    if (s.circuitOpenUntil > Date.now()) return true;
    if (s.circuitOpenUntil && s.circuitOpenUntil <= Date.now()) {
      // half-open：清零重新尝试
      s.errorCount = 0;
      s.successCount = 0;
      s.circuitOpenUntil = 0;
    }
    return false;
  }

  private recordSuccess(name: string): void {
    const s = this.states.get(name) ?? this.fresh(name);
    s.successCount += 1;
    this.states.set(name, s);
  }

  private recordError(name: string): void {
    const s = this.states.get(name) ?? this.fresh(name);
    s.errorCount += 1;
    s.lastErrorAt = Date.now();
    const total = s.errorCount + s.successCount;
    if (total >= 10 && s.errorCount / total > POLICY.CIRCUIT_ERROR_RATE_THRESHOLD) {
      s.circuitOpenUntil = Date.now() + POLICY.CIRCUIT_OPEN_DURATION_MS;
      this.logger.warn(
        `⚡ 熔断触发: ${name} 错误率=${(s.errorCount / total).toFixed(2)}，开放 5min`,
      );
    }
    this.states.set(name, s);
  }

  private fresh(_name: string): ProviderState {
    return { errorCount: 0, successCount: 0, circuitOpenUntil: 0 };
  }

  private async runChain<T, P extends { name: string }>(
    chain: ReadonlyArray<P>,
    call: (provider: P) => Promise<T>,
    primaryName: string,
  ): Promise<T> {
    let lastErr: unknown;
    for (const provider of chain) {
      if (this.isCircuitOpen(provider.name)) {
        this.logger.warn(`跳过熔断中的 ${provider.name}`);
        continue;
      }
      try {
        const result = await call(provider);
        this.recordSuccess(provider.name);
        return result;
      } catch (err) {
        lastErr = err;
        this.recordError(provider.name);
        this.logger.warn(`${provider.name} 调用失败，降级到下一个 provider`);
      }
    }
    throw new Error(`所有 provider 不可用，primary=${primaryName}, lastError=${String(lastErr)}`);
  }

  // ---- 成本追踪 / 日预算熔断 ----

  recordCost(provider: string, costCents: number): void {
    const key = `${provider}:${new Date().toISOString().slice(0, 10)}`;
    this.dailySpendCents.set(key, (this.dailySpendCents.get(key) ?? 0) + costCents);
  }

  isDailyBudgetExceeded(scope: 'total' | 'agent' | 'video'): boolean {
    const today = new Date().toISOString().slice(0, 10);
    let sum = 0;
    for (const [k, v] of this.dailySpendCents) {
      if (!k.endsWith(today)) continue;
      if (scope === 'agent' && !k.startsWith('agent:')) continue;
      if (scope === 'video' && !k.startsWith('volcano:')) continue;
      sum += v;
    }
    const limit =
      scope === 'agent'
        ? POLICY.DAILY_BUDGET_SOFT_LIMIT_CENTS
        : scope === 'video'
          ? POLICY.DAILY_BUDGET_HARD_LIMIT_CENTS
          : POLICY.DAILY_BUDGET_HARD_LIMIT_CENTS;
    return sum >= limit;
  }
}
