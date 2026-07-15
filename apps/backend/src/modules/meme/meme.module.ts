import { Module } from '@nestjs/common';
import { MemeController } from './meme.controller.js';
import { MemeService } from './meme.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [MemeController],
  providers: [MemeService],
  exports: [MemeService],
})
export class MemeModule {}
