import { Module } from '@nestjs/common';
import { AIOrchController } from './ai-orch.controller.js';
import { AIOrchService } from './ai-orch.service.js';
import { PolicyEngine } from './policy-engine.js';
import { AiCostLogService } from './ai-cost-log.service.js';

@Module({
  controllers: [AIOrchController],
  providers: [AIOrchService, PolicyEngine, AiCostLogService],
  exports: [AIOrchService, PolicyEngine, AiCostLogService],
})
export class AIOrchModule {}

export { AiCostLogService } from './ai-cost-log.service.js';
export type { AiCostLogEntry } from './ai-cost-log.service.js';
