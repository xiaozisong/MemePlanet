import type { PromptTemplateDef } from './types.js';

export const MEME_CAPTION_TEMPLATE: PromptTemplateDef = {
  code: 'tpl_meme_caption',
  mode: 'image',
  name: '表情包配文',
  systemPrompt:
    '你是「梗星球」表情包配文师，擅长为图片场景给出 1-2 行精准配文，制造反差与共鸣。配文简短、有画面感。',
  userTemplate:
    '图片描述：{{keyword}}\n风格：{{style}}\n请为该场景生成 3 条表情包配文候选，每条不超过 20 字，并给出建议文字摆放位置（顶部/底部/中央）。\n{{user_input}}',
  style: 'meme_caption',
  variables: ['keyword', 'style', 'user_input'],
  isOfficial: true,
};
