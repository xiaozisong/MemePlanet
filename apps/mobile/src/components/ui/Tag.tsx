import { View, Text, Pressable } from 'react-native';
import { colorsFlat as themeColors } from '../../theme';

type TagVariant =
  'default' | 'brand' | 'accent' | 'success' | 'warning' | 'error' | 'god' | 'trash';

interface TagProps {
  label: string;
  variant?: TagVariant;
  onPress?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
}

const c = (key: string): string => themeColors[key] ?? '#FFFFFF';

const variantStyles: Record<TagVariant, { bg: string; text: string }> = {
  default: { bg: c('ink-elevated'), text: c('text-secondary') },
  brand: { bg: `${c('brand')}22`, text: c('brand') },
  accent: { bg: `${c('accent')}22`, text: c('accent') },
  success: { bg: `${c('status-success')}22`, text: c('status-success') },
  warning: { bg: `${c('status-warning')}22`, text: c('status-warning') },
  error: { bg: `${c('status-error')}22`, text: c('status-error') },
  god: { bg: `${c('god')}22`, text: c('god') },
  trash: { bg: `${c('trash')}22`, text: c('trash') },
};

export function Tag({ label, variant = 'default', onPress, selected, size = 'sm' }: TagProps) {
  const v = variantStyles[variant];
  const sizeStyle =
    size === 'sm'
      ? { paddingHorizontal: 8, paddingVertical: 2 }
      : { paddingHorizontal: 12, paddingVertical: 4 };
  const textFontSize = size === 'sm' ? 11 : 14;
  const selectedBg = selected ? c('brand') : v.bg;
  const selectedText = selected ? c('ink') : v.text;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          ...sizeStyle,
          borderRadius: 8,
          backgroundColor: selectedBg,
        }}
      >
        <Text style={{ fontSize: textFontSize, fontWeight: '600', color: selectedText }}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={{ ...sizeStyle, borderRadius: 8, backgroundColor: v.bg }}>
      <Text style={{ fontSize: textFontSize, fontWeight: '600', color: v.text }}>{label}</Text>
    </View>
  );
}
