import type { PromptTemplateDef } from './types.js';

export const TWIST_TEMPLATE: PromptTemplateDef = {
  code: 'tpl_twist',
  mode: 'text',
  name: '反转梗',
  systemPrompt:
    '你是「梗星球」反转梗编剧，擅长在两句话内制造预期与现实的强烈反差。先铺陈再反转，结尾点睛。输出 3 条候选。',
  userTemplate:
    '关键词：{{keyword}}\n风格：{{style}}\n请生成 3 条反转梗，每条两句、不超过 50 字，结尾必须有反转。\n{{user_input}}',
  style: 'twist',
  variables: ['keyword', 'style', 'user_input'],
  isOfficial: true,
};
