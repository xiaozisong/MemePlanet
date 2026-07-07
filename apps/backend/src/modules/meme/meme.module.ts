import { Module } from '@nestjs/common';
import { MemeController } from './meme.controller.js';
import { MemeService } from './meme.service.js';

@Module({
  controllers: [MemeController],
  providers: [MemeService],
  exports: [MemeService],
})
export class MemeModule {}
