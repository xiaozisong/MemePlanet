/** 色彩系统定义（嵌套结构，供 typeScript 代码用 colors.brand.DEFAULT 访问） */
export const colors = {
  brand: {
    DEFAULT: '#FF5A1F',
    light: '#FF8A5C',
    dark: '#E04A14',
  },
  accent: {
    DEFAULT: '#7C3AFF',
    light: '#A78BFA',
    dark: '#5B21B6',
  },
  ink: {
    DEFAULT: '#0F0F12',
    soft: '#1A1A20',
    elevated: '#252530',
    surface: '#2A2A35',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0B0',
    muted: '#6B6B78',
    disabled: '#4A4A55',
  },
  border: {
    DEFAULT: '#2A2A35',
    light: '#3A3A48',
    strong: '#4A4A58',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  god: {
    DEFAULT: '#FFD700',
    light: '#FFE873',
  },
  trash: {
    DEFAULT: '#6B7280',
    light: '#9CA3AF',
  },
  overlay: {
    DEFAULT: 'rgba(0, 0, 0, 0.6)',
    light: 'rgba(0, 0, 0, 0.4)',
  },
  ai: {
    DEFAULT: '#7C3AFF',
    bg: 'rgba(124, 58, 255, 0.12)',
  },
  tag: {
    bg: 'rgba(255, 90, 31, 0.12)',
    text: '#FF8A5C',
  },
} as const satisfies Record<string, Record<string, string>>;

/**
 * 扁平化色彩映射（与 Tailwind class 命名一致，方便动态引用）
 * 例: colorsFlat['brand'] = '#FF5A1F', colorsFlat['text-primary'] = '#FFFFFF'
 */
export const colorsFlat: Record<string, string> = Object.fromEntries(
  Object.entries(colors).flatMap(([group, shades]) =>
    Object.entries(shades).map(([shade, value]) =>
      shade === 'DEFAULT' ? [group, value] : [`${group}-${shade}`, value],
    ),
  ),
);

export type ColorToken = typeof colors;
