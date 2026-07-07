import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  async personalizedFeed(userId: string, page: number) {
    // TODO: MVP 热度召回 + 简单 CF（用户兴趣标签 + 同军团偏好）
    // v1.5: 双塔召回（pgvector ANN）+ LightGBM 排序
    // v2.0: 多路召回 + 深度模型
    this.logger.log(`feed user=${userId} page=${page}`);
    return { items: [] as unknown[], page, hasMore: false };
  }

  async recomputeHotScore(): Promise<void> {
    // TODO: 每 10min cron 全量重算 hot_score，写入 Redis ZSet hot_rank:daily
    this.logger.log('recomputeHotScore tick');
  }
}
