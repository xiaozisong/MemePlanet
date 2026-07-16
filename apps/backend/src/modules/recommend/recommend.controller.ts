import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RecommendService } from './recommend.service.js';

@ApiTags('推荐')
@ApiBearerAuth()
@Controller('recommend')
export class RecommendController {
  constructor(private readonly reco: RecommendService) {}

  /**
   * 个性化 feed（T3.2）
   *
   * MVP：Redis ZSet hot_rank:daily 召回 top-N + DB 详情
   * v1.5：双塔召回 + LightGBM 排序
   */
  @UseGuards(JwtAuthGuard)
  @Get('feed')
  @ApiOperation({ summary: '个性化推荐 feed（热度召回）' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码（从 1 开始）' })
  async feed(@CurrentUser() user: CurrentUser, @Query('page') page?: string) {
    const num = Number(page ?? 1);
    if (!Number.isInteger(num) || num < 1) {
      throw new BadRequestException('page 必须为正整数');
    }
    return this.reco.personalizedFeed(user.sub, num);
  }

  /**
   * 热度榜 top-N（T3.2 公开端点，用于首页"热门"Tab）
   */
  @Public()
  @Get('hot')
  @ApiOperation({ summary: '热度榜 top-N' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '返回条数（默认 10，最大 50）',
  })
  async hot(@Query('limit') limit?: string) {
    const num = Number(limit ?? 10);
    if (!Number.isInteger(num) || num < 1 || num > 50) {
      throw new BadRequestException('limit 必须为 1~50 的正整数');
    }
    return this.reco.getHotRankTopN(num);
  }
}
