import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { AnalyticsService } from './analytics.service.js';
import { TrackEventSchema } from './dto.js';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('event')
  async track(@CurrentUser() user, @Body() body: unknown) {
    const dto = TrackEventSchema.parse(body);
    return this.analytics.track(user?.sub, dto);
  }

  @Public()
  @Post('event/batch')
  async batch(@Body() body: { events: unknown[] }) {
    // TODO: 批量入库
    return { accepted: body.events.length };
  }
}
