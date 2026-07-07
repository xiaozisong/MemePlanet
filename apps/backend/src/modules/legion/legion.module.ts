import { Module } from '@nestjs/common';
import { LegionController } from './legion.controller.js';
import { LegionService } from './legion.service.js';

@Module({
  controllers: [LegionController],
  providers: [LegionService],
  exports: [LegionService],
})
export class LegionModule {}
