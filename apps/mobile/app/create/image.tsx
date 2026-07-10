import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../src/theme';

export default function CreateImageScreen() {
  return (
    <View
      style={{
        backgroundColor: colors.ink.DEFAULT,
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontFamily: 'Poppins_700Bold',
          color: colors.text.primary,
          marginBottom: 8,
        }}
      >
        图片造梗
      </Text>
      <Text style={{ fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}>
        M1 S3：描述输入 → 风格选择 → 1 候选 → 再来一次
      </Text>
    </View>
  );
}
