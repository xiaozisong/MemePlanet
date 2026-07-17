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
import { colors, spacing, radius } from '../../src/theme';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import {
  useStartCreation,
  useCreationStatus,
  useChooseCandidate,
  useRegenerate,
} from '../../src/api/creation';

type Stage = 'INPUT' | 'LOADING' | 'CANDIDATES' | 'PUBLISHING' | 'PUBLISHED' | 'ERROR';

interface CandidateItem {
  candidate_id: string;
  idx: number;
  content: string | null;
  image_url: string | null;
  self_score: number | null;
}

const LOADING_PHASES = ['检索中...', '分析趋势...', '生成候选...'];

const STYLE_OPTIONS = [
  { label: '跟热点', color: colors.brand.DEFAULT },
  { label: '谐音梗', color: colors.accent.info! },
  { label: '反转梗', color: colors.accent.light! },
  { label: '抽象艺术', color: colors.ai.DEFAULT },
  { label: '情绪共鸣', color: colors.accent.dark! },
];

export default function CreateAgentScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('INPUT');
  const [inputText, setInputText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_OPTIONS[0]!.label);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const [creationId, setCreationId] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCreation = useStartCreation();
  const { data: creationResult } = useCreationStatus(creationId);
  const chooseCandidate = useChooseCandidate();
  const regenerate = useRegenerate();

  // 监听造梗结果
  useEffect(() => {
    if (creationResult?.status === 'ready') {
      setStage('CANDIDATES');
    } else if (creationResult?.status === 'failed') {
      setStage('ERROR');
      setErrorMsg('AI 造梗失败，请稍后重试');
    }
  }, [creationResult?.status]);

  // 监听发布结果
  useEffect(() => {
    if (chooseCandidate.isSuccess) {
      setStage('PUBLISHED');
    } else if (chooseCandidate.isError) {
      setStage('ERROR');
      setErrorMsg(chooseCandidate.error?.message ?? '发布失败');
    }
  }, [chooseCandidate.isSuccess, chooseCandidate.isError]);

  // 加载动画
  useEffect(() => {
    if (stage !== 'LOADING') return;
    const interval = setInterval(() => {
      setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [stage]);

  const handleGenerate = useCallback(async () => {
    setStage('LOADING');
    setLoadingPhaseIndex(0);
    startCreation.mutate(
      {
        mode: 'script',
        prompt: inputText,
        style: selectedStyle,
        agentMode: true,
      },
      {
        onSuccess: (data) => {
          setCreationId(data.creation_id);
        },
        onError: (err) => {
          setStage('ERROR');
          setErrorMsg(err.message ?? '造梗任务提交失败');
        },
      },
    );
  }, [inputText, selectedStyle, startCreation]);

  const handleRegenerate = useCallback(() => {
    if (!creationId) {
      handleGenerate();
      return;
    }
    setStage('LOADING');
    setLoadingPhaseIndex(0);
    setSelectedIdx(null);
    regenerate.mutate(
      { creationId },
      {
        onError: (err) => {
          setStage('ERROR');
          setErrorMsg(err.message ?? '重新生成失败');
        },
      },
    );
  }, [creationId, regenerate, handleGenerate]);

  const handlePublish = useCallback(() => {
    if (!creationId || selectedIdx === null) return;
    setStage('PUBLISHING');
    chooseCandidate.mutate({ creationId, idx: selectedIdx });
  }, [creationId, selectedIdx, chooseCandidate]);

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

  const candidates: CandidateItem[] = creationResult?.candidates ?? [];

  const renderInputStage = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.proBadge}>
        <Text style={styles.proBadgeText}>PRO</Text>
      </View>
      <Text style={styles.quotaText}>今日剩余 10 次 · 自动检索 + RAG 增强</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="输入你想造梗的方向或关键词..."
          placeholderTextColor={colors.text.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
      </View>

      <Text style={styles.sectionLabel}>风格偏好</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.styleScroll}>
        {STYLE_OPTIONS.map((opt) => {
          const active = selectedStyle === opt.label;
          return (
            <Pressable
              key={opt.label}
              onPress={() => setSelectedStyle(opt.label)}
              style={[
                styles.styleCapsule,
                active
                  ? { backgroundColor: `${opt.color}22`, borderColor: opt.color }
                  : styles.styleCapsuleUnselected,
              ]}
            >
              <Text
                style={[styles.styleCapsuleText, { color: active ? opt.color : colors.text.muted }]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <PrimaryButton
        fullWidth
        size="lg"
        onPress={handleGenerate}
        disabled={!inputText.trim() || startCreation.isPending}
        loading={startCreation.isPending}
      >
        Pro 造梗
      </PrimaryButton>
    </ScrollView>
  );

  const renderLoadingStage = () => (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      <Text style={styles.loadingPhaseText}>{LOADING_PHASES[loadingPhaseIndex]}</Text>
    </View>
  );

  const renderCandidatesStage = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.candidatesScroll}
        contentContainerStyle={styles.candidatesScrollContent}
      >
        {candidates.length === 0 ? (
          <Text style={{ color: colors.text.muted, textAlign: 'center', padding: 20 }}>
            暂无候选结果
          </Text>
        ) : (
          candidates.map((candidate, index) => {
            const isSelected = selectedIdx === candidate.idx;
            const title = candidate.content ?? '(无文本)';
            return (
              <Pressable
                key={candidate.candidate_id}
                style={[styles.candidateCard, isSelected && styles.candidateCardSelected]}
                onPress={() => setSelectedIdx(candidate.idx)}
              >
                <View style={styles.candidateRow}>
                  <View style={styles.candidateNumberCircle}>
                    <Text style={styles.candidateNumberText}>{String(index + 1)}</Text>
                  </View>

                  <View style={styles.candidateContent}>
                    <Text style={styles.candidateTitle}>{title}</Text>
                    <View style={styles.candidateTags}>
                      <View
                        style={{
                          borderRadius: 9999,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          backgroundColor: `${colors.brand.DEFAULT}22`,
                          marginRight: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: 'Poppins_600SemiBold',
                            color: colors.brand.DEFAULT,
                          }}
                        >
                          {selectedStyle}
                        </Text>
                      </View>
                      <View
                        style={{
                          borderRadius: 9999,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          backgroundColor: `${colors.ai.DEFAULT}22`,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontFamily: 'Poppins_500Medium',
                            color: colors.ai.DEFAULT,
                          }}
                        >
                          AI 生成
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={[styles.selectionCircle, isSelected && styles.selectionCircleSelected]}
                  >
                    {isSelected && <View style={styles.selectionDot} />}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        <View style={styles.bottomActionRow}>
          <PrimaryButton
            variant="ghost"
            onPress={handleRegenerate}
            size="md"
            loading={regenerate.isPending}
          >
            重新生成
          </PrimaryButton>
          <View style={styles.publishButtonWrapper}>
            <PrimaryButton
              fullWidth
              disabled={selectedIdx === null}
              onPress={handlePublish}
              size="md"
              loading={chooseCandidate.isPending}
            >
              发布选中
            </PrimaryButton>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPublishingStage = () => (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      <Text style={styles.statusText}>正在发布...</Text>
    </View>
  );

  const renderPublishedStage = () => (
    <View style={styles.centeredContainer}>
      <View style={styles.checkmarkCircle}>
        <Text style={styles.checkmarkSymbol}>✓</Text>
      </View>
      <Text style={styles.statusText}>发布成功</Text>
      <PrimaryButton onPress={handleDone} size="lg">
        返回
      </PrimaryButton>
    </View>
  );

  const renderErrorStage = () => (
    <View style={styles.centeredContainer}>
      <Text style={{ color: colors.status.error, fontSize: 16, marginBottom: 16 }}>{errorMsg}</Text>
      <PrimaryButton onPress={() => setStage('INPUT')} size="md">
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
      case 'CANDIDATES':
        return renderCandidatesStage();
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
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <View style={styles.content}>{renderStage()}</View>
    </SafeAreaView>
  );

  function renderHeader() {
    return (
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Pro Agent</Text>
        <View style={styles.headerSpacer} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.primary,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginRight: 36,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ai.DEFAULT,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
    marginBottom: spacing[2],
  },
  proBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.primary,
  },
  quotaText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  inputContainer: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[5],
    minHeight: 120,
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.primary,
    minHeight: 100,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  styleScroll: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[4],
  },
  styleCapsule: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
  },
  styleCapsuleUnselected: {
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  styleCapsuleText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  loadingPhaseText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.primary,
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.status.success}22`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  checkmarkSymbol: {
    fontSize: 28,
    color: colors.status.success,
    fontFamily: 'Poppins_700Bold',
  },
  candidatesScroll: {
    flex: 1,
  },
  candidatesScrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
  },
  candidateCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    backgroundColor: colors.ink.soft,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  candidateCardSelected: {
    borderColor: colors.brand.DEFAULT,
    backgroundColor: `${colors.brand.DEFAULT}08`,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  candidateNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ink.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    marginTop: 2,
  },
  candidateNumberText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
  },
  candidateContent: {
    flex: 1,
  },
  candidateTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: spacing[2],
  },
  candidateTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[3],
    marginTop: 2,
  },
  selectionCircleSelected: {
    borderColor: colors.brand.DEFAULT,
  },
  selectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand.DEFAULT,
  },
  bottomActions: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    paddingTop: spacing[3],
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  publishButtonWrapper: {
    flex: 1,
  },
});
