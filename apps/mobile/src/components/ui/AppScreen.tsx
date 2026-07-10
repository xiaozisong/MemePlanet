import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

interface AppScreenProps extends ViewProps {
  safeTop?: boolean;
  safeBottom?: boolean;
}

export function AppScreen({
  safeTop = true,
  safeBottom = false,
  children,
  style,
  ...viewProps
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          backgroundColor: colors.ink.DEFAULT,
          flex: 1,
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
