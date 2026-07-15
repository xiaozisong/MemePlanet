import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { creations, creationCandidates } from '../../database/schema.js';
import { UserService } from '../user/user.service.js';
import { CreationQueueService } from './creation-queue.service.js';
import { CreateCreationDto } from './dto.js';
import {
  ENERGY_COST_TEXT,
  ENERGY_COST_IMAGE,
  ENERGY_COST_VIDEO,
  ENERGY_COST_AGENT,
  MAX_ENERGY,
} from '../user/power.const.js';
import crypto from 'node:crypto';

/** 单用户每日最大造梗次数 */
const DAILY_CREATION_LIMIT = 10;

/** 24h 去重窗口（毫秒） */
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

/** prompt_hash 前缀：V1 版本 */
const HASH_VERSION = 'v1';

function computePromptHash(prompt: string, style?: string): string {
  const hash = crypto
    .createHash('md5')
    .update(`${HASH_VERSION}:${prompt}:${style ?? ''}`)
    .digest('hex');
  return `${HASH_VERSION}:${hash}`;
}

function energyCostForMode(mode: string, agentMode: boolean): number {
  if (agentMode) return ENERGY_COST_AGENT;
  switch (mode) {
    case 'image':
      return ENERGY_COST_IMAGE;
    case 'video':
      return ENERGY_COST_VIDEO;
    default:
      return ENERGY_COST_TEXT;
  }
}

@Injectable()
export class CreationService {
  private readonly logger = new Logger(CreationService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    private readonly users: UserService,
    private readonly queue: CreationQueueService,
  ) {}

  /**
   * 发起造梗任务
   *
   * 流程：
   * 1. 24h prompt 去重检测（同 prompt + style 命中则返回已有候选）
   * 2. 单用户每日限频检测（DAILY_CREATION_LIMIT）
   * 3. 乐观锁扣减能量（UserService.deductEnergy）
   * 4. INSERT creations 记录
   * 5. 返回 { creationId, status } — 后续由 BullMQ Worker 异步填充候选
   */
  async start(userId: string, dto: CreateCreationDto) {
    // 1. 24h prompt 去重
    const promptHash = computePromptHash(dto.prompt, dto.style);
    const dedupWindow = new Date(Date.now() - DEDUP_WINDOW_MS);

    const existing = await this.db
      .select({ creationId: creations.creationId })
      .from(creations)
      .where(
        and(
          eq(creations.userId, userId),
          eq(creations.promptHash, promptHash),
          sql`${creations.createdAt} >= ${dedupWindow}`,
          sql`${creations.status} != 'failed'`,
        ),
      )
      .limit(1);

    if (existing[0]) {
      // 命中去重，返回已有 creation
      return this.getStatus(userId, existing[0].creationId);
    }

    // 2. 单用户每日限频
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(creations)
      .where(and(eq(creations.userId, userId), sql`${creations.createdAt} >= ${todayStart}`));

    const count = Number(todayCount[0]?.count ?? 0);
    if (count >= DAILY_CREATION_LIMIT) {
      throw new BadRequestException('今日造梗次数已达上限（10 次/日）');
    }

    // 3. 乐观锁扣减能量
    const energyCost = energyCostForMode(dto.mode, dto.agentMode);
    const deducted = await this.users.deductEnergy(userId, energyCost);
    if (!deducted) {
      throw new BadRequestException(`能量不足（需要 ${energyCost}，当前上限 ${MAX_ENERGY}）`);
    }

    // 4. INSERT creations 记录
    const rows = await this.db
      .insert(creations)
      .values({
        userId,
        mode: dto.mode,
        agentMode: dto.agentMode,
        prompt: dto.prompt,
        promptHash,
        style: dto.style ?? null,
        templateId: dto.templateId ?? null,
        energyCost,
        status: 'pending',
      })
      .returning({
        creationId: creations.creationId,
        status: creations.status,
        mode: creations.mode,
        energyCost: creations.energyCost,
        createdAt: creations.createdAt,
      });

    const created = rows[0]!;
    this.logger.log(
      `creation created user=${userId} id=${created.creationId} mode=${dto.mode} cost=${energyCost}`,
    );

    // 5. 入队 BullMQ creation_jobs（异步填充候选）
    const priority = dto.agentMode ? 5 : 10; // Pro Agent 高优先级
    await this.queue.enqueueCreation(
      created.creationId,
      userId,
      {
        mode: dto.mode,
        prompt: dto.prompt,
        style: dto.style,
        templateId: dto.templateId,
        agentMode: dto.agentMode,
      },
      priority,
    );

    return {
      ...created,
      candidates: [],
    };
  }

  /**
   * 查询造梗状态 + 候选列表
   */
  async getStatus(userId: string, creationId: string) {
    const creation = await this.db
      .select()
      .from(creations)
      .where(and(eq(creations.creationId, creationId), eq(creations.userId, userId)))
      .limit(1);

    if (!creation[0]) {
      throw new NotFoundException('造梗记录不存在');
    }

    const candidates = await this.db
      .select()
      .from(creationCandidates)
      .where(eq(creationCandidates.creationId, creationId))
      .orderBy(creationCandidates.idx);

    return {
      ...creation[0],
      candidates: candidates.map((c) => ({
        idx: c.idx,
        content: c.content,
        imageUrl: c.imageUrl,
        selfScore: c.selfScore,
        selfReason: c.selfReason,
      })),
    };
  }

  /**
   * 选择候选（用户从 3 候选中选中一条准备发布）
   */
  async chooseCandidate(userId: string, creationId: string, idx: number) {
    if (idx < 0 || idx > 2) {
      throw new BadRequestException('候选 idx 必须为 0-2');
    }

    const creation = await this.db
      .select({ status: creations.status })
      .from(creations)
      .where(and(eq(creations.creationId, creationId), eq(creations.userId, userId)))
      .limit(1);

    if (!creation[0]) {
      throw new NotFoundException('造梗记录不存在');
    }

    if (creation[0].status !== 'ready') {
      throw new BadRequestException('造梗尚未完成，请等待候选生成');
    }

    await this.db
      .update(creations)
      .set({ chosenCandidate: idx, updatedAt: new Date() })
      .where(eq(creations.creationId, creationId));

    this.logger.log(`candidate chosen user=${userId} creation=${creationId} idx=${idx}`);
    return { creationId, chosen: idx };
  }

  /**
   * 重新生成（将状态重置为 pending 等待 Worker 重新处理）
   */
  async regenerate(userId: string, creationId: string) {
    const creation = await this.db
      .select({
        status: creations.status,
        mode: creations.mode,
        energyCost: creations.energyCost,
      })
      .from(creations)
      .where(and(eq(creations.creationId, creationId), eq(creations.userId, userId)))
      .limit(1);

    if (!creation[0]) {
      throw new NotFoundException('造梗记录不存在');
    }

    if (creation[0].status === 'pending') {
      throw new BadRequestException('造梗正在进行中，请勿重复请求');
    }

    // 重新扣减能量
    const deducted = await this.users.deductEnergy(userId, creation[0].energyCost);
    if (!deducted) {
      throw new BadRequestException(`能量不足（需要 ${creation[0].energyCost}）`);
    }

    // 删除旧候选
    await this.db.delete(creationCandidates).where(eq(creationCandidates.creationId, creationId));

    // 重置状态
    await this.db
      .update(creations)
      .set({
        status: 'pending',
        chosenCandidate: null,
        updatedAt: new Date(),
      })
      .where(eq(creations.creationId, creationId));

    this.logger.log(`regeneration scheduled user=${userId} creation=${creationId}`);
    return { creationId, status: 'pending' };
  }
}
