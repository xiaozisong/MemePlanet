import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../src/theme';

export default function NotFoundScreen() {
  return (
    <View
      style={{
        backgroundColor: colors.ink.DEFAULT,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary }}>
        404 · 页面不存在
      </Text>
    </View>
  );
}
