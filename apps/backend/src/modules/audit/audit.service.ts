import { Injectable, Logger } from '@nestjs/common';
import { SensitiveWordService, type SensitiveMatch } from './sensitive-word.service.js';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly sensitive: SensitiveWordService) {}

  /**
   * 机器审核（文本）
   *
   * 流程：
   * 1. DFA 敏感词匹配 → 命中直接 reject
   * 2. 阿里云内容安全（TODO: T2.10 接入）
   * 3. 写 audit_logs（TODO）
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
      return { result: 'reject', matches };
    }

    // TODO: 2. 阿里云内容安全

    this.logger.log(`machineAudit pass ${targetType}=${targetId}`);
    return { result: 'pass' };
  }

  async report(reporterId: string, dto: Record<string, unknown>) {
    // TODO: INSERT reports + 入人审队列
    this.logger.log(`report user=${reporterId} dto=${JSON.stringify(dto)}`);
    return { reportId: 'placeholder', status: 'pending' };
  }
}
