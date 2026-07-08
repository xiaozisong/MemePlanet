import { Platform } from 'react-native';

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

const elevatedShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  android: { elevation: 6 },
  default: {},
});

const deepShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
  },
  android: { elevation: 10 },
  default: {},
});

const brandShadow = Platform.select({
  ios: {
    shadowColor: '#FF5A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  android: { elevation: 6 },
  default: {},
});

export const shadows = {
  card: cardShadow ?? {},
  elevated: elevatedShadow ?? {},
  deep: deepShadow ?? {},
  brand: brandShadow ?? {},
} as const;

export type ShadowToken = typeof shadows;
