/**
 * 勋章常量定义 — T1.7
 *
 * 定义系统内置勋章的 code、类型和显示文案。
 * 触发器/自动发放逻辑延 M2，M1 仅常量定义 + 占位。
 */

export interface BadgeDef {
  code: string;
  type: 'achievement' | 'cosmetic';
  label: string;
  description: string;
}

/**
 * 内置勋章字典（系统预设，不含用户自定义装扮）
 * code 作为 user_badges.badge_code 的权威来源
 */
export const BUILTIN_BADGES: BadgeDef[] = [
  // ── 成就勋章 ──
  {
    code: 'first_god_meme',
    type: 'achievement',
    label: '首个神梗',
    description: '发布首条神梗梗卡',
  },
  { code: '7day_streak', type: 'achievement', label: '七日连击', description: '连续 7 天登录打卡' },
  {
    code: '30day_streak',
    type: 'achievement',
    label: '月度铁粉',
    description: '连续 30 天登录打卡',
  },
  { code: '100_memes', type: 'achievement', label: '百梗齐放', description: '累计发布 100 条梗卡' },
  {
    code: 'pk_winner_10',
    type: 'achievement',
    label: '十战十胜',
    description: '累计赢得 10 场军团 PK',
  },
  {
    code: 'pro_first_month',
    type: 'achievement',
    label: 'Pro 启航',
    description: '开通 Pro 会员满一个月',
  },
  { code: 'legion_founder', type: 'achievement', label: '开山鼻祖', description: '创建自己的军团' },

  // ── 装扮勋章（cosmetic，仅展示无成就逻辑） ──
  { code: 'official', type: 'cosmetic', label: '官方认证', description: '梗星球运营团队标识' },
  { code: 'early_bird', type: 'cosmetic', label: '早鸟先锋', description: 'M1 阶段注册的早期用户' },

  // ── 预留位（M2 触发器实现） ──
  // top_creator    — 月度创作者 Top 10
  // legion_mvp     — 军团战 MVP
  // meme_master    — 综合评分 Top 1%
];

/** 快速查找勋章定义 */
export function getBadgeDef(code: string): BadgeDef | undefined {
  return BUILTIN_BADGES.find((b) => b.code === code);
}
