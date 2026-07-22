/** 色彩系统定义（嵌套结构，供 TypeScript 代码用 colors.brand.DEFAULT 访问）
 *
 * 基于 Figma "Online Game Streaming Mobile App" 设计稿适配。
 * 语义映射：LIVE/游戏直播 → 梗/造梗/军団/PK/我的
 *
 * ⚡ 2026-07-22: 品牌色升级为「霓虹粉紫」渐变主题
 */
export const colors = {
  brand: {
    DEFAULT: '#C76BCC', // 粉紫中间值（单色场景：图标、文字高亮、loading 转圈）
    light: '#FFA1C5', // 浅粉 — hover/底色
    dark: '#8E48C9', // 深紫 — 按压态
  },
  accent: {
    DEFAULT: '#FF8AB8', // 暖粉（焦点/未读）
    light: '#FFB6D9', // 极浅粉
    dark: '#D96B9D', // 玫瑰粉
    info: '#70A3EE', // 信息蓝保持不变
  },
  ink: {
    DEFAULT: '#0F0A1A', // 深紫黑底（替代原来的 #1E1D1A 深棕黑）
    soft: '#1B1426', // 卡片底（替代 #2A2A30）
    elevated: '#2A1E3A', // 浮层（替代 #353545）
    surface: '#3A2D4E', // 表面层（替代 #424250）
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8B8F92',
    muted: '#5E6468',
    disabled: '#4A4A55',
  },
  border: {
    DEFAULT: '#2A1E3A', // 边框（偏紫）
    light: '#3A2D4E',
    strong: '#4A3D5E',
  },
  status: {
    success: '#5ED36A',
    warning: '#FFA1C5', // 警告偏粉
    error: '#FF4D6D', // 错误偏粉红
    info: '#70A3EE',
  },
  god: {
    DEFAULT: '#FFD86B', // 金色改暖黄偏粉（神梗保留金色调但更柔）
    light: '#FFE8A0',
  },
  trash: {
    DEFAULT: '#5E6468',
    light: '#8B8F92',
  },
  overlay: {
    DEFAULT: 'rgba(15, 10, 26, 0.7)', // 深紫黑遮罩
    light: 'rgba(15, 10, 26, 0.5)',
  },
  ai: {
    DEFAULT: '#9E5CBD', // AI 紫天然契合，保持不变
    bg: 'rgba(158, 92, 189, 0.15)',
  },
  tag: {
    bg: 'rgba(255, 107, 157, 0.15)', // 粉红标签底（替代原来的金黄 12%）
    text: '#FF6B9D', // 粉红标签文字
  },
} as const satisfies Record<string, Record<string, string>>;

/**
 * 扁平化色彩映射（与 Tailwind class 命名一致，方便动态引用）
 * 例: colorsFlat['brand'] = '#C76BCC', colorsFlat['text-primary'] = '#FFFFFF'
 */
export const colorsFlat: Record<string, string> = Object.fromEntries(
  Object.entries(colors).flatMap(([group, shades]) =>
    Object.entries(shades).map(([shade, value]) =>
      shade === 'DEFAULT' ? [group, value] : [`${group}-${shade}`, value],
    ),
  ),
);

export type ColorToken = typeof colors;
