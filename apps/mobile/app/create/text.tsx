import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../src/theme';

export default function CreateTextScreen() {
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
        文本造梗
      </Text>
      <Text style={{ fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}>
        M1 S3：关键词输入 → 3 候选盲盒 → 微调发布
      </Text>
    </View>
  );
}
