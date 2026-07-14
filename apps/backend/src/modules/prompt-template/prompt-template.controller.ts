import { Controller, Get, Post, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PromptTemplateService, type RenderVars } from './prompt-template.service.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { PromptMode } from '../../database/schema.js';

@ApiTags('PromptTemplates')
@Controller('prompt-templates')
export class PromptTemplateController {
  constructor(private readonly svc: PromptTemplateService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取 Prompt 模板列表（按 mode 筛选）' })
  @ApiQuery({ name: 'mode', required: false, enum: ['text', 'image', 'script'] })
  async findAll(@Query('mode') mode?: PromptMode) {
    const list = await this.svc.findAll(mode);
    return { code: 0, data: list, message: 'ok' };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取单个 Prompt 模板详情' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.svc.findById(id);
    return { code: 0, data, message: 'ok' };
  }

  @Post(':id/render')
  @Public()
  @ApiOperation({ summary: '渲染 Prompt 模板（变量插值）' })
  async render(@Param('id', ParseUUIDPipe) id: string, @Body() body: { variables: RenderVars }) {
    const data = await this.svc.renderAndCount(id, body.variables);
    return { code: 0, data, message: 'ok' };
  }
}
