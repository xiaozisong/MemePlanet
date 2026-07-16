import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, radius } from '../src/theme';
import { useInterestDictionary, useUpdateInterests } from '../src/api/user';
import { ApiError } from '@memestar/shared';

const MIN_SELECTION = 3;

export default function InterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: dict, isLoading: dictLoading } = useInterestDictionary();
  const updateInterests = useUpdateInterests();

  const tags = dict?.tags ?? [];
  const canProceed = selected.length >= MIN_SELECTION;

  // 登录后已有兴趣标签则自动跳过
  useEffect(() => {
    // 静默获取 - 有标签理论上不会进入此页面
  }, []);

  const toggleTag = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const goNext = async () => {
    if (!canProceed) return;
    try {
      await updateInterests.mutateAsync(selected);
      router.replace('/(tabs)/feed');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '保存失败，请重试');
    }
  };

  if (dictLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
          <Text style={{ color: colors.text.muted, marginTop: 12 }}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>选择你感兴趣的梗</Text>
        <Text style={styles.subtitle}>选择 {MIN_SELECTION} 个以上，推荐更精准</Text>
      </View>

      <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {tags.map((tag) => {
            const isSelected = selected.includes(tag.key);
            return (
              <Pressable
                key={tag.key}
                onPress={() => toggleTag(tag.key)}
                style={[styles.pill, isSelected ? styles.pillSelected : styles.pillIdle]}
              >
                <Text style={styles.pillEmoji}>{tag.emoji ?? ''}</Text>
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
        {error && <Text style={{ color: '#EF4444', marginTop: 8, fontSize: 13 }}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.counter}>已选 {selected.length} 个</Text>
        <Pressable
          disabled={!canProceed || updateInterests.isPending}
          style={({ pressed }) => [
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
            pressed && canProceed && styles.nextButtonPressed,
          ]}
          onPress={goNext}
        >
          {updateInterests.isPending ? (
            <ActivityIndicator size="small" color={colors.ink.DEFAULT} />
          ) : (
            <Text style={[styles.nextText, !canProceed && styles.nextTextDisabled]}>
              {canProceed ? '下一步' : `至少选 ${MIN_SELECTION} 个`}
            </Text>
          )}
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
