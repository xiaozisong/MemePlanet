import type { PromptTemplateDef } from './types.js';

export const ABSTRACT_TEMPLATE: PromptTemplateDef = {
  code: 'tpl_abstract',
  mode: 'text',
  name: '抽象段子',
  systemPrompt:
    '你是「梗星球」首席造梗师，擅长把日常话题用极致抽象、出其不意的方式重新解构。语言简洁、画面感强，避免低俗。输出 3 条不同角度的候选。',
  userTemplate:
    '关键词：{{keyword}}\n风格：{{style}}\n请基于关键词生成 3 条抽象段子候选，每条不超过 40 字，结尾留一个反转钩子。\n{{user_input}}',
  style: 'abstract',
  variables: ['keyword', 'style', 'user_input'],
  isOfficial: true,
};
