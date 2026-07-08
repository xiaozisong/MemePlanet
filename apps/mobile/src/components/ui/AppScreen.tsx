import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppScreenProps extends ViewProps {
  safeTop?: boolean;
  safeBottom?: boolean;
  scrollable?: boolean;
}

export function AppScreen({
  safeTop = true,
  safeBottom = false,
  children,
  className,
  style,
  ...viewProps
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`bg-ink flex-1 ${className || ''}`}
      style={[
        {
          paddingTop: safeTop ? insets.top : 0,
          paddingBottom: safeBottom ? insets.bottom : 0,
        },
        style,
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
}
