import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { AuditService } from './audit.service.js';
import { SensitiveWordService } from './sensitive-word.service.js';
import { ReportSchema } from './dto.js';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly sensitive: SensitiveWordService,
  ) {}

  @Post('report')
  async report(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = ReportSchema.parse(body);
    return this.audit.report(user.sub, dto);
  }

  // ── 敏感词管理（运营后台） ──

  /** 获取当前敏感词数量 */
  @Get('sensitive-words/count')
  async getSensitiveWordCount() {
    return { count: this.sensitive.getWordCount() };
  }

  /** 热更新敏感词列表（覆盖替换） */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('sensitive-words/reload')
  async reloadSensitiveWords(@Body() body: { words: string[] }) {
    if (!Array.isArray(body.words) || body.words.length === 0) {
      return { ok: false, message: 'words 必须是非空数组' };
    }
    this.sensitive.reloadWords(body.words);
    return { ok: true, count: this.sensitive.getWordCount() };
  }

  /** 检查文本中的敏感词 */
  @Post('sensitive-words/check')
  async checkText(@Body() body: { text: string }) {
    if (!body.text) {
      return { hasSensitive: false, matches: [] };
    }
    return {
      hasSensitive: this.sensitive.hasSensitive(body.text),
      matches: this.sensitive.match(body.text),
      masked: this.sensitive.mask(body.text),
    };
  }
}
