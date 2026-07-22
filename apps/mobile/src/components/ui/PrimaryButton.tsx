import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type FlexAlignType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradient } from '../../theme';

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

/**
 * 各 variant 的样式配置：
 *   - primary: 粉紫渐变品牌色（霓虹粉紫主题核心 CTA）
 *   - secondary: 次级按钮（深底 + 粉色文字）
 *   - ghost: 透明背景
 *   - danger: 粉红错误渐变
 */
const variantConfig: Record<
  ButtonVariant,
  {
    text: string;
    /** 主态背景 — 渐变用 [from, to]，纯色用单色字符串 */
    bg: string | readonly [string, string];
    activeBg: string;
  }
> = {
  primary: { bg: gradient.brand, activeBg: colors.brand.dark, text: colors.text.primary },
  secondary: { bg: colors.ink.elevated, activeBg: colors.ink.surface, text: colors.brand.DEFAULT },
  ghost: { bg: 'transparent', activeBg: colors.ink.soft, text: colors.text.secondary },
  danger: { bg: gradient.danger, activeBg: colors.status.error, text: colors.text.primary },
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
  const isGradient = Array.isArray(v.bg);

  // 渐变按钮内容：LinearGradient 包裹 children；纯色按钮直接用 Pressable
  const buttonContent = (
    <>
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
    </>
  );

  const innerStyle = {
    paddingHorizontal: s.paddingHorizontal,
    paddingVertical: s.paddingVertical,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  };

  if (isGradient) {
    const [from, to] = v.bg as readonly [string, string];
    return (
      <Pressable
        disabled={disabled || loading}
        style={({ pressed }) => ({
          borderRadius: 12,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: (fullWidth ? 'stretch' : 'auto') as FlexAlignType,
          ...(typeof style === 'object' ? style : {}),
        })}
        {...pressableProps}
      >
        <LinearGradient
          colors={[from, to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[innerStyle, { borderRadius: 12 }]}
        >
          {buttonContent}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: pressed ? v.activeBg : (v.bg as string),
        ...innerStyle,
        borderRadius: 12,
        opacity: disabled ? 0.5 : 1,
        alignSelf: fullWidth ? ('stretch' as FlexAlignType) : 'auto',
        ...(typeof style === 'object' ? style : {}),
      })}
      {...pressableProps}
    >
      {buttonContent}
    </Pressable>
  );
}
