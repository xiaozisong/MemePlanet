import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { MemeService } from './meme.service.js';
import { CreateMemeDto, CreateMemeSchema } from './dto.js';

@Controller('memes')
export class MemeController {
  constructor(private readonly memes: MemeService) {}

  @Public()
  @Get('feed')
  async feed(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.memes.feed(Number(page ?? 1), Number(pageSize ?? 20));
  }

  @Public()
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.memes.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user, @Body() body: CreateMemeDto) {
    const dto = CreateMemeSchema.parse(body);
    return this.memes.publish(user.sub, dto);
  }
}
