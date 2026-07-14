import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, spacing, radius } from '../../src/theme';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';

type Stage = 'INPUT' | 'LOADING' | 'PREVIEW' | 'PUBLISHED';

const IMAGE_STYLES = [
  { label: '写实', color: colors.accent.info },
  { label: '卡通', color: colors.brand.DEFAULT },
  { label: '像素风', color: colors.accent.dark },
  { label: '水彩画', color: colors.accent.light },
  { label: '二次元', color: colors.ai.DEFAULT },
] as const;

const CANVAS_RATIOS = [
  { label: '1:1', value: '1:1' },
  { label: '3:4', value: '3:4' },
  { label: '16:9', value: '16:9' },
] as const;

export default function CreateImageScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('INPUT');
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedStyleColor, setSelectedStyleColor] = useState<string>(colors.brand.DEFAULT);

  useEffect(() => {
    if (stage === 'LOADING') {
      const timer = setTimeout(() => {
        setStage('PREVIEW');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleStartGenerate = useCallback(() => {
    setStage('LOADING');
  }, []);

  const handleRegenerate = useCallback(() => {
    setDescription('');
    setSelectedStyle(null);
    setSelectedRatio('1:1');
    setStage('INPUT');
  }, []);

  const handlePublish = useCallback(() => {
    setStage('PUBLISHED');
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderInputStage = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.navBar}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </Pressable>
        <Text style={styles.navTitle}>图片造梗</Text>
        <View style={styles.backButton} />
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="描述你想要的梗图，例如：一只猫在办公室加班，桌上堆满文件..."
        placeholderTextColor={colors.text.disabled}
        multiline
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />

      <Text style={styles.sectionLabel}>选择风格</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
      >
        {IMAGE_STYLES.map((s) => {
          const isSelected = selectedStyle === s.label;
          return (
            <Pressable
              key={s.label}
              onPress={() => {
                setSelectedStyle(s.label);
                setSelectedStyleColor(s.color);
              }}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? `${s.color}33` : colors.ink.soft,
                  borderColor: isSelected ? s.color : colors.border.DEFAULT,
                },
              ]}
            >
              <Text
                style={[styles.pillText, { color: isSelected ? s.color : colors.text.secondary }]}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>画布比例</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
      >
        {CANVAS_RATIOS.map((r) => {
          const isSelected = selectedRatio === r.value;
          return (
            <Pressable
              key={r.value}
              onPress={() => setSelectedRatio(r.value)}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected ? `${colors.brand.DEFAULT}33` : colors.ink.soft,
                  borderColor: isSelected ? colors.brand.DEFAULT : colors.border.DEFAULT,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? colors.brand.DEFAULT : colors.text.secondary },
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.energyBar}>
        <Text style={styles.energyText}>消耗 1 能量 · 剩余 4</Text>
      </View>

      <PrimaryButton
        variant="primary"
        size="lg"
        fullWidth
        disabled={description.trim().length === 0}
        onPress={handleStartGenerate}
      >
        开始生成
      </PrimaryButton>
    </ScrollView>
  );

  const renderLoadingStage = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      <Text style={styles.loadingTitle}>AI 正在绘制中...</Text>
      <Text style={styles.loadingSubtitle}>预计 5 秒</Text>
    </View>
  );

  const renderPreviewStage = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.previewTitle}>为你生成了 1 张梗图</Text>

      <View style={styles.previewCard}>
        <Text style={styles.previewEmoji}>🖼️</Text>
        <Text style={styles.previewPlaceholderText}>梗图预览</Text>
      </View>

      <View style={styles.previewTags}>
        <View style={[styles.styleTag, { backgroundColor: `${selectedStyleColor}20` }]}>
          <Text style={[styles.styleTagText, { color: selectedStyleColor }]}>
            {selectedStyle || '卡通'}
          </Text>
        </View>
        <View style={styles.aiTag}>
          <Text style={styles.aiTagText}>AI 生成</Text>
        </View>
      </View>

      <View style={styles.previewActions}>
        <PrimaryButton variant="ghost" size="md" onPress={handleRegenerate}>
          再来一次
        </PrimaryButton>
        <View style={styles.previewActionsRight}>
          <PrimaryButton variant="primary" size="md" onPress={handlePublish}>
            发布
          </PrimaryButton>
        </View>
      </View>
    </ScrollView>
  );

  const renderPublishedStage = () => (
    <View style={styles.centerContainer}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>发布成功</Text>
      <PrimaryButton variant="primary" size="lg" onPress={handleBack}>
        返回
      </PrimaryButton>
    </View>
  );

  const renderStage = () => {
    switch (stage) {
      case 'INPUT':
        return renderInputStage();
      case 'LOADING':
        return renderLoadingStage();
      case 'PREVIEW':
        return renderPreviewStage();
      case 'PUBLISHED':
        return renderPublishedStage();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{renderStage()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ink.DEFAULT,
  },
  container: {
    flex: 1,
    backgroundColor: colors.ink.DEFAULT,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.pagePadding,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
  },
  navTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
  },
  textInput: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    padding: spacing[4],
    color: colors.text.primary,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: spacing[5],
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  pillContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },
  pill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  energyBar: {
    marginTop: spacing[5],
    marginBottom: spacing[4],
  },
  energyText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.pagePadding,
  },
  loadingTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.primary,
    marginTop: spacing[5],
  },
  loadingSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
    marginTop: spacing[2],
  },
  previewTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
    marginBottom: spacing[5],
  },
  previewCard: {
    width: '100%',
    height: 300,
    backgroundColor: colors.ink.elevated,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  previewEmoji: {
    fontSize: 48,
    marginBottom: spacing[2],
  },
  previewPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
  },
  previewTags: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  styleTag: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  styleTagText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  aiTag: {
    backgroundColor: colors.ai.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  aiTagText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.ai.DEFAULT,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  successIconText: {
    fontSize: 32,
    color: colors.text.primary,
    fontFamily: 'Poppins_700Bold',
  },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
    marginBottom: spacing[5],
  },
});
