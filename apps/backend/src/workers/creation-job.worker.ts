import { Logger } from '@nestjs/common';
import { Worker, QueueEvents, Job } from 'bullmq';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { CREATION_QUEUE_NAME, CREATION_WORKER_CONFIG, QUEUE_CONNECTION } from './queue-config.js';
import * as schema from '../database/schema.js';
import { MockLLMAdapter } from '../modules/ai-orch/adapters/mock-llm.adapter.js';

export interface CreationJobData {
  creationId: string;
  userId: string;
  mode: string;
  prompt: string;
  style?: string;
  templateId?: string;
  agentMode: boolean;
}

export type CreationJobResult = {
  candidates: Array<{
    idx: number;
    content: string;
    selfScore?: number;
    selfReason?: string;
  }>;
};

type DbType = NodePgDatabase<typeof schema>;

/**
 * 造梗 Job Worker
 *
 * 消费 creation_jobs 队列：
 * 1. 接收 CreationJobData（由 CreationService 入队）
 * 2. 调用 LLM 生成 3 候选（当前使用 MockLLMAdapter，T2.3 之后可替换为真实 LLM）
 * 3. 写入 creation_candidates 表
 * 4. 更新 creations.status = 'ready'
 * 5. 失败时更新 creations.status = 'failed'
 */
export class CreationJobWorker {
  private readonly logger = new Logger(CreationJobWorker.name);
  private readonly worker: Worker;
  private readonly events: QueueEvents;
  private readonly db: DbType;
  private readonly llm: MockLLMAdapter;

  constructor() {
    // 建立独立 PG 连接池
    const url = process.env.DATABASE_URL ?? 'postgres://app:secret@localhost:5432/meme';
    const pool = new Pool({ connectionString: url, max: 5 });
    this.db = drizzle(pool, { schema }) as DbType;

    // 使用 Mock LLM（T2.3 阶段；后续可替换为 AIOrchService 调用真实 DeepSeek）
    this.llm = new MockLLMAdapter('mock-llm');

    this.worker = new Worker<CreationJobData, CreationJobResult>(
      CREATION_QUEUE_NAME,
      async (job: Job<CreationJobData>) => {
        this.logger.log(`▶ creation job ${job.id} creation=${job.data.creationId}`);
        return this.processCreation(job);
      },
      {
        connection: QUEUE_CONNECTION,
        concurrency: CREATION_WORKER_CONFIG.concurrency,
        lockDuration: CREATION_WORKER_CONFIG.timeout,
      },
    );

    this.events = new QueueEvents(CREATION_QUEUE_NAME, {
      connection: QUEUE_CONNECTION,
    });

    this.events.on('failed', ({ jobId, failedReason }) =>
      this.logger.error(`creation job ${jobId} failed: ${failedReason}`),
    );

    this.events.on('completed', ({ jobId, returnvalue }) =>
      this.logger.log(`creation job ${jobId} completed: ${JSON.stringify(returnvalue)}`),
    );

    this.worker.on('error', (err) => {
      this.logger.error(`creation worker error: ${err.message}`);
    });
  }

  /**
   * 处理造梗任务
   *
   * 流程：
   * 1. 调用 LLM 生成 3 候选文字内容
   * 2. 写入 ai_cost_logs 成本日志
   * 3. 写入 creation_candidates 表
   * 4. 更新 creations.status = 'ready'
   * 5. 返回候选结果
   */
  async processCreation(job: Job<CreationJobData>): Promise<CreationJobResult> {
    const { creationId, userId, prompt, style } = job.data;

    await job.updateProgress(10);

    try {
      // 1. 调用 LLM 生成 3 候选
      const systemPrompt = `你是一个精通中文互联网"梗"文化的创意助手。
请根据用户输入的 prompt，生成 3 个风格不同但都很有趣的梗文字。
要求：
- 每个候选风格独立（可以用不同角度/修辞/叙事方式）
- 适合 14-28 岁年轻人阅读，轻松有趣
- 长度 10-50 字
- 输出格式：每条一行，以 "候选X：" 开头
- 不要解释，只输出 3 行`;

      const userPrompt = style ? `${prompt}（风格：${style}）` : prompt;

      const startMs = Date.now();
      const response = await this.llm.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        maxTokens: 500,
      });
      const latencyMs = Date.now() - startMs;

      await job.updateProgress(40);

      // 2. 写入 ai_cost_logs（T2.14）
      await this.logAiCost({
        userId,
        module: 'creation' as const,
        provider: 'mock' as const,
        model: this.llm.model,
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
        costCents: 0,
        latencyMs,
        status: 'ok' as const,
        requestId: job.id,
      });

      // 2. 解析 LLM 输出为 3 候选
      const candidates = this.parseCandidates(response.content);

      await job.updateProgress(60);

      // 3. 写入 creation_candidates 表
      if (candidates.length > 0) {
        await this.db.insert(schema.creationCandidates).values(
          candidates.map((c) => ({
            creationId,
            idx: c.idx,
            content: c.content,
            selfScore: c.selfScore?.toString() ?? null,
            selfReason: c.selfReason ?? null,
            metadata: { modelVersion: this.llm.model, generationMethod: 'mock-llm' },
          })),
        );
      } else {
        // 解析失败，fallback：写入 3 条降级候选
        await this.db.insert(schema.creationCandidates).values(
          [0, 1, 2].map((idx) => ({
            creationId,
            idx,
            content: `${prompt}（候选${idx + 1}）`,
            selfScore: '5.0',
            selfReason: '自动生成降级',
            metadata: { modelVersion: 'fallback', generationMethod: 'fallback' },
          })),
        );
      }

      await job.updateProgress(80);

      // 4. 更新 creations.status = 'ready'
      await this.db
        .update(schema.creations)
        .set({ status: 'ready', updatedAt: new Date() })
        .where(eq(schema.creations.creationId, creationId));

      this.logger.log(
        `creation ${creationId} ready — ${candidates.length} candidates written (mode=${job.data.mode})`,
      );

      await job.updateProgress(100);

      return { candidates };
    } catch (err) {
      // 5. 失败时更新 creations.status = 'failed'
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`creation ${creationId} failed: ${errMsg}`);

      try {
        await this.db
          .update(schema.creations)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(schema.creations.creationId, creationId));
      } catch (dbErr) {
        this.logger.error(`failed to update creation ${creationId} status: ${dbErr}`);
      }

      throw err; // 让 BullMQ 重试
    }
  }

  /**
   * 解析 Mock LLM 返回内容为 3 候选
   *
   * 期望格式：
   *   候选1：xxx
   *   候选2：xxx
   *   候选3：xxx
   *
   * 若解析失败返回空数组，上层使用降级候选。
   */
  private parseCandidates(content: string): Array<{
    idx: number;
    content: string;
    selfScore: number;
    selfReason: string;
  }> {
    const lines = content.split('\n').filter((l) => l.trim());
    const candidates: Array<{
      idx: number;
      content: string;
      selfScore: number;
      selfReason: string;
    }> = [];

    for (const line of lines) {
      const match = line.match(/^候选(\d)[：:]\s*(.*)/);
      if (match) {
        const idx = parseInt(match[1]!, 10) - 1;
        if (idx >= 0 && idx <= 2) {
          candidates.push({
            idx,
            content: match[2]!.trim(),
            selfScore: [7.5, 8.0, 6.5][idx] ?? 7.0,
            selfReason:
              ['表达清晰，梗点突出', '创意丰富，容易传播', '直白易懂，但稍显平淡'][idx] ?? '',
          });
        }
      }
    }

    // 如果解析到 3 条候选（不一定按顺序），按 idx 排序返回
    if (candidates.length === 3) {
      return candidates.sort((a, b) => a.idx - b.idx);
    }

    // 如果不是完整的 3 条，尝试把整段内容拆成 3 段
    if (candidates.length === 0) {
      const segments = content
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (segments.length >= 3) {
        return segments.slice(0, 3).map((seg, idx) => ({
          idx,
          content: seg.replace(/^候选\d[：:]\s*/, '').trim(),
          selfScore: 7.0,
          selfReason: '段落分割',
        }));
      }
    }

    return candidates;
  }

  /**
   * 写入 AI 调用成本日志（T2.14）
   * Worker 进程不走 NestJS DI，直接 DB insert
   */
  private async logAiCost(entry: {
    userId: string;
    module: string;
    provider: string;
    model: string;
    tokensIn: number;
    tokensOut: number;
    costCents: number;
    latencyMs: number;
    status: string;
    requestId?: string;
  }): Promise<void> {
    try {
      await this.db.insert(schema.aiCostLogs).values({
        userId: entry.userId,
        module: entry.module,
        provider: entry.provider,
        model: entry.model,
        tokensIn: entry.tokensIn,
        tokensOut: entry.tokensOut,
        costCents: entry.costCents,
        latencyMs: entry.latencyMs,
        status: entry.status,
        requestId: entry.requestId ?? null,
      });
    } catch (err) {
      this.logger.warn(`ai_cost_log write failed: ${(err as Error).message}`);
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
    this.events.close();
  }
}
