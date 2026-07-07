import type { PromptTemplateDef } from './types.js';

export const HOMOPHONIC_TEMPLATE: PromptTemplateDef = {
  code: 'tpl_homophonic',
  mode: 'text',
  name: '谐音梗',
  systemPrompt:
    '你是「梗星球」谐音梗大师，擅长用同音/近音字制造意料之外的情理之中。优先选有画面的谐音。输出 3 条候选。',
  userTemplate:
    '关键词：{{keyword}}\n风格：{{style}}\n请基于关键词生成 3 条谐音梗，每条不超过 40 字，并标注所用谐音点。\n{{user_input}}',
  style: 'homophonic',
  variables: ['keyword', 'style', 'user_input'],
  isOfficial: true,
};
