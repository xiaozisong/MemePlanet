import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';
import { colorsFlat as themeColors } from '../../theme';

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

const variantStyles: Record<ButtonVariant, { bg: string; activeBg: string; text: string }> = {
  primary: { bg: 'bg-brand', activeBg: 'bg-brand-dark', text: 'text-white' },
  secondary: { bg: 'bg-ink-elevated', activeBg: 'bg-ink-surface', text: 'text-brand' },
  ghost: { bg: 'bg-transparent', activeBg: 'bg-ink-soft', text: 'text-text-secondary' },
  danger: { bg: 'bg-error', activeBg: 'bg-red-700', text: 'text-white' },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  lg: { container: 'px-8 py-4', text: 'text-btn' },
  md: { container: 'px-6 py-3', text: 'text-caption-bold' },
  sm: { container: 'px-4 py-2', text: 'text-caption' },
};

export function PrimaryButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  className,
  ...pressableProps
}: PrimaryButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      disabled={disabled || loading}
      className={`${v.bg} ${s.container} rounded-btn flex-row items-center justify-center gap-2 active:${v.activeBg} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : ''} ${className || ''}`}
      {...pressableProps}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? themeColors['text-secondary'] : '#fff'}
        />
      )}
      {!loading && icon}
      <Text className={`${v.text} ${s.text} font-semibold`}>{children}</Text>
    </Pressable>
  );
}
