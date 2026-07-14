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

type Stage = 'INPUT' | 'LOADING' | 'CANDIDATES' | 'PUBLISHING' | 'PUBLISHED';

interface CandidateCard {
  id: number;
  title: string;
  style: string;
}

const LOADING_PHASES = ['检索中...', '分析趋势...', '生成候选...'];

const STYLE_OPTIONS = [
  { label: '跟热点', color: colors.brand.DEFAULT },
  { label: '谐音梗', color: colors.accent.info },
  { label: '反转梗', color: colors.accent.light },
  { label: '抽象艺术', color: colors.ai.DEFAULT },
  { label: '情绪共鸣', color: colors.accent.dark },
];

const MOCK_CANDIDATES: CandidateCard[] = [
  {
    id: 1,
    title: '程序员的三大错觉：这个 bug 很简单 / 明天再改也行 / 这段代码不需要注释',
    style: '跟热点',
  },
  {
    id: 2,
    title: '周一综合症：灵魂还在被窝里，肉体已经在地铁上了',
    style: '情绪共鸣',
  },
  {
    id: 3,
    title: '产品经理：这个需求很简单。开发：这个简单的需求很复杂。',
    style: '反转梗',
  },
];

const ORDER_LABELS = ['1', '2', '3'];

export default function CreateAgentScreen() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('INPUT');
  const [inputText, setInputText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLE_OPTIONS[0]!.label);
  const [loadingPhaseIndex, setLoadingPhaseIndex] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [candidates] = useState<CandidateCard[]>(MOCK_CANDIDATES);

  useEffect(() => {
    if (stage !== 'LOADING') return;
    const interval = setInterval(() => {
      setLoadingPhaseIndex((prev) => (prev + 1) % LOADING_PHASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [stage]);

  const handleGenerate = useCallback(() => {
    setStage('LOADING');
    setLoadingPhaseIndex(0);
    setTimeout(() => {
      setStage('CANDIDATES');
    }, 6000);
  }, []);

  const handleRegenerate = useCallback(() => {
    setStage('LOADING');
    setLoadingPhaseIndex(0);
    setSelectedCandidateId(null);
    setTimeout(() => {
      setStage('CANDIDATES');
    }, 6000);
  }, []);

  const handlePublish = useCallback(() => {
    setStage('PUBLISHING');
    setTimeout(() => {
      setStage('PUBLISHED');
    }, 2000);
  }, []);

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

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
        <Text style={styles.backArrow}>{'<'}</Text>
      </Pressable>
      <Text style={styles.headerTitle}>Pro Agent 造梗</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderInputStage = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.proBadge}>
        <Text style={styles.proBadgeText}>Pro 专属</Text>
      </View>

      <Text style={styles.quotaText}>今日剩余 7/10 次</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="描述你想要的梗主题，Agent 会自动检索热门梗、分析趋势、生成最佳候选..."
          placeholderTextColor={colors.text.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          textAlignVertical="top"
        />
      </View>

      <Text style={styles.sectionLabel}>造梗风格</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.styleScroll}
      >
        {STYLE_OPTIONS.map((option) => {
          const isSelected = selectedStyle === option.label;
          return (
            <Pressable
              key={option.label}
              style={[
                styles.styleCapsule,
                { backgroundColor: isSelected ? option.color : 'transparent' },
                !isSelected && styles.styleCapsuleUnselected,
              ]}
              onPress={() => setSelectedStyle(option.label)}
            >
              <Text
                style={[
                  styles.styleCapsuleText,
                  { color: isSelected ? colors.text.primary : option.color },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.energyText}>消耗 1 能量 · 剩余 4</Text>

      <View style={styles.generateButtonWrapper}>
        <PrimaryButton
          fullWidth
          disabled={inputText.trim().length === 0}
          onPress={handleGenerate}
          size="lg"
        >
          开始生成
        </PrimaryButton>
      </View>
    </ScrollView>
  );

  const renderLoadingStage = () => (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      <Text style={styles.loadingMainText}>Agent 正在检索热门梗...</Text>
      <Text style={styles.loadingPhaseText}>{LOADING_PHASES[loadingPhaseIndex]}</Text>
    </View>
  );

  const renderCandidatesStage = () => (
    <View style={styles.candidatesContainer}>
      <Text style={styles.candidatesTitle}>Agent 为你生成了 3 个候选</Text>

      <ScrollView
        style={styles.candidatesScroll}
        contentContainerStyle={styles.candidatesScrollContent}
      >
        {candidates.map((candidate, index) => {
          const isSelected = selectedCandidateId === candidate.id;
          return (
            <Pressable
              key={candidate.id}
              style={[styles.candidateCard, isSelected && styles.candidateCardSelected]}
              onPress={() => setSelectedCandidateId(candidate.id)}
            >
              <View style={styles.candidateRow}>
                <View style={styles.candidateNumberCircle}>
                  <Text style={styles.candidateNumberText}>{ORDER_LABELS[index]}</Text>
                </View>

                <View style={styles.candidateContent}>
                  <Text style={styles.candidateTitle}>{candidate.title}</Text>
                  <View style={styles.candidateTags}>
                    <View style={styles.candidateStylePill}>
                      <Text style={styles.candidateStylePillText}>{candidate.style}</Text>
                    </View>
                    <View style={styles.aiPill}>
                      <Text style={styles.aiPillText}>AI 生成</Text>
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
        })}
      </ScrollView>

      <View style={styles.bottomActions}>
        <View style={styles.bottomActionRow}>
          <PrimaryButton variant="ghost" onPress={handleRegenerate} size="md">
            重新生成
          </PrimaryButton>
          <View style={styles.publishButtonWrapper}>
            <PrimaryButton
              fullWidth
              disabled={selectedCandidateId === null}
              onPress={handlePublish}
              size="md"
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
  energyText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
    marginBottom: spacing[4],
  },
  generateButtonWrapper: {
    marginTop: spacing[2],
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  loadingMainText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.primary,
    marginTop: spacing[6],
    textAlign: 'center',
  },
  loadingPhaseText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.secondary,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  candidatesContainer: {
    flex: 1,
  },
  candidatesTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.primary,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  candidatesScroll: {
    flex: 1,
  },
  candidatesScrollContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  candidateCard: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.xl,
    padding: spacing[4],
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  candidateCardSelected: {
    backgroundColor: 'rgba(247, 184, 75, 0.08)',
    borderColor: colors.brand.DEFAULT,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  candidateNumberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    marginTop: 1,
  },
  candidateNumberText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
  },
  candidateContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  candidateTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: spacing[2],
  },
  candidateTags: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  candidateStylePill: {
    backgroundColor: 'rgba(247, 184, 75, 0.15)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  candidateStylePillText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.brand.DEFAULT,
  },
  aiPill: {
    backgroundColor: 'rgba(158, 92, 189, 0.15)',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  aiPillText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: colors.ai.DEFAULT,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCircleSelected: {
    borderColor: colors.brand.DEFAULT,
    backgroundColor: colors.brand.DEFAULT,
  },
  selectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text.primary,
  },
  bottomActions: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  bottomActionRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  publishButtonWrapper: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: colors.text.primary,
    marginTop: spacing[6],
    marginBottom: spacing[8],
    textAlign: 'center',
  },
  checkmarkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  checkmarkSymbol: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
  },
});
