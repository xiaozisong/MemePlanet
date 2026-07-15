import { Injectable, Logger, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import {
  aiCostLogs,
  type AiCostModule,
  type AiCostProvider,
  type AiCostStatus,
} from '../../database/schema.js';

export interface AiCostLogEntry {
  userId?: string;
  module: AiCostModule;
  provider: AiCostProvider;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  latencyMs: number;
  status?: AiCostStatus;
  requestId?: string;
}

@Injectable()
export class AiCostLogService {
  private readonly logger = new Logger(AiCostLogService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DbType) {}

  /**
   * 记录一次 AI 调用的成本日志
   */
  async log(entry: AiCostLogEntry): Promise<void> {
    try {
      await this.db.insert(aiCostLogs).values({
        userId: entry.userId ?? null,
        module: entry.module,
        provider: entry.provider,
        model: entry.model,
        tokensIn: entry.tokensIn,
        tokensOut: entry.tokensOut,
        costCents: entry.costCents,
        latencyMs: entry.latencyMs,
        status: entry.status ?? 'ok',
        requestId: entry.requestId ?? null,
      });
    } catch (err) {
      this.logger.warn(`ai_cost_log write failed: ${(err as Error).message}`);
    }
  }

  /**
   * 批量写入成本日志
   */
  async logBatch(entries: AiCostLogEntry[]): Promise<number> {
    if (entries.length === 0) return 0;
    try {
      await this.db.insert(aiCostLogs).values(
        entries.map((e) => ({
          userId: e.userId ?? null,
          module: e.module,
          provider: e.provider,
          model: e.model,
          tokensIn: e.tokensIn,
          tokensOut: e.tokensOut,
          costCents: e.costCents,
          latencyMs: e.latencyMs,
          status: e.status ?? 'ok',
          requestId: e.requestId ?? null,
        })),
      );
      return entries.length;
    } catch (err) {
      this.logger.warn(`ai_cost_log batch write failed: ${(err as Error).message}`);
      return 0;
    }
  }

  /**
   * 查询当日某 provider 的累计成本（分）
   */
  async todayCostByProvider(
    provider?: AiCostProvider,
  ): Promise<{ totalCents: number; byProvider: Record<string, number> }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const where = provider
      ? and(sql`${aiCostLogs.createdAt} >= ${todayStart}`, eq(aiCostLogs.provider, provider))
      : sql`${aiCostLogs.createdAt} >= ${todayStart}`;

    const rows = await this.db
      .select({
        provider: aiCostLogs.provider,
        totalCents: sql<number>`sum(${aiCostLogs.costCents})`,
      })
      .from(aiCostLogs)
      .where(where)
      .groupBy(aiCostLogs.provider);

    const byProvider: Record<string, number> = {};
    let totalCents = 0;
    for (const r of rows) {
      const cents = Number(r.totalCents);
      byProvider[r.provider] = cents;
      totalCents += cents;
    }

    return { totalCents, byProvider };
  }
}
