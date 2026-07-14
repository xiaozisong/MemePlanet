import { Module } from '@nestjs/common';
import { PromptTemplateController } from './prompt-template.controller.js';
import { PromptTemplateService } from './prompt-template.service.js';

@Module({
  controllers: [PromptTemplateController],
  providers: [PromptTemplateService],
  exports: [PromptTemplateService],
})
export class PromptTemplateModule {}
