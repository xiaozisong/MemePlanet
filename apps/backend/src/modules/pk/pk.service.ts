import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PK_VOTE_PER_USER_PER_DAY } from '@memestar/shared';

@Injectable()
export class PKService {
  private readonly logger = new Logger(PKService.name);

  async listActive() {
    // TODO: 查 v_pk_active 视图
    return { items: [] as unknown[] };
  }

  async findById(id: string) {
    return { pkId: id };
  }

  async create(userId: string, dto: Record<string, unknown>) {
    // TODO: 校验 legion_a/b leader 权限 + INSERT pk_matches
    this.logger.log(`create pk user=${userId} dto=${JSON.stringify(dto)}`);
    return { pkId: 'placeholder', status: 'challenged' };
  }

  async vote(userId: string, pkId: string, legionId: string) {
    // TODO: 1) Redis SETNX 检查每用户每场每天 ≤3 票
    //       2) INCR vote_count + ZINCRBY pk_score
    //       3) 异步入队 vote_log
    //       4) Redis pubsub 推送实时比分
    void userId;
    void legionId;
    this.logger.log(`vote pk=${pkId} legion=${legionId} cap=${PK_VOTE_PER_USER_PER_DAY}`);
    throw new BadRequestException('PK 投票尚未启用（M2）');
  }

  async settle(pkId: string) {
    // TODO: 定时任务（BullMQ Repeatable）每分钟扫描到期 PK 结算 + 发奖
    this.logger.log(`settle ${pkId}`);
    return { pkId, status: 'settled' };
  }
}
