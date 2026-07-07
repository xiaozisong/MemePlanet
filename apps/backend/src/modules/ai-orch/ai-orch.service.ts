import { Injectable, Logger } from '@nestjs/common';
import { PolicyEngine } from './policy-engine.js';

@Injectable()
export class AIOrchService {
  private readonly logger = new Logger(AIOrchService.name);

  constructor(private readonly policy: PolicyEngine) {}

  async chat(req: Parameters<PolicyEngine['chat']>[0]) {
    return this.policy.chat(req);
  }

  async generateImage(req: Parameters<PolicyEngine['generateImage']>[0]) {
    return this.policy.generateImage(req);
  }

  async submitVideo(req: Parameters<PolicyEngine['submitVideo']>[0]) {
    return this.policy.submitVideo(req);
  }

  async providersHealth() {
    // TODO: 聚合各 provider.health()
    return { providers: [] as Array<{ name: string; healthy: boolean }> };
  }

  async costToday() {
    // TODO: 查 ai_cost_logs 聚合
    return { todayCents: 0, byProvider: {} };
  }

  async resetCircuit(provider?: string) {
    this.logger.log(`resetCircuit ${provider ?? 'all'}`);
    return { ok: true, provider };
  }
}
