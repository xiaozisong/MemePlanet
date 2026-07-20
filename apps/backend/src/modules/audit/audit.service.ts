import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { reports, auditLogs } from '../../database/schema.js';
import { SensitiveWordService, type SensitiveMatch } from './sensitive-word.service.js';
import type { ReportDto } from './dto.js';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DbType,
    private readonly sensitive: SensitiveWordService,
  ) {}

  /**
   * 举报接口
   * 写入 reports 表，状态为 pending，待管理员审核
   */
  async report(reporterId: string, dto: ReportDto): Promise<{ reportId: string; status: string }> {
    const [inserted] = await this.db
      .insert(reports)
      .values({
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        detail: dto.detail ?? null,
        status: 'pending',
      })
      .returning({ reportId: reports.reportId, status: reports.status });

    if (!inserted) {
      throw new Error('举报提交失败');
    }

    this.logger.log(
      `report created: id=${inserted.reportId} user=${reporterId} target=${dto.targetType}:${dto.targetId}`,
    );
    return { reportId: inserted.reportId, status: inserted.status };
  }

  /**
   * 机器审核（文本）
   *
   * 流程：
   * 1. DFA 敏感词匹配 → 命中直接 reject
   * 2. 阿里云内容安全（TODO: T2.10 接入）
   * 3. 写 audit_logs
   */
  async machineAudit(input: {
    targetType: string;
    targetId: string;
    content: string;
    imageUrl?: string;
  }): Promise<{ result: 'pass' | 'manual_review' | 'reject'; matches?: SensitiveMatch[] }> {
    const { targetType, targetId, content } = input;

    // 1. DFA 敏感词检测
    const matches = this.sensitive.match(content);
    if (matches.length > 0) {
      const words = matches.map((m) => m.word);
      this.logger.warn(`DFA rejected ${targetType}=${targetId}: matched ${words.join(',')}`);

      // 写 audit_logs
      await this.db.insert(auditLogs).values({
        targetId,
        targetType,
        action: 'machine_reject',
        result: 'rejected',
        reason: `DFA 敏感词命中: ${words.join(', ')}`,
        operatorId: '00000000-0000-0000-0000-000000000000',
        metadata: { matches: matches.map((m) => ({ word: m.word, start: m.start, end: m.end })) },
      });

      return { result: 'reject', matches };
    }

    // TODO: 2. 阿里云内容安全（T2.10）

    // pass — 写 audit_logs
    await this.db.insert(auditLogs).values({
      targetId,
      targetType,
      action: 'machine_pass',
      result: 'approved',
      operatorId: '00000000-0000-0000-0000-000000000000',
      metadata: {},
    });

    this.logger.log(`machineAudit pass ${targetType}=${targetId}`);
    return { result: 'pass' };
  }
}
