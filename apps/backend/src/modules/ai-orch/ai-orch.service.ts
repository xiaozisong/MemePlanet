import { Injectable, Logger, Inject } from '@nestjs/common';
import { PolicyEngine } from './policy-engine.js';
import { AiCostLogService } from './ai-cost-log.service.js';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { aiCostLogs } from '../../database/schema.js';
import { desc } from 'drizzle-orm';

@Injectable()
export class AIOrchService {
  private readonly logger = new Logger(AIOrchService.name);

  constructor(
    private readonly policy: PolicyEngine,
    private readonly costLog: AiCostLogService,
    @Inject(DRIZZLE) private readonly db: DbType,
  ) {}

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
    const { totalCents, byProvider } = await this.costLog.todayCostByProvider();
    return { todayCents: totalCents, byProvider };
  }

  async costLogList(page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;
    const items = await this.db
      .select()
      .from(aiCostLogs)
      .orderBy(desc(aiCostLogs.createdAt))
      .limit(pageSize)
      .offset(offset);
    return { list: items };
  }

  async resetCircuit(provider?: string) {
    this.logger.log(`resetCircuit ${provider ?? 'all'}`);
    return { ok: true, provider };
  }
}
