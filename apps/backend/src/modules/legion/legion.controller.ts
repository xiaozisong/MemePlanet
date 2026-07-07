import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { LegionService } from './legion.service.js';
import { CreateLegionDto, CreateLegionSchema } from './dto.js';

@Controller('legions')
export class LegionController {
  constructor(private readonly legions: LegionService) {}

  @Public()
  @Get()
  async list(@Query('page') page?: string, @Query('keyword') keyword?: string) {
    return this.legions.list(Number(page ?? 1), keyword);
  }

  @Public()
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.legions.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user, @Body() body: CreateLegionDto) {
    const dto = CreateLegionSchema.parse(body);
    return this.legions.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async join(@CurrentUser() user, @Param('id') id: string) {
    return this.legions.join(user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leave(@CurrentUser() user, @Param('id') id: string) {
    return this.legions.leave(user.sub, id);
  }
}
