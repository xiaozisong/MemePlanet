import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  async auditQueue() {
    // TODO: 查 audit_logs + reports WHERE status=pending 优先级排序
    return { items: [] as unknown[] };
  }

  async auditAction(auditId: string, action: string, reason?: string) {
    this.logger.log(`auditAction ${auditId} action=${action} reason=${reason}`);
    return { auditId, action };
  }

  async listUsers(page: number) {
    void page;
    return { items: [] as unknown[] };
  }

  async banUser(userId: string, reason: string, until?: string) {
    // TODO: INSERT banned_users + UPDATE users.status=banned
    this.logger.log(`ban ${userId} reason=${reason} until=${until}`);
    return { userId, banned: true };
  }

  async dashboard() {
    // TODO: 实时在线 + PK 比分 + 当日造梗数 + AI 成本（实时）
    return {
      online: 0,
      activePKs: 0,
      memesCreatedToday: 0,
      aiCostTodayCents: 0,
    };
  }
}
