import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RatingService } from './rating.service.js';
import { CreateRatingDto, CreateRatingSchema, CreateCommentSchema } from './dto.js';

@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(private readonly ratings: RatingService) {}

  @Post()
  async rate(@CurrentUser() user, @Body() body: CreateRatingDto) {
    const dto = CreateRatingSchema.parse(body);
    return this.ratings.rate(user.sub, dto);
  }

  @Get(':memeId/comments')
  async comments(@Param('memeId') memeId: string, @Query('page') page?: string) {
    return this.ratings.listComments(memeId, Number(page ?? 1));
  }

  @Post('comments')
  async createComment(@CurrentUser() user, @Body() body: unknown) {
    const dto = CreateCommentSchema.parse(body);
    return this.ratings.createComment(user.sub, dto);
  }
}
