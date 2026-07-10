import {
  View,
  Text,
  Pressable,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { colors } from '../../theme';

interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: React.ReactNode;
  size?: number;
  active?: boolean;
  badge?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  size = 36,
  active = false,
  badge,
  style,
  ...pressableProps
}: IconButtonProps) {
  return (
    <Pressable
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? colors.ink.soft : 'transparent',
        },
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...pressableProps}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -2,
            top: -2,
            backgroundColor: colors.status.error,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 4,
          }}
          pointerEvents="none"
        >
          <Text style={{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
