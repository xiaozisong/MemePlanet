import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, spacing, radius } from '../../src/theme';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { useStartCreation, useCreationStatus, useChooseCandidate } from '../../src/api/creation';

type Stage = 'INPUT' | 'LOADING' | 'PREVIEW' | 'PUBLISHING' | 'PUBLISHED' | 'ERROR';

const VIDEO_STYLES = [
  { label: '实拍混剪', color: colors.brand.DEFAULT },
  { label: '动画短片', color: colors.accent.info! },
  { label: '表情包轮播', color: colors.accent.light! },
  { label: 'AI 数字人', color: colors.ai.DEFAULT },
] as const;

const DURATIONS = [
  { label: '5秒', value: 5 },
  { label: '10秒', value: 10 },
  { label: '15秒', value: 15 },
] as const;

export default function CreateVideoScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('INPUT');
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedStyleColor, setSelectedStyleColor] = useState<string>(colors.brand.DEFAULT);
  const [selectedDuration] = useState(5);
  const [creationId, setCreationId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCreation = useStartCreation();
  const { data: creationResult } = useCreationStatus(creationId);
  const chooseCandidate = useChooseCandidate();

  useEffect(() => {
    if (creationResult?.status === 'ready' || creationResult?.status === 'published') {
      setStage('PREVIEW');
    } else if (creationResult?.status === 'failed') {
      setStage('ERROR');
      setErrorMsg('AI 视频生成失败，请稍后重试');
    }
  }, [creationResult?.status]);

  useEffect(() => {
    if (chooseCandidate.isSuccess) {
      setStage('PUBLISHED');
    } else if (chooseCandidate.isError) {
      setStage('ERROR');
      setErrorMsg(chooseCandidate.error?.message ?? '发布失败');
    }
  }, [chooseCandidate.isSuccess, chooseCandidate.isError]);

  const handleStartGenerate = useCallback(() => {
    setStage('LOADING');
    startCreation.mutate(
      {
        mode: 'text',
        prompt: description,
        style: selectedStyle ?? undefined,
      },
      {
        onSuccess: (data) => {
          setCreationId(data.creation_id);
        },
        onError: (err) => {
          setStage('ERROR');
          setErrorMsg(err.message ?? '视频生成任务提交失败');
        },
      },
    );
  }, [description, selectedStyle, startCreation]);

  const handleRegenerate = useCallback(() => {
    if (!creationId) {
      handleStartGenerate();
      return;
    }
    setStage('LOADING');
    startCreation.mutate(
      {
        mode: 'text',
        prompt: description,
        style: selectedStyle ?? undefined,
      },
      {
        onSuccess: (data) => {
          setCreationId(data.creation_id);
        },
        onError: (err) => {
          setStage('ERROR');
          setErrorMsg(err.message ?? '重新生成失败');
        },
      },
    );
  }, [creationId, description, selectedStyle, startCreation, handleStartGenerate]);

  const handlePublish = useCallback(() => {
    if (!creationId) return;
    setStage('PUBLISHING');
    chooseCandidate.mutate({ creationId, idx: 0 });
  }, [creationId, chooseCandidate]);

  const handleBack = useCallback(() => {
    if (stage === 'INPUT') {
      router.back();
    } else {
      setStage('INPUT');
    }
  }, [stage, router]);

  const handleDone = useCallback(() => {
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
        <Text style={styles.navTitle}>视频造梗</Text>
        <View style={styles.backButton} />
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="描述你想要的视频梗，例如：一个程序员在深夜 debug，屏幕突然弹出 all tests passed..."
        placeholderTextColor={colors.text.disabled}
        multiline
        value={description}
        onChangeText={setDescription}
        textAlignVertical="top"
      />

      <Text style={styles.sectionLabel}>视频风格</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
      >
        {VIDEO_STYLES.map((s) => {
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

      <Text style={styles.sectionLabel}>视频时长</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillContainer}
      >
        {DURATIONS.map((d) => {
          const isSelected = selectedDuration === d.value;
          return (
            <Pressable
              key={d.value}
              onPress={() => {}}
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
                {d.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.energyBar}>
        <Text style={styles.energyText}>消耗 2 能量 · 剩余 3</Text>
      </View>

      <PrimaryButton
        variant="primary"
        size="lg"
        fullWidth
        disabled={description.trim().length === 0 || startCreation.isPending}
        onPress={handleStartGenerate}
        loading={startCreation.isPending}
      >
        开始生成
      </PrimaryButton>
    </ScrollView>
  );

  const renderLoadingStage = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      <Text style={styles.loadingTitle}>AI 正在生成视频梗...</Text>
      <Text style={styles.loadingSubtitle}>预计 10~15 秒</Text>
    </View>
  );

  const renderPreviewStage = () => {
    const candidate = creationResult?.candidates?.[0];
    const imageUrl = candidate?.image_url;
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.previewTitle}>
          为你生成了 {creationResult?.candidates?.length ?? 1} 段视频梗
        </Text>

        <View style={styles.previewCard}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: '100%', height: 280, borderRadius: radius.lg }}
              resizeMode="cover"
            />
          ) : (
            <>
              <Text style={styles.playIcon}>{'▶'}</Text>
              <Text style={styles.previewPlaceholderText}>视频预览</Text>
            </>
          )}
        </View>

        <View style={styles.previewTags}>
          {selectedStyle && (
            <View style={[styles.styleTag, { backgroundColor: `${selectedStyleColor}20` }]}>
              <Text style={[styles.styleTagText, { color: selectedStyleColor }]}>
                {selectedStyle}
              </Text>
            </View>
          )}
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>AI 生成</Text>
          </View>
        </View>

        <View style={styles.previewActions}>
          <PrimaryButton
            variant="ghost"
            size="md"
            onPress={handleRegenerate}
            loading={startCreation.isPending}
          >
            再来一次
          </PrimaryButton>
          <View style={styles.previewActionsRight}>
            <PrimaryButton
              variant="primary"
              size="md"
              onPress={handlePublish}
              disabled={!candidate}
              loading={chooseCandidate.isPending}
            >
              发布
            </PrimaryButton>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderPublishingStage = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      <Text style={styles.loadingTitle}>正在发布...</Text>
    </View>
  );

  const renderPublishedStage = () => (
    <View style={styles.centerContainer}>
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>
      <Text style={styles.successTitle}>发布成功</Text>
      <PrimaryButton variant="primary" size="lg" onPress={handleDone}>
        返回
      </PrimaryButton>
    </View>
  );

  const renderErrorStage = () => (
    <View style={styles.centerContainer}>
      <Text
        style={{ color: colors.status.error, fontSize: 14, marginBottom: 16, textAlign: 'center' }}
      >
        {errorMsg}
      </Text>
      <PrimaryButton variant="primary" size="md" onPress={() => setStage('INPUT')}>
        返回重试
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
      case 'PUBLISHING':
        return renderPublishingStage();
      case 'PUBLISHED':
        return renderPublishedStage();
      case 'ERROR':
        return renderErrorStage();
      default:
        return null;
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
    overflow: 'hidden',
  },
  playIcon: {
    fontSize: 48,
    color: colors.text.muted,
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
