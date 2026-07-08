import { View, Text, Pressable, type PressableProps } from 'react-native';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: React.ReactNode;
  size?: number;
  active?: boolean;
  badge?: number;
}

export function IconButton({
  icon,
  size = 36,
  active = false,
  badge,
  ...pressableProps
}: IconButtonProps) {
  return (
    <Pressable
      className={`active:bg-ink-elevated items-center justify-center rounded-full ${active ? 'bg-ink-soft' : ''}`}
      style={{ width: size, height: size }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      {...pressableProps}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <View
          className="bg-error absolute -right-0.5 -top-0.5 items-center justify-center rounded-full"
          style={{ minWidth: 16, height: 16, paddingHorizontal: 4 }}
          pointerEvents="none"
        >
          <Text className="text-[10px] font-bold text-white">
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
