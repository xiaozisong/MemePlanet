import React, { useState, useCallback } from 'react';
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
import { useStartCreation, useCreationStatus, useChooseCandidate } from '../../src/api/creation';

type Stage = 'INPUT' | 'LOADING' | 'CANDIDATES' | 'PUBLISHING' | 'PUBLISHED' | 'ERROR';

const STYLES = [
  { label: '抽象', color: colors.ai.DEFAULT },
  { label: '阴阳', color: colors.brand.DEFAULT },
  { label: '谐音', color: colors.accent.info },
  { label: '反转', color: colors.accent.light },
  { label: '表情包配文', color: colors.accent.dark },
] as const;

export default function CreateTextScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('INPUT');
  const [keyword, setKeyword] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [creationId, setCreationId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCreation = useStartCreation();
  const { data: creationResult, isLoading: statusLoading } = useCreationStatus(creationId);
  const chooseCandidate = useChooseCandidate();

  // 监听造梗结果 → 自动切换到候选展示
  React.useEffect(() => {
    if (creationResult?.status === 'ready' || creationResult?.status === 'published') {
      setStage('CANDIDATES');
    } else if (creationResult?.status === 'failed') {
      setStage('ERROR');
      setErrorMsg('AI 造梗失败，请稍后重试');
    }
  }, [creationResult?.status]);

  // 监听发布结果
  React.useEffect(() => {
    if (chooseCandidate.isSuccess) {
      setStage('PUBLISHED');
    } else if (chooseCandidate.isError) {
      setStage('ERROR');
      setErrorMsg(chooseCandidate.error?.message ?? '发布失败');
    }
  }, [chooseCandidate.isSuccess, chooseCandidate.isError]);

  const handleStartGenerate = useCallback(async () => {
    if (keyword.trim().length === 0) return;
    setStage('LOADING');
    setErrorMsg(null);
    try {
      const res = await startCreation.mutateAsync({
        mode: 'text',
        prompt: keyword,
        style: selectedStyle ?? undefined,
      });
      setCreationId(res.creation_id);
    } catch (err: unknown) {
      setStage('ERROR');
      setErrorMsg(err instanceof Error ? err.message : '造梗失败');
    }
  }, [keyword, selectedStyle, startCreation]);

  const handleRegenerate = useCallback(() => {
    setKeyword('');
    setSelectedStyle(null);
    setSelectedIdx(null);
    setCreationId(null);
    setErrorMsg(null);
    startCreation.reset();
    chooseCandidate.reset();
    setStage('INPUT');
  }, [startCreation, chooseCandidate]);

  const handlePublish = useCallback(async () => {
    if (selectedIdx === null || !creationId) return;
    setStage('PUBLISHING');
    await chooseCandidate.mutateAsync({ creationId, idx: selectedIdx });
  }, [selectedIdx, creationId, chooseCandidate]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const renderInputStage = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>文本造梗</Text>
      <Text style={styles.subtitle}>输入关键词，AI 帮你生成 3 条候选梗</Text>

      <View style={styles.inputSection}>
        <TextInput
          style={styles.textInput}
          placeholder="例如：周一、打工人、摸鱼、产品经理..."
          placeholderTextColor={colors.text.disabled}
          multiline
          numberOfLines={4}
          value={keyword}
          onChangeText={setKeyword}
          textAlignVertical="top"
        />
      </View>

      <Text style={styles.sectionLabel}>选择风格</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stylePillContainer}
      >
        {STYLES.map((s) => {
          const isSelected = selectedStyle === s.label;
          return (
            <Pressable
              key={s.label}
              onPress={() => setSelectedStyle(s.label)}
              style={[
                styles.stylePill,
                {
                  backgroundColor: isSelected ? `${s.color}33` : colors.ink.soft,
                  borderColor: isSelected ? s.color : colors.border.DEFAULT,
                },
              ]}
            >
              <Text
                style={[
                  styles.stylePillText,
                  { color: isSelected ? s.color : colors.text.secondary },
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <PrimaryButton
        variant="primary"
        size="lg"
        fullWidth
        disabled={keyword.trim().length === 0 || startCreation.isPending}
        onPress={handleStartGenerate}
      >
        {startCreation.isPending ? '提交中...' : '开始造梗'}
      </PrimaryButton>
    </ScrollView>
  );

  const renderLoadingStage = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      <Text style={styles.loadingTitle}>{statusLoading ? 'AI 正在造梗中...' : '加载候选...'}</Text>
      <Text style={styles.loadingSubtitle}>预计 8 秒</Text>
    </View>
  );

  const renderCandidatesStage = () => {
    const candidates = creationResult?.candidates ?? [];
    return (
      <View style={styles.candidatesContainer}>
        <Text style={styles.candidatesTitle}>为你生成了 {candidates.length} 个候选</Text>
        <ScrollView
          style={styles.candidatesScroll}
          contentContainerStyle={styles.candidatesScrollContent}
        >
          {candidates.map((candidate, index) => {
            const isSelected = selectedIdx === candidate.idx;
            return (
              <Pressable
                key={candidate.candidate_id}
                onPress={() => setSelectedIdx(candidate.idx)}
                style={[styles.candidateCard, isSelected && styles.candidateCardSelected]}
              >
                <View style={styles.candidateTop}>
                  <View style={styles.candidateIndexPill}>
                    <Text style={styles.candidateIndexText}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  {candidate.self_score != null && (
                    <Text style={styles.selfScore}>AI 评分 {candidate.self_score}</Text>
                  )}
                </View>

                <Text style={styles.candidateContent}>
                  {candidate.content ?? candidate.image_url ?? ''}
                </Text>

                <View style={styles.candidateBottom}>
                  <View style={styles.candidateTags}>
                    <View style={styles.aiTag}>
                      <Text style={styles.aiTagText}>AI 生成</Text>
                    </View>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.bottomBar}>
          <PrimaryButton variant="ghost" size="md" onPress={handleRegenerate}>
            再来一次
          </PrimaryButton>
          <View style={styles.bottomRight}>
            <Text style={styles.selectedCount}>
              {selectedIdx !== null ? '已选 1 个' : '未选择'}
            </Text>
            <PrimaryButton
              variant="primary"
              size="md"
              disabled={selectedIdx === null}
              onPress={handlePublish}
            >
              发布选中
            </PrimaryButton>
          </View>
        </View>
      </View>
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
      <PrimaryButton variant="primary" size="lg" onPress={handleBack}>
        返回
      </PrimaryButton>
    </View>
  );

  const renderErrorStage = () => (
    <View style={styles.centerContainer}>
      <Text style={{ color: '#EF4444', fontSize: 16, marginBottom: 16 }}>{errorMsg}</Text>
      <PrimaryButton variant="primary" size="lg" onPress={handleRegenerate}>
        重试
      </PrimaryButton>
    </View>
  );

  const renderStage = () => {
    switch (stage) {
      case 'INPUT':
        return renderInputStage();
      case 'LOADING':
        return renderLoadingStage();
      case 'CANDIDATES':
        return renderCandidatesStage();
      case 'PUBLISHING':
        return renderPublishingStage();
      case 'PUBLISHED':
        return renderPublishedStage();
      case 'ERROR':
        return renderErrorStage();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{renderStage()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.ink.DEFAULT },
  container: { flex: 1, backgroundColor: colors.ink.DEFAULT },
  scrollView: { flex: 1 },
  scrollContent: { padding: layout.pagePadding },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
    marginBottom: spacing[5],
  },
  inputSection: { marginBottom: spacing[5] },
  textInput: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    padding: spacing[4],
    color: colors.text.primary,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  stylePillContainer: { flexDirection: 'row', gap: spacing[2], paddingVertical: spacing[2] },
  stylePill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  stylePillText: { fontSize: 14, fontFamily: 'Poppins_500Medium' },
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
  candidatesContainer: { flex: 1 },
  candidatesTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
    paddingHorizontal: layout.pagePadding,
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  candidatesScroll: { flex: 1 },
  candidatesScrollContent: { padding: layout.pagePadding, gap: layout.cardGap },
  candidateCard: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  candidateCardSelected: { borderColor: colors.brand.DEFAULT },
  candidateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  candidateIndexPill: {
    backgroundColor: colors.tag.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  candidateIndexText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.brand.DEFAULT,
  },
  selfScore: { fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.text.muted },
  candidateContent: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing[3],
  },
  candidateBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  candidateTags: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  aiTag: {
    backgroundColor: colors.ai.bg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  aiTagText: { fontSize: 11, fontFamily: 'Poppins_500Medium', color: colors.ai.DEFAULT },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { borderColor: colors.brand.DEFAULT },
  checkmark: { fontSize: 14, fontWeight: '700', color: colors.brand.DEFAULT },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layout.pagePadding,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  bottomRight: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  selectedCount: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.text.secondary },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  successIconText: { fontSize: 32, color: colors.text.primary, fontFamily: 'Poppins_700Bold' },
  successTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
    marginBottom: spacing[5],
  },
});
