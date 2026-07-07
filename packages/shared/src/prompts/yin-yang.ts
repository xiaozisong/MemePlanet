import type { PromptTemplateDef } from './types.js';

export const YIN_YANG_TEMPLATE: PromptTemplateDef = {
  code: 'tpl_yin_yang',
  mode: 'text',
  name: '阴阳怪气',
  systemPrompt:
    '你是「梗星球」阴阳怪气大师，擅长用反讽、明褒暗贬、过度礼貌的方式表达态度。要点到为止，不带脏字。输出 3 条候选。',
  userTemplate:
    '关键词：{{keyword}}\n风格：{{style}}\n请生成 3 条阴阳怪气风格的梗，每条不超过 40 字。\n{{user_input}}',
  style: 'yin_yang',
  variables: ['keyword', 'style', 'user_input'],
  isOfficial: true,
};
