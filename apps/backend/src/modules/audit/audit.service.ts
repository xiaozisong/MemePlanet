import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async machineAudit(input: {
    targetType: string;
    targetId: string;
    content: string;
    imageUrl?: string;
  }): Promise<{ result: 'pass' | 'manual_review' | 'reject' }> {
    // TODO: 1) DFA 敏感词库 2) 阿里云文本/图片审核 3) 写 audit_logs
    this.logger.log(`machineAudit ${input.targetType}=${input.targetId}`);
    return { result: 'pass' };
  }

  async report(reporterId: string, dto: Record<string, unknown>) {
    // TODO: INSERT reports + 入人审队列
    this.logger.log(`report user=${reporterId} dto=${JSON.stringify(dto)}`);
    return { reportId: 'placeholder', status: 'pending' };
  }
}
