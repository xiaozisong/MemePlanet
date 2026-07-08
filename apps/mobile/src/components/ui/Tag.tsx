import { View, Text, Pressable } from 'react-native';

type TagVariant =
  'default' | 'brand' | 'accent' | 'success' | 'warning' | 'error' | 'god' | 'trash';

interface TagProps {
  label: string;
  variant?: TagVariant;
  onPress?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
}

const variantStyles: Record<TagVariant, { bg: string; text: string }> = {
  default: { bg: '#252530', text: '#A0A0B0' },
  brand: { bg: 'rgba(255,90,31,0.15)', text: '#FF5A1F' },
  accent: { bg: 'rgba(124,58,255,0.15)', text: '#9D5FFF' },
  success: { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
  warning: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  error: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  god: { bg: 'rgba(255,215,0,0.15)', text: '#FFD700' },
  trash: { bg: 'rgba(139,139,139,0.15)', text: '#8B8B8B' },
};

export function Tag({ label, variant = 'default', onPress, selected, size = 'sm' }: TagProps) {
  const v = variantStyles[variant];
  const sizeStyle =
    size === 'sm'
      ? { paddingHorizontal: 8, paddingVertical: 2 }
      : { paddingHorizontal: 12, paddingVertical: 4 };
  const textFontSize = size === 'sm' ? 11 : 14;
  const selectedBg = selected ? '#FF5A1F' : v.bg;
  const selectedText = selected ? '#FFFFFF' : v.text;

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
