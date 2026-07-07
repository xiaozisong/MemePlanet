import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller.js';
import { RatingService } from './rating.service.js';

@Module({
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
