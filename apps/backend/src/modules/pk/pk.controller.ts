import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { PKService } from './pk.service.js';
import { CreatePKDto, CreatePKSchema, PKVoteSchema } from './dto.js';

@Controller('pk')
export class PKController {
  constructor(private readonly pk: PKService) {}

  @Public()
  @Get('active')
  async active() {
    return this.pk.listActive();
  }

  @Public()
  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.pk.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@CurrentUser() user, @Body() body: CreatePKDto) {
    const dto = CreatePKSchema.parse(body);
    return this.pk.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/vote')
  async vote(@CurrentUser() user, @Param('id') id: string, @Body() body: unknown) {
    const dto = PKVoteSchema.parse(body);
    return this.pk.vote(user.sub, id, dto.legionId);
  }
}
