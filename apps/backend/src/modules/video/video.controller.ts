import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { VideoService } from './video.service.js';
import { CreateVideoDto, CreateVideoSchema } from './dto.js';

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideoController {
  constructor(private readonly videos: VideoService) {}

  @Post()
  async create(@CurrentUser() user, @Body() body: CreateVideoDto) {
    const dto = CreateVideoSchema.parse(body);
    return this.videos.submit(user.sub, dto);
  }

  @Get(':id/status')
  async status(@CurrentUser() user, @Param('id') id: string) {
    return this.videos.getStatus(user.sub, id);
  }

  @Post(':id/webhook')
  async webhook(@Param('id') id: string, @Body() body: unknown) {
    // TODO: HMAC 校验
    return this.videos.handleWebhook(id, body);
  }
}
