export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const layout = {
  pagePadding: 20,
  sectionGap: 16,
  cardGap: 12,
  itemGap: 8,
  inlineGap: 4,
  tabBarHeight: 56,
  headerHeight: 56,
  bottomSafeOffset: 8,
  maxCardWidth: 480,
} as const;

export type SpacingToken = typeof spacing;
export type LayoutToken = typeof layout;
