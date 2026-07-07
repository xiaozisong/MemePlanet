import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AdminService } from './admin.service.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('audit/queue')
  async auditQueue() {
    return this.admin.auditQueue();
  }

  @Post('audit/:auditId/action')
  async auditAction(
    @Param('auditId') id: string,
    @Body() body: { action: string; reason?: string },
  ) {
    return this.admin.auditAction(id, body.action, body.reason);
  }

  @Get('users')
  async users(@Param('page') page?: string) {
    return this.admin.listUsers(Number(page ?? 1));
  }

  @Patch('users/:userId/ban')
  async ban(@Param('userId') userId: string, @Body() body: { reason: string; until?: string }) {
    return this.admin.banUser(userId, body.reason, body.until);
  }

  @Get('dashboard')
  async dashboard() {
    return this.admin.dashboard();
  }
}
