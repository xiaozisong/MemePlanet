export * from './colors';
export * from './gradient';
export * from './spacing';
export * from './typography';
export * from './radius';
export * from './shadow';

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export type MotionToken = typeof motion;

export const zIndices = {
  base: 0,
  card: 1,
  sticky: 10,
  floating: 50,
  modal: 100,
  toast: 1000,
} as const;
