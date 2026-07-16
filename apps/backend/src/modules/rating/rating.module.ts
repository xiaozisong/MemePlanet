import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller.js';
import { RatingService } from './rating.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
