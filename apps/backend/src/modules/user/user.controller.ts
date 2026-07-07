import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserService } from './user.service.js';
import { UpdateProfileDto, UpdateProfileSchema, UpdateInterestTagsSchema } from './dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get('me')
  async me(@CurrentUser() user: CurrentUser) {
    return this.users.findById(user.sub);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: CurrentUser, @Body() body: UpdateProfileDto) {
    const dto = UpdateProfileSchema.parse(body);
    return this.users.updateProfile(user.sub, dto);
  }

  @Patch('me/interest-tags')
  async updateInterestTags(@CurrentUser() user: CurrentUser, @Body() body: unknown) {
    const dto = UpdateInterestTagsSchema.parse(body);
    return this.users.updateInterestTags(user.sub, dto.tags);
  }

  @Get('me/power')
  async myPower(@CurrentUser() user: CurrentUser) {
    return this.users.getMemePower(user.sub);
  }
}
