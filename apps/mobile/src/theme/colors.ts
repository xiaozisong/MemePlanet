/** 色彩系统定义（嵌套结构，供 TypeScript 代码用 colors.brand.DEFAULT 访问）
 *
 * 基于 Figma "Online Game Streaming Mobile App" 设计稿适配。
 * 语义映射：LIVE/游戏直播 → 梗/造梗/军団/PK/我的
 */
export const colors = {
  brand: {
    DEFAULT: '#F7B84B',
    light: '#F9CE6E',
    dark: '#D49C2E',
  },
  accent: {
    DEFAULT: '#28ACA6',
    light: '#5ED36A',
    dark: '#9E5CBD',
    info: '#70A3EE',
  },
  ink: {
    DEFAULT: '#1E1D1A',
    soft: '#2A2A30',
    elevated: '#353545',
    surface: '#424250',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8B8F92',
    muted: '#5E6468',
    disabled: '#4A4A55',
  },
  border: {
    DEFAULT: '#3A3A44',
    light: '#4A4A58',
    strong: '#5A5A68',
  },
  status: {
    success: '#5ED36A',
    warning: '#F7B84B',
    error: '#FF4444',
    info: '#70A3EE',
  },
  god: {
    DEFAULT: '#F7B84B',
    light: '#F9CE6E',
  },
  trash: {
    DEFAULT: '#5E6468',
    light: '#8B8F92',
  },
  overlay: {
    DEFAULT: 'rgba(0, 0, 0, 0.6)',
    light: 'rgba(0, 0, 0, 0.4)',
  },
  ai: {
    DEFAULT: '#9E5CBD',
    bg: 'rgba(158, 92, 189, 0.12)',
  },
  tag: {
    bg: 'rgba(247, 184, 75, 0.12)',
    text: '#F7B84B',
  },
} as const satisfies Record<string, Record<string, string>>;

/**
 * 扁平化色彩映射（与 Tailwind class 命名一致，方便动态引用）
 * 例: colorsFlat['brand'] = '#F7B84B', colorsFlat['text-primary'] = '#FFFFFF'
 */
export const colorsFlat: Record<string, string> = Object.fromEntries(
  Object.entries(colors).flatMap(([group, shades]) =>
    Object.entries(shades).map(([shade, value]) =>
      shade === 'DEFAULT' ? [group, value] : [`${group}-${shade}`, value],
    ),
  ),
);

export type ColorToken = typeof colors;
