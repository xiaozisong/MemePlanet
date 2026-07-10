import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Animated, type DimensionValue } from 'react-native';
import { colors } from '../../theme';

interface SkeletonBoxProps {
  width?: DimensionValue;
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
        backgroundColor: colors.ink.elevated,
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
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        {items.map((i) => (
          <View
            key={i}
            style={{
              marginBottom: 12,
              borderRadius: 16,
              backgroundColor: colors.ink.soft,
              padding: 16,
            }}
          >
            <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
              <SkeletonBox width={40} height={40} borderRadius={20} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <SkeletonBox width={100} height={14} />
                <View style={{ marginTop: 4 }}>
                  <SkeletonBox width={60} height={10} borderRadius={6} />
                </View>
              </View>
            </View>
            <SkeletonBox height={18} />
            <View style={{ marginTop: 8 }}>
              <SkeletonBox width={250} height={18} />
            </View>
            <View style={{ marginTop: 12 }}>
              <SkeletonBox width={350} height={160} borderRadius={12} />
            </View>
            <View style={{ marginTop: 12, flexDirection: 'row' }}>
              <SkeletonBox width={60} height={14} />
              <View style={{ marginLeft: 16 }}>
                <SkeletonBox width={60} height={14} />
              </View>
              <View style={{ marginLeft: 16 }}>
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
      <View style={{ paddingHorizontal: 20, alignItems: 'center', paddingTop: 48 }}>
        <SkeletonBox width={80} height={80} borderRadius={40} />
        <View style={{ marginTop: 16 }}>
          <SkeletonBox width={120} height={20} />
        </View>
        <View style={{ marginTop: 8 }}>
          <SkeletonBox width={80} height={14} />
        </View>
        <View style={{ marginTop: 24, flexDirection: 'row' }}>
          <SkeletonBox width={60} height={30} />
          <View style={{ marginLeft: 32 }}>
            <SkeletonBox width={60} height={30} />
          </View>
          <View style={{ marginLeft: 32 }}>
            <SkeletonBox width={60} height={30} />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'comment') {
    return (
      <View style={{ paddingHorizontal: 20 }}>
        {items.map((i) => (
          <View key={i} style={{ paddingVertical: 8, flexDirection: 'row' }}>
            <SkeletonBox width={32} height={32} borderRadius={16} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <SkeletonBox width={80} height={12} />
              <View style={{ marginTop: 8 }}>
                <SkeletonBox height={14} />
              </View>
              <View style={{ marginTop: 4 }}>
                <SkeletonBox width={200} height={14} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 20 }}>
      {items.map((i) => (
        <View
          key={i}
          style={{
            marginBottom: 12,
            borderRadius: 16,
            backgroundColor: colors.ink.soft,
            padding: 16,
          }}
        >
          <SkeletonBox height={18} />
          <View style={{ marginTop: 8 }}>
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
    <View
      style={{
        backgroundColor: colors.ink.DEFAULT,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      {message && (
        <Text
          style={{
            color: colors.text.secondary,
            marginTop: 16,
            fontSize: 14,
            fontFamily: 'Poppins_400Regular',
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
