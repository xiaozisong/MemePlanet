import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../src/theme';

export default function CreateVideoScreen() {
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
        AI 视频生成
      </Text>
      <Text style={{ fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}>
        M2 接入：豆包 Seedance + 图片 TTS 兜底
      </Text>
    </View>
  );
}
