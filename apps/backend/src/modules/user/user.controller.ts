import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { UserService } from './user.service.js';
import { UpdateProfileDto, UpdateProfileSchema, UpdateInterestTagsSchema } from './dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return this.users.findById(user.sub);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: JwtPayload, @Body() body: UpdateProfileDto) {
    const dto = UpdateProfileSchema.parse(body);
    return this.users.updateProfile(user.sub, dto);
  }

  // ── 兴趣标签接口（T1.4） ──

  /** 获取当前用户兴趣标签 */
  @Get('me/interests')
  async getMyInterests(@CurrentUser() user: JwtPayload) {
    return this.users.getInterestTags(user.sub);
  }

  /** 更新当前用户兴趣标签 */
  @Patch('me/interests')
  async updateMyInterests(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = UpdateInterestTagsSchema.parse(body);
    return this.users.updateInterestTags(user.sub, dto.tags);
  }

  /** 获取兴趣标签字典（冷启动选择页使用，无需登录） */
  @Public()
  @Get('interest-tags/dictionary')
  async getInterestTagDict() {
    return {
      tags: this.users.getInterestTagDict(),
      coldStart: this.users.getColdStartConfig(),
    };
  }

  @Get('me/power')
  async myPower(@CurrentUser() user: JwtPayload) {
    return this.users.getMemePower(user.sub);
  }

  // ── T1.6: 等级详情（含下一等级进度） ──

  @Get('me/level')
  async myLevel(@CurrentUser() user: JwtPayload) {
    return this.users.getLevelDetail(user.sub);
  }

  // ── T1.5: 公开用户主页只读接口 ──
  @Get(':id')
  async getUserProfile(@CurrentUser() viewer: JwtPayload, @Param('id') userId: string) {
    return this.users.findHomeById(viewer.sub, userId);
  }
}
