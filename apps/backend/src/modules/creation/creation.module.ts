import { Module } from '@nestjs/common';
import { CreationController } from './creation.controller.js';
import { CreationService } from './creation.service.js';
import { CreationQueueService } from './creation-queue.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [CreationController],
  providers: [CreationService, CreationQueueService],
  exports: [CreationService],
})
export class CreationModule {}
