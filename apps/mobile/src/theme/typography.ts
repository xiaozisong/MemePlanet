export const typography = {
  display: { fontSize: 36, lineHeight: 44, fontWeight: '800' as const },
  titleLg: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  captionStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  micro: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  button: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
} as const;

export type TypographyToken = typeof typography;
export type TypographyKey = keyof typeof typography;
