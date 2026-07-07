import { Module } from '@nestjs/common';
import { PKController } from './pk.controller.js';
import { PKService } from './pk.service.js';

@Module({
  controllers: [PKController],
  providers: [PKService],
  exports: [PKService],
})
export class PKModule {}
