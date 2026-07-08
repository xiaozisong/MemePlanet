import { View, Image, Text } from 'react-native';
import { colorsFlat as themeColors } from '../../theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  uri?: string | null;
  size?: AvatarSize;
  showBadge?: boolean;
  badgeIcon?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

export function UserAvatar({ uri, size = 'md', showBadge, badgeIcon }: UserAvatarProps) {
  const px = sizeMap[size];
  const fontSize = fontSizeMap[size];

  if (uri) {
    return (
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri }}
          style={{
            width: px,
            height: px,
            borderRadius: px / 2,
            backgroundColor: themeColors['ink-elevated'],
          }}
          resizeMode="cover"
        />
        {showBadge && (
          <View
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              backgroundColor: themeColors.accent,
              borderRadius: px * 0.17,
              width: px * 0.35,
              height: px * 0.35,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fontSize * 0.45, color: '#fff', fontWeight: '700' }}>
              {badgeIcon || '✦'}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <View
        style={{
          width: px,
          height: px,
          borderRadius: px / 2,
          backgroundColor: themeColors['ink-elevated'],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize }}>🤡</Text>
      </View>
      {showBadge && (
        <View
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            backgroundColor: themeColors.accent,
            borderRadius: px * 0.17,
            width: px * 0.35,
            height: px * 0.35,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: fontSize * 0.45, color: '#fff', fontWeight: '700' }}>
            {badgeIcon || '✦'}
          </Text>
        </View>
      )}
    </View>
  );
}
