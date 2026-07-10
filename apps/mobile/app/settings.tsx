import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../src/theme';

export default function SettingsScreen() {
  return (
    <View
      style={{
        backgroundColor: colors.ink.DEFAULT,
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <Text style={{ fontSize: 24, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
        设置
      </Text>
    </View>
  );
}
