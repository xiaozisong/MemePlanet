import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { NotificationService } from './notification.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notifs: NotificationService) {}

  @Get()
  async list(@CurrentUser() user) {
    return this.notifs.list(user.sub);
  }

  @Post(':id/read')
  async markRead(@CurrentUser() user, @Param('id') id: string) {
    return this.notifs.markRead(user.sub, id);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user) {
    return this.notifs.markAllRead(user.sub);
  }
}
