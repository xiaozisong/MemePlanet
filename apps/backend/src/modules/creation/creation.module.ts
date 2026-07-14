import { Module } from '@nestjs/common';
import { CreationController } from './creation.controller.js';
import { CreationService } from './creation.service.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [CreationController],
  providers: [CreationService],
  exports: [CreationService],
})
export class CreationModule {}
