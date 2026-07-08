import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated } from 'react-native';
import { colorsFlat as themeColors } from '../../theme';

interface SkeletonBoxProps {
  width?: number;
  height?: number;
  borderRadius?: number;
}

function SkeletonBox({ width = 200, height = 16, borderRadius = 8 }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: themeColors['ink-elevated'],
        opacity,
      }}
    />
  );
}

interface LoadingSkeletonProps {
  variant?: 'card' | 'feed' | 'profile' | 'comment';
  count?: number;
}

export function LoadingSkeleton({ variant = 'card', count = 3 }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'feed') {
    return (
      <View className="px-page py-section">
        {items.map((i) => (
          <View key={i} className="mb-card-gap rounded-card bg-ink-soft p-4">
            <View className="mb-3 flex-row items-center">
              <SkeletonBox width={40} height={40} borderRadius={20} />
              <View className="ml-3 flex-1">
                <SkeletonBox width={100} height={14} />
                <View className="mt-1">
                  <SkeletonBox width={60} height={10} borderRadius={6} />
                </View>
              </View>
            </View>
            <SkeletonBox height={18} />
            <View className="mt-2">
              <SkeletonBox width={250} height={18} />
            </View>
            <View className="mt-3">
              <SkeletonBox width={350} height={160} borderRadius={12} />
            </View>
            <View className="mt-3 flex-row">
              <SkeletonBox width={60} height={14} />
              <View className="ml-4">
                <SkeletonBox width={60} height={14} />
              </View>
              <View className="ml-4">
                <SkeletonBox width={60} height={14} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (variant === 'profile') {
    return (
      <View className="px-page items-center pt-12">
        <SkeletonBox width={80} height={80} borderRadius={40} />
        <View className="mt-4">
          <SkeletonBox width={120} height={20} />
        </View>
        <View className="mt-2">
          <SkeletonBox width={80} height={14} />
        </View>
        <View className="mt-6 flex-row">
          <SkeletonBox width={60} height={30} />
          <View className="ml-8">
            <SkeletonBox width={60} height={30} />
          </View>
          <View className="ml-8">
            <SkeletonBox width={60} height={30} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'comment') {
    return (
      <View className="px-page">
        {items.map((i) => (
          <View key={i} className="py-item flex-row">
            <SkeletonBox width={32} height={32} borderRadius={16} />
            <View className="ml-3 flex-1">
              <SkeletonBox width={80} height={12} />
              <View className="mt-2">
                <SkeletonBox height={14} />
              </View>
              <View className="mt-1">
                <SkeletonBox width={200} height={14} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View className="px-page">
      {items.map((i) => (
        <View key={i} className="mb-card-gap rounded-card bg-ink-soft p-4">
          <SkeletonBox height={18} />
          <View className="mt-2">
            <SkeletonBox width={250} height={18} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message }: FullPageLoadingProps) {
  return (
    <View className="bg-ink flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={themeColors.brand} />
      {message && <Text className="text-text-secondary mt-4">{message}</Text>}
    </View>
  );
}
