import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, radius } from '../src/theme';

type InterestTag = { key: string; emoji: string; label: string };

const INTEREST_TAGS: InterestTag[] = [
  { key: 'hot', emoji: '🔥', label: '热梗' },
  { key: 'funny', emoji: '😂', label: '搞笑' },
  { key: 'game', emoji: '🎮', label: '游戏' },
  { key: 'movie', emoji: '🎬', label: '影视' },
  { key: 'music', emoji: '🎵', label: '音乐' },
  { key: 'food', emoji: '🍔', label: '美食' },
  { key: 'work', emoji: '💼', label: '职场' },
  { key: 'tech', emoji: '📱', label: '科技' },
  { key: 'sport', emoji: '⚽', label: '体育' },
  { key: 'anime', emoji: '🎨', label: '二次元' },
  { key: 'pet', emoji: '🐱', label: '萌宠' },
  { key: 'love', emoji: '💕', label: '恋爱' },
  { key: 'campus', emoji: '🏠', label: '校园' },
  { key: 'abstract', emoji: '🎭', label: '抽象' },
  { key: 'chicken', emoji: '💪', label: '鸡汤' },
  { key: 'silly', emoji: '🤡', label: '沙雕' },
  { key: 'news', emoji: '🌍', label: '时事' },
  { key: 'finance', emoji: '💰', label: '财经' },
  { key: 'holiday', emoji: '🎄', label: '节日' },
  { key: 'weird', emoji: '🎪', label: '猎奇' },
];

const MIN_SELECTION = 3;

export default function InterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleTag = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const canProceed = selected.length >= MIN_SELECTION;

  const goNext = () => {
    router.replace('/(tabs)/feed');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>选择你感兴趣的梗</Text>
        <Text style={styles.subtitle}>选择 3 个以上，推荐更精准</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {INTEREST_TAGS.map((tag) => {
            const isSelected = selected.includes(tag.key);
            return (
              <Pressable
                key={tag.key}
                onPress={() => toggleTag(tag.key)}
                style={[styles.pill, isSelected ? styles.pillSelected : styles.pillIdle]}
              >
                <Text style={styles.pillEmoji}>{tag.emoji}</Text>
                <Text
                  style={[
                    styles.pillLabel,
                    isSelected ? styles.pillLabelSelected : styles.pillLabelIdle,
                  ]}
                >
                  {tag.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.counter}>已选 {selected.length} 个</Text>
        <Pressable
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
            pressed && canProceed && styles.nextButtonPressed,
          ]}
          onPress={goNext}
        >
          <Text style={[styles.nextText, !canProceed && styles.nextTextDisabled]}>
            {canProceed ? '下一步' : '至少选 3 个'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink.DEFAULT,
  },
  header: {
    paddingHorizontal: layout.pagePadding,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text.muted,
  },
  gridContainer: {
    paddingHorizontal: layout.pagePadding,
    paddingBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    flexBasis: 0,
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillIdle: {
    backgroundColor: colors.ink.soft,
    borderColor: colors.border.DEFAULT,
  },
  pillSelected: {
    backgroundColor: 'rgba(247,184,75,0.2)',
    borderColor: colors.brand.DEFAULT,
  },
  pillEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  pillLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
  },
  pillLabelIdle: {
    color: colors.text.secondary,
  },
  pillLabelSelected: {
    color: colors.brand.DEFAULT,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.pagePadding,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
    gap: 12,
  },
  counter: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text.secondary,
  },
  nextButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.DEFAULT,
  },
  nextButtonPressed: {
    backgroundColor: colors.brand.dark,
  },
  nextButtonDisabled: {
    backgroundColor: colors.ink.elevated,
  },
  nextText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.text.primary,
  },
  nextTextDisabled: {
    color: colors.text.muted,
  },
});
