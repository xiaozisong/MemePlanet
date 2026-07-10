export const fontFamilies = {
  display: 'Poppins_800ExtraBold',
  body: 'Poppins_500Medium',
  mono: 'Poppins_400Regular',
} as const;

export type FontFamily = typeof fontFamilies;

export const typography = {
  display: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800' as const,
    fontFamily: fontFamilies.display,
  },
  titleLg: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    fontFamily: 'Poppins_700Bold',
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700' as const,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    fontFamily: fontFamilies.body,
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    fontFamily: 'Poppins_600SemiBold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: fontFamilies.body,
  },
  captionStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    fontFamily: 'Poppins_600SemiBold',
  },
  micro: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    fontFamily: fontFamilies.body,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    fontFamily: 'Poppins_600SemiBold',
  },
} as const;

export type TypographyToken = typeof typography;
export type TypographyKey = keyof typeof typography;
