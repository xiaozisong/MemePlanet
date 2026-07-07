import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  async submit(userId: string, dto: Record<string, unknown>) {
    // TODO: 检查日生成上限 + 扣能量 + INSERT meme_videos + 入队 video_jobs
    this.logger.log(`submit video user=${userId} dto=${JSON.stringify(dto)}`);
    return { videoId: 'placeholder', status: 'generating' };
  }

  async getStatus(userId: string, videoId: string) {
    void userId;
    // TODO: 查 meme_videos
    return { videoId, status: 'generating', progress: 0 };
  }

  async handleWebhook(videoId: string, payload: unknown) {
    // TODO: HMAC 校验 + 更新 meme_videos.status + 入审核队列
    this.logger.log(`webhook video=${videoId} payload=${JSON.stringify(payload)}`);
    return { ok: true };
  }
}
