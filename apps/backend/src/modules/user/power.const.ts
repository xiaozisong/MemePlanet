/**
 * 梗力值/等级/能量常量 — T1.6
 *
 * 等级公式：level = f(meme_power)，查表获取。
 * 能量：每日恢复到 MAX_ENERGY，造梗消耗。
 * 衰减规则（30 天不活跃梗力值每周 -5%）延 M2，M1 仅基础计算。
 */

// ── 等级阈值表（梗力值 → 等级） ──

export interface LevelTier {
  level: number;
  /** 达到此等级所需的最低梗力值 */
  memePowerRequired: number;
  /** 等级中文昵称（PRD: "Lv.5 路人甲 → Lv.6 整活新秀"） */
  label: string;
}

export const LEVEL_TABLE: LevelTier[] = [
  { level: 1, memePowerRequired: 0, label: '新手小白' },
  { level: 2, memePowerRequired: 50, label: '初窥门径' },
  { level: 3, memePowerRequired: 150, label: '略懂一二' },
  { level: 4, memePowerRequired: 350, label: '整活新秀' },
  { level: 5, memePowerRequired: 700, label: '造梗达人' },
  { level: 6, memePowerRequired: 1200, label: '梗王' },
  { level: 7, memePowerRequired: 2000, label: '梗神' },
  { level: 8, memePowerRequired: 3200, label: '传说整活王' },
  { level: 9, memePowerRequired: 5000, label: '史诗梗帝' },
  { level: 10, memePowerRequired: 8000, label: '传奇' },
];

/** 最高等级（用于进度条封顶） */
export const MAX_LEVEL = LEVEL_TABLE[LEVEL_TABLE.length - 1]!.level;

// ── 能量常量 ──

/** 用户每日最大能量（schema.sql default 100） */
export const MAX_ENERGY = 100;

/** 文本造梗消耗能量 */
export const ENERGY_COST_TEXT = 1;

/** 图片造梗消耗能量（M2 启用，M1 占位） */
export const ENERGY_COST_IMAGE = 5;

/** 视频造梗消耗能量（M2 启用，M1 占位） */
export const ENERGY_COST_VIDEO = 25;

/** Pro Agent 消耗能量（M2 启用，M1 占位） */
export const ENERGY_COST_AGENT = 3;

// ── 计算函数 ──

/**
 * 由梗力值计算等级（遍历等级阈值表）
 * @returns level (1 ~ MAX_LEVEL)
 */
export function computeLevel(memePower: number): number {
  let result = 1;
  for (const tier of LEVEL_TABLE) {
    if (memePower >= tier.memePowerRequired) {
      result = tier.level;
    } else {
      break;
    }
  }
  return result;
}

/**
 * 计算当前梗力值在当前等级中的进度百分比（0 ~ 100）
 * 用于前端进度条展示。
 */
export function computeLevelProgress(memePower: number): {
  currentLevel: number;
  progressPercent: number;
  currentThreshold: number;
  nextThreshold: number | null;
  pointsToNext: number;
  currentLabel: string;
  nextLabel: string | null;
} {
  const currentLevel = computeLevel(memePower);

  const currentIndex = LEVEL_TABLE.findIndex((t) => t.level === currentLevel);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const currentTier = LEVEL_TABLE[currentIndex]!;

  if (currentLevel >= MAX_LEVEL) {
    return {
      currentLevel: MAX_LEVEL,
      progressPercent: 100,
      currentThreshold: currentTier.memePowerRequired,
      nextThreshold: null,
      pointsToNext: 0,
      currentLabel: currentTier.label,
      nextLabel: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const nextTier = LEVEL_TABLE[currentIndex + 1]!;
  const currentThreshold = currentTier.memePowerRequired;
  const nextThreshold = nextTier.memePowerRequired;
  const range = nextThreshold - currentThreshold;
  const progress = range > 0 ? ((memePower - currentThreshold) / range) * 100 : 100;

  return {
    currentLevel,
    progressPercent: Math.round(Math.min(progress, 100) * 100) / 100,
    currentThreshold,
    nextThreshold,
    pointsToNext: Math.max(0, nextThreshold - memePower),
    currentLabel: currentTier.label,
    nextLabel: nextTier.label,
  };
}
