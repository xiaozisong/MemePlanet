import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RecommendService } from './recommend.service.js';

@Controller('recommend')
export class RecommendController {
  constructor(private readonly reco: RecommendService) {}

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async feed(@CurrentUser() user: CurrentUser, @Query('page') page?: string) {
    return this.reco.personalizedFeed(user.sub, Number(page ?? 1));
  }
}
