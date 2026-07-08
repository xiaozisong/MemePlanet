export const radius = {
  none: 0,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  pill: 9999,
} as const;

export type RadiusToken = typeof radius;
