import { Module } from '@nestjs/common';
import { CreationController } from './creation.controller.js';
import { CreationService } from './creation.service.js';

@Module({
  controllers: [CreationController],
  providers: [CreationService],
  exports: [CreationService],
})
export class CreationModule {}
