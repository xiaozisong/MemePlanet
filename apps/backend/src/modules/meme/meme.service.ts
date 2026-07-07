import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MemeService {
  private readonly logger = new Logger(MemeService.name);

  async feed(page: number, pageSize: number) {
    // TODO: 热度召回 v1（hot_rank:daily ZSet + 新品 Top 混合 + 多样性重排）
    return { items: [] as unknown[], page, pageSize, total: 0, hasMore: false };
  }

  async findById(id: string) {
    // TODO: 查 meme_cards + Redis 缓存 10min + CF 边缘 1min
    this.logger.log(`findById ${id}`);
    return { memeId: id };
  }

  async publish(userId: string, dto: Record<string, unknown>) {
    // TODO: INSERT meme_cards (status=pending_audit) + 入审核队列 + 写 hot_score
    this.logger.log(`publish ${userId}: ${JSON.stringify(dto)}`);
    return { memeId: 'placeholder', status: 'pending_audit' };
  }
}
