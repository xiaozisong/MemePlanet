import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuditService } from './audit.service.js';
import { ReportSchema } from './dto.js';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Post('report')
  async report(@CurrentUser() user, @Body() body: unknown) {
    const dto = ReportSchema.parse(body);
    return this.audit.report(user.sub, dto);
  }
}
