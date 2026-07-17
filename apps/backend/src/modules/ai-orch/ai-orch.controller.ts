import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AIOrchService } from './ai-orch.service.js';

@Controller('ai-orch')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'system')
export class AIOrchController {
  constructor(private readonly orch: AIOrchService) {}

  @Get('providers/health')
  async health() {
    return this.orch.providersHealth();
  }

  @Get('cost/today')
  async costToday() {
    return this.orch.costToday();
  }

  @Get('cost/logs')
  async costLogs(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.orch.costLogList(Number(page ?? 1), Number(pageSize ?? 50));
  }

  @Post('policy/circuit/reset')
  async resetCircuit(@Body() body: { provider?: string }) {
    return this.orch.resetCircuit(body.provider);
  }
}
