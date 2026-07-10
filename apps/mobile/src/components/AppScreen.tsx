import { View, ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

interface AppScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeTop?: boolean;
  safeBottom?: boolean;
}

export function AppScreen({
  children,
  scrollable = true,
  safeTop = true,
  safeBottom = true,
  ...scrollViewProps
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scrollable) {
    return (
      <View
        style={{
          backgroundColor: colors.ink.DEFAULT,
          flex: 1,
          paddingTop: safeTop ? insets.top : 0,
          paddingBottom: safeBottom ? insets.bottom : 0,
        }}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.ink.DEFAULT }}
      contentContainerStyle={{
        paddingTop: safeTop ? insets.top : 0,
        paddingBottom: safeBottom ? insets.bottom + 20 : 20,
      }}
      showsVerticalScrollIndicator={false}
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  );
}
