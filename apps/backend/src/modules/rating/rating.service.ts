import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RatingService {
  private readonly logger = new Logger(RatingService.name);

  async rate(userId: string, dto: Record<string, unknown>) {
    // TODO: 唯一约束 (meme_id, user_id) + 加权（评审官 1.5x/新用户 0.5x/同军团 0.8x）
    // 触发异步 recompute_meme_score
    this.logger.log(`rate user=${userId} dto=${JSON.stringify(dto)}`);
    return { ok: true };
  }

  async listComments(memeId: string, page: number) {
    // TODO: 分页查 comments
    return { memeId, items: [] as unknown[], page, total: 0 };
  }

  async createComment(userId: string, dto: Record<string, unknown>) {
    // TODO: DFA 敏感词过滤 + 可疑走阿里云 + INSERT
    this.logger.log(`comment user=${userId} dto=${JSON.stringify(dto)}`);
    return { commentId: 'placeholder' };
  }

  async judgeGodTrash(memeId: string) {
    // TODO: 评分人数 ≥ 200 触发；综合分 ≥ 4.2 且 1 星 < 15% = 神梗；≤ 2.5 且 1 星 > 50% = 烂梗
    this.logger.log(`judgeGodTrash ${memeId}`);
    return { memeId, result: 'pending' };
  }
}
