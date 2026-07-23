import { Controller, Body, Post, UseGuards, Param, Delete, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { FavoriteShareService } from './favorite-share.service.js';
import { FavoriteSchema, ShareSchema } from './dto.js';

@ApiTags('收藏转发')
@ApiBearerAuth()
@Controller('favorite-share')
@UseGuards(JwtAuthGuard)
export class FavoriteShareController {
  constructor(private readonly service: FavoriteShareService) {}

  @Get('me/favorites')
  @ApiOperation({ summary: '我收藏的梗卡列表（分页）' })
  async userFavorites(
    @CurrentUser() user: CurrentUser,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.service.userFavorites(user.sub, Number(page ?? 1), Number(pageSize ?? 20));
  }

  @Post('me/favorite')
  @ApiOperation({ summary: '收藏梗卡' })
  async favorite(@CurrentUser() user: CurrentUser, @Body() body: unknown) {
    const dto = FavoriteSchema.parse(body);
    return this.service.favorite(user.sub, dto);
  }

  @Delete('me/favorite/:memeId')
  @ApiOperation({ summary: '取消收藏' })
  async unfavorite(@CurrentUser() user: CurrentUser, @Param('memeId') memeId: string) {
    return this.service.unfavorite(user.sub, memeId);
  }

  @Post('me/share')
  @ApiOperation({ summary: '转发梗卡（站内/站外）' })
  async share(@CurrentUser() user: CurrentUser, @Body() body: unknown) {
    const dto = ShareSchema.parse(body);
    return this.service.share(user.sub, dto);
  }

  @Get(':memeId/shares')
  @ApiOperation({ summary: '梗卡转发记录列表' })
  async listShares(
    @Param('memeId') memeId: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.service.listShares(memeId, Number(page ?? 1), Number(pageSize ?? 20));
  }
}
