import { Module } from '@nestjs/common';
import { FavoriteShareController } from './favorite-share.controller.js';
import { FavoriteShareService } from './favorite-share.service.js';

@Module({
  controllers: [FavoriteShareController],
  providers: [FavoriteShareService],
  exports: [FavoriteShareService],
})
export class FavoriteShareModule {}
