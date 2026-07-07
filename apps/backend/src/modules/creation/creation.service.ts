import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class CreationService {
  private readonly logger = new Logger(CreationService.name);

  async start(userId: string, dto: Record<string, unknown>) {
    // TODO: 1) 能量扣减乐观锁 2) 24h prompt 去重 3) INSERT creations 4) 入队 BullMQ
    this.logger.log(`start creation user=${userId} dto=${JSON.stringify(dto)}`);
    return { creationId: 'placeholder', status: 'pending' };
  }

  async getStatus(userId: string, creationId: string) {
    // TODO: 查 creations + creation_candidates
    void userId;
    return { creationId, status: 'pending', candidates: [] };
  }

  async chooseCandidate(userId: string, creationId: string, idx: number) {
    if (idx < 0 || idx > 2) throw new BadRequestException('候选 idx 必须为 0-2');
    // TODO: 更新 creations.chosen_candidate
    return { creationId, chosen: idx };
  }

  async regenerate(userId: string, creationId: string) {
    // TODO: 检查限频 + 入队新任务
    this.logger.log(`regenerate user=${userId} creation=${creationId}`);
    return { creationId, status: 'pending' };
  }
}
