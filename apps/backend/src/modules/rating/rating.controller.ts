import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RatingService } from './rating.service.js';
import { CreateRatingDto, CreateRatingSchema, CreateCommentSchema } from './dto.js';

@ApiTags('评分评论')
@ApiBearerAuth()
@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingController {
  constructor(private readonly ratings: RatingService) {}

  @Post()
  @ApiOperation({ summary: '评分' })
  async rate(@CurrentUser() user: CurrentUser, @Body() body: CreateRatingDto) {
    const dto = CreateRatingSchema.parse(body);
    return this.ratings.rate(user.sub, dto);
  }

  @Get(':memeId/score')
  @ApiOperation({ summary: '梗卡评分统计' })
  async score(@Param('memeId') memeId: string) {
    return this.ratings.getMemeScore(memeId);
  }

  @Get(':memeId/comments')
  @ApiOperation({ summary: '评论列表' })
  async comments(
    @Param('memeId') memeId: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.ratings.listComments(memeId, Number(page ?? 1), Number(pageSize ?? 20));
  }

  @Post('comments')
  @ApiOperation({ summary: '发布评论' })
  async createComment(@CurrentUser() user: CurrentUser, @Body() body: unknown) {
    const dto = CreateCommentSchema.parse(body);
    return this.ratings.createComment(user.sub, dto);
  }

  @Get(':memeId/god-trash')
  @ApiOperation({ summary: '神梗/烂梗判定' })
  async judgeGodTrash(@Param('memeId') memeId: string) {
    return this.ratings.judgeGodTrash(memeId);
  }
}
