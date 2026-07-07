import { Module } from '@nestjs/common';
import { AIOrchController } from './ai-orch.controller.js';
import { AIOrchService } from './ai-orch.service.js';
import { PolicyEngine } from './policy-engine.js';

@Module({
  controllers: [AIOrchController],
  providers: [AIOrchService, PolicyEngine],
  exports: [AIOrchService, PolicyEngine],
})
export class AIOrchModule {}
