import { View, Text, Pressable } from 'react-native';
import { colors } from '../../theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View
      style={{
        paddingHorizontal: 20,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
      }}
    >
      {icon ? (
        <View style={{ marginBottom: 16 }}>{icon}</View>
      ) : (
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎭</Text>
      )}
      <Text
        style={{
          fontSize: 22,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.text.primary,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Poppins_400Regular',
            color: colors.text.secondary,
            marginTop: 8,
            maxWidth: 280,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={{
            backgroundColor: colors.brand.DEFAULT,
            borderRadius: 12,
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary }}
          >
            {actionLabel}
          </Text>
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
    <View
      style={{
        paddingHorizontal: 20,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>😵</Text>
      <Text
        style={{
          fontSize: 22,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.text.primary,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 16,
          fontFamily: 'Poppins_400Regular',
          color: colors.text.secondary,
          marginTop: 8,
          maxWidth: 280,
          textAlign: 'center',
        }}
      >
        {description}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={{
            backgroundColor: colors.ink.elevated,
            borderRadius: 12,
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.brand.DEFAULT }}
          >
            重试
          </Text>
        </Pressable>
      )}
    </View>
  );
}
