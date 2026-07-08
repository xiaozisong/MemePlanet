import { View, ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  safeTop?: boolean;
  safeBottom?: boolean;
  className?: string;
}

export function AppScreen({
  children,
  scrollable = true,
  safeTop = true,
  safeBottom = true,
  className,
  ...scrollViewProps
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scrollable) {
    return (
      <View
        className={`bg-ink flex-1 ${className || ''}`}
        style={{
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
      className={`bg-ink ${className || ''}`}
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
