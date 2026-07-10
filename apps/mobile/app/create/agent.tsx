import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../src/theme';

export default function CreateAgentScreen() {
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
        Pro Agent 造梗
      </Text>
      <Text style={{ fontSize: 16, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}>
        M2 接入：RAG 检索 → 3 候选 → 自评选优（10 次/日硬配额 + 日预算熔断）
      </Text>
    </View>
  );
}
