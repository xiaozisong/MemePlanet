import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async list(userId: string) {
    // TODO: 查 notifications 分页
    void userId;
    return { items: [] as unknown[] };
  }

  async markRead(userId: string, notifId: string) {
    this.logger.log(`markRead user=${userId} notif=${notifId}`);
    return { notifId, isRead: true };
  }

  async markAllRead(userId: string) {
    this.logger.log(`markAllRead user=${userId}`);
    return { ok: true };
  }

  async sendPush(userId: string, type: string, payload: Record<string, unknown>) {
    // TODO: INSERT notifications + OneSignal 推送
    this.logger.log(`sendPush user=${userId} type=${type}`);
    return { ok: true, type, payload };
  }
}
