import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type FlexAlignType,
} from 'react-native';
import { colors } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'lg' | 'md' | 'sm';

interface PrimaryButtonProps extends Omit<PressableProps, 'children'> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantConfig: Record<ButtonVariant, { bg: string; activeBg: string; text: string }> = {
  primary: { bg: colors.brand.DEFAULT, activeBg: colors.brand.dark, text: colors.text.primary },
  secondary: { bg: colors.ink.elevated, activeBg: colors.ink.surface, text: colors.brand.DEFAULT },
  ghost: { bg: 'transparent', activeBg: colors.ink.soft, text: colors.text.secondary },
  danger: { bg: colors.status.error, activeBg: '#cc2222', text: colors.text.primary },
};

const sizeConfig: Record<
  ButtonSize,
  { paddingHorizontal: number; paddingVertical: number; fontSize: number }
> = {
  lg: { paddingHorizontal: 32, paddingVertical: 16, fontSize: 16 },
  md: { paddingHorizontal: 24, paddingVertical: 12, fontSize: 14 },
  sm: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 },
};

export function PrimaryButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  ...pressableProps
}: PrimaryButtonProps) {
  const v = variantConfig[variant];
  const s = sizeConfig[size];

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: pressed ? v.activeBg : v.bg,
        paddingHorizontal: s.paddingHorizontal,
        paddingVertical: s.paddingVertical,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.5 : 1,
        alignSelf: fullWidth ? ('stretch' as FlexAlignType) : 'auto',
        ...(typeof style === 'object' ? style : {}),
      })}
      {...pressableProps}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? colors.text.secondary : colors.text.primary}
        />
      )}
      {!loading && icon}
      <Text style={{ fontSize: s.fontSize, fontFamily: 'Poppins_600SemiBold', color: v.text }}>
        {children}
      </Text>
    </Pressable>
  );
}
