import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LegionService {
  private readonly logger = new Logger(LegionService.name);

  async list(page: number, keyword?: string) {
    // TODO: 查 legions (deleted_at IS NULL)，keyword 走 citext 模糊
    return { items: [] as unknown[], page, total: 0, keyword };
  }

  async findById(id: string) {
    this.logger.log(`findById ${id}`);
    return { legionId: id };
  }

  async create(userId: string, dto: Record<string, unknown>) {
    // TODO: 名称敏感词校验 + 人审 + INSERT + leader_id = userId
    this.logger.log(`create user=${userId} dto=${JSON.stringify(dto)}`);
    return { legionId: 'placeholder', status: 'pending_audit' };
  }

  async join(userId: string, legionId: string) {
    // TODO: 检查 member_cap + legion_count ≤ 3 + INSERT legion_members
    this.logger.log(`join user=${userId} legion=${legionId}`);
    return { ok: true };
  }

  async leave(userId: string, legionId: string) {
    // TODO: UPDATE legion_members SET left_at = now()
    this.logger.log(`leave user=${userId} legion=${legionId}`);
    return { ok: true };
  }
}
