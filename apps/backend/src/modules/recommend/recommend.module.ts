import { Module } from '@nestjs/common';
import { RecommendController } from './recommend.controller.js';
import { RecommendService } from './recommend.service.js';

@Module({
  controllers: [RecommendController],
  providers: [RecommendService],
  exports: [RecommendService],
})
export class RecommendModule {}
