import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';
import { SensitiveWordService } from './sensitive-word.service.js';

@Module({
  controllers: [AuditController],
  providers: [AuditService, SensitiveWordService],
  exports: [AuditService, SensitiveWordService],
})
export class AuditModule {}
