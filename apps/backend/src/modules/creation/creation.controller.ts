import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { CreationService } from './creation.service.js';
import { CreateCreationDto, CreateCreationSchema } from './dto.js';

@Controller('creations')
@UseGuards(JwtAuthGuard)
export class CreationController {
  constructor(private readonly creations: CreationService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@CurrentUser() user: JwtPayload, @Body() body: CreateCreationDto) {
    const dto = CreateCreationSchema.parse(body);
    return this.creations.start(user.sub, dto);
  }

  @Get(':id')
  async status(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.creations.getStatus(user.sub, id);
  }

  @Post(':id/choose')
  async choose(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { idx: number },
  ) {
    return this.creations.chooseCandidate(user.sub, id, body.idx);
  }

  @Post(':id/regenerate')
  async regenerate(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.creations.regenerate(user.sub, id);
  }
}
