import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { promptTemplates, type PromptMode } from '../../database/schema.js';

/** 渲染上下文：变量名 → 实际值 */
export type RenderVars = Record<string, string>;

@Injectable()
export class PromptTemplateService {
  private readonly logger = new Logger(PromptTemplateService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DbType) {}

  /**
   * 查询模板列表，可选按 mode 筛选
   */
  async findAll(mode?: PromptMode) {
    const conditions = [eq(promptTemplates.status, 'active')];

    if (mode) {
      conditions.push(eq(promptTemplates.mode, mode));
    }

    return this.db
      .select({
        templateId: promptTemplates.templateId,
        mode: promptTemplates.mode,
        name: promptTemplates.name,
        style: promptTemplates.style,
        variables: promptTemplates.variables,
        isOfficial: promptTemplates.isOfficial,
        useCount: promptTemplates.useCount,
        status: promptTemplates.status,
        createdAt: promptTemplates.createdAt,
      })
      .from(promptTemplates)
      .where(and(...conditions))
      .orderBy(promptTemplates.useCount);
  }

  /**
   * 按 ID 查询单个模板（含 system_prompt / user_template 完整字段）
   */
  async findById(templateId: string) {
    const rows = await this.db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.templateId, templateId))
      .limit(1);

    const row = rows[0];
    if (!row) throw new NotFoundException('模板不存在');
    return row;
  }

  /**
   * 渲染模板：把 user_template 中的 {{varName}} 替换为实际值。
   * 如果变量缺失，会保持 {{varName}} 原样不动（让调用方决定是否补填）。
   */
  render(template: { userTemplate: string; variables: string[] }, vars: RenderVars): string {
    let result = template.userTemplate;
    for (const key of template.variables) {
      const value = vars[key];
      if (value !== undefined) {
        result = result.replaceAll(`{{${key}}}`, value);
      }
    }
    return result;
  }

  /**
   * 渲染 + 自增 use_count（推荐方式）
   */
  async renderAndCount(templateId: string, vars: RenderVars) {
    const tmpl = await this.findById(templateId);
    const rendered = this.render(tmpl, vars);

    await this.db
      .update(promptTemplates)
      .set({ useCount: tmpl.useCount + 1 })
      .where(eq(promptTemplates.templateId, templateId));

    return {
      templateId: tmpl.templateId,
      mode: tmpl.mode,
      name: tmpl.name,
      systemPrompt: tmpl.systemPrompt,
      renderedUserTemplate: rendered,
      style: tmpl.style,
    };
  }
}
