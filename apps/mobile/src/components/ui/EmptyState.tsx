import { View, Text, Pressable } from 'react-native';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="px-page flex-1 items-center justify-center py-12">
      {icon && <View className="mb-4">{icon}</View>}
      {!icon && (
        <View className="mb-4">
          <Text className="text-5xl">🎭</Text>
        </View>
      )}
      <Text className="text-text-primary text-title text-center font-semibold">{title}</Text>
      {description && (
        <Text className="text-text-secondary text-body mt-2 max-w-[280px] text-center">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-brand rounded-btn active:bg-brand-dark mt-6 px-6 py-3"
        >
          <Text className="text-btn font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = '出了点问题',
  description = '请稍后再试，或下拉刷新',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="px-page flex-1 items-center justify-center py-12">
      <Text className="mb-4 text-5xl">😵</Text>
      <Text className="text-text-primary text-title text-center font-semibold">{title}</Text>
      <Text className="text-text-secondary text-body mt-2 max-w-[280px] text-center">
        {description}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="bg-ink-elevated rounded-btn active:bg-ink-surface mt-6 px-6 py-3"
        >
          <Text className="text-brand text-btn font-semibold">重试</Text>
        </Pressable>
      )}
    </View>
  );
}
