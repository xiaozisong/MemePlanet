import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, layout, spacing, radius } from '../../src/theme';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { useMemeDetail } from '../../src/api/meme';
import { useCreateRating, useComments, useCreateComment, useMemeScore } from '../../src/api/rating';
import { trackMemeView } from '../../src/api/feed';

export default function MemeDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // 上报视图（只跑一次，页面挂载时）
  const viewTracked = useState(false);
  if (id && !viewTracked[0]) {
    trackMemeView(id);
    viewTracked[1](true);
  }

  const { data: meme, isLoading: memeLoading } = useMemeDetail(id ?? '');
  const { data: scoreData } = useMemeScore(id ?? '');
  const { data: commentsData, refetch: refetchComments } = useComments(id ?? '');
  const createRating = useCreateRating();
  const createComment = useCreateComment();

  const [, setUserRating] = useState(0);
  const [godTrashVote, setGodTrashVote] = useState<'none' | 'god' | 'trash'>('none');
  const [commentText, setCommentText] = useState('');

  const comments = commentsData?.list ?? [];
  const avgScore = scoreData?.avg_score ?? meme?.score_avg ?? 0;
  const scoreCount = scoreData?.count ?? meme?.score_count ?? 0;

  const handleRate = useCallback(
    async (star: number) => {
      if (!id) return;
      setUserRating(star);
      try {
        await createRating.mutateAsync({ memeId: id, star });
      } catch {
        setUserRating(0);
        Alert.alert('评分失败', '请稍后重试');
      }
    },
    [id, createRating],
  );

  const handleGodTrashVote = useCallback(
    async (value: 'god' | 'trash') => {
      if (!id) return;
      const newValue = godTrashVote === value ? 'none' : value;
      setGodTrashVote(newValue);
      try {
        await createRating.mutateAsync({
          memeId: id,
          star: 0,
          isGodTrashVote: newValue !== 'none',
        });
      } catch {
        setGodTrashVote('none');
        Alert.alert('投票失败', '请稍后重试');
      }
    },
    [id, godTrashVote, createRating],
  );

  const handleSendComment = useCallback(async () => {
    if (!id || !commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    try {
      await createComment.mutateAsync({ memeId: id, content: text });
      await refetchComments();
    } catch {
      setCommentText(text);
      Alert.alert('发送失败', '评论发送失败，请重试');
    }
  }, [id, commentText, createComment, refetchComments]);

  // Loading state
  if (memeLoading || !meme) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.headerArea}>
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.topBarButton}>
              <Text style={styles.backIcon}>{'<'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Nav */}
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.topBarButton}>
            <Text style={styles.backIcon}>{'<'}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.topBarButton}>
            <Text style={styles.topBarIcon}>{'\u2197'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Meme Text Card */}
        <View style={styles.memeCard}>
          {meme.type === 'text' ? (
            <Text style={styles.memeText}>{meme.title}</Text>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>{'\uD83D\uDDBC'}</Text>
              <Text style={styles.imagePlaceholderText}>图片梗卡</Text>
            </View>
          )}

          <View style={styles.badgeRow}>
            {meme.is_ai_generated && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI 辅助创作</Text>
              </View>
            )}
            {meme.god_trash_status && (
              <View
                style={[
                  styles.statusBadge,
                  meme.god_trash_status === 'god' ? styles.godBadge : styles.trashBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    meme.god_trash_status === 'god' ? styles.godBadgeText : styles.trashBadgeText,
                  ]}
                >
                  {meme.god_trash_status === 'god' ? '\uD83D\uDC51 神梗' : '\uD83D\uDDD1 烂梗'}
                </Text>
              </View>
            )}
          </View>

          {meme.tags && meme.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {meme.tags.map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Author Info */}
        <View style={styles.authorRow}>
          <View style={styles.authorLeft}>
            <UserAvatar uri={meme.author?.avatar_url ?? null} size="sm" />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{meme.author?.nickname ?? meme.author_nickname}</Text>
              <Text style={styles.authorTime}>
                {formatDate(meme.published_at ?? meme.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>评分</Text>
              <Text style={styles.sectionScore}>{avgScore.toFixed(1)}</Text>
              <Text style={styles.sectionMeta}>{scoreCount} 人评分</Text>
            </View>
          </View>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => handleRate(star)} style={styles.starButton}>
                <Text
                  style={[
                    styles.star,
                    star <= Math.round(avgScore / 2) ? styles.starFilled : styles.starEmpty,
                  ]}
                >
                  {star <= Math.round(avgScore / 2) ? '\u2605' : '\u2606'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.binaryRow}>
            <Pressable
              onPress={() => handleGodTrashVote('god')}
              style={[styles.binaryButton, godTrashVote === 'god' && styles.godButtonActive]}
            >
              <Text
                style={[
                  styles.binaryButtonText,
                  godTrashVote === 'god' && styles.godButtonTextActive,
                ]}
              >
                {'\uD83D\uDC51'} 神梗
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleGodTrashVote('trash')}
              style={[styles.binaryButton, godTrashVote === 'trash' && styles.trashButtonActive]}
            >
              <Text
                style={[
                  styles.binaryButtonText,
                  godTrashVote === 'trash' && styles.trashButtonTextActive,
                ]}
              >
                {'\uD83D\uDDD1'} 烂梗
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>评论</Text>
            <Text style={styles.sectionMeta}>{comments.length} 条评论</Text>
          </View>

          <View style={styles.commentsList}>
            {comments.map((comment, idx) => (
              <View key={comment.comment_id}>
                {idx > 0 && <View style={styles.commentDivider} />}
                <View style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <UserAvatar uri={null} size="xs" />
                    <Text style={styles.commentAuthor}>{comment.user_id.slice(0, 8)}</Text>
                    <Text style={styles.commentTime}>{formatDate(comment.created_at)}</Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                  <View style={styles.likeButton}>
                    <Text style={styles.likeIcon}>{'\uD83D\uDC4D'}</Text>
                    <Text style={styles.likeCount}>{comment.like_count}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Comment Input */}
      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <View style={styles.bottomInputRow}>
          <TextInput
            style={styles.input}
            placeholder="说点什么..."
            placeholderTextColor={colors.text.muted}
            value={commentText}
            onChangeText={setCommentText}
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!commentText.trim()}
            style={[styles.sendButton, !commentText.trim() && { opacity: 0.4 }]}
          >
            <Text style={styles.sendButtonText}>{'\u2191'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function formatDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHour < 24) return `${diffHour} 小时前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink.DEFAULT },
  headerArea: { backgroundColor: colors.ink.DEFAULT },
  topBar: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.pagePadding,
  },
  topBarButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, fontFamily: 'Poppins_400Regular', color: colors.text.primary },
  topBarIcon: { fontSize: 22, color: colors.text.primary },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.pagePadding,
    paddingTop: layout.cardGap,
    paddingBottom: 100,
  },
  memeCard: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    padding: spacing[5],
    alignItems: 'center',
  },
  memeText: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: colors.ink.elevated,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: { fontSize: 40, marginBottom: spacing[2] },
  imagePlaceholderText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
    alignItems: 'center',
  },
  aiBadge: {
    backgroundColor: colors.ai.bg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  aiBadgeText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.ai.DEFAULT },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  godBadge: { backgroundColor: 'rgba(247, 184, 75, 0.12)' },
  trashBadge: { backgroundColor: 'rgba(94, 100, 104, 0.12)' },
  statusBadgeText: { fontSize: 12, fontFamily: 'Poppins_500Medium' },
  godBadgeText: { color: colors.god.DEFAULT },
  trashBadgeText: { color: colors.trash.DEFAULT },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3] },
  tag: {
    backgroundColor: colors.tag.bg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: colors.tag.text },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: layout.cardGap,
    paddingHorizontal: spacing[1],
  },
  authorLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary },
  authorTime: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.text.muted },
  section: { marginTop: spacing[6] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  sectionTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text.primary },
  sectionScore: { fontSize: 24, fontFamily: 'Poppins_800ExtraBold', color: colors.brand.DEFAULT },
  sectionMeta: { fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.text.muted },
  starsRow: { flexDirection: 'row', gap: spacing[1], marginTop: spacing[3] },
  starButton: { padding: 2 },
  star: { fontSize: 28 },
  starFilled: { color: colors.brand.DEFAULT },
  starEmpty: { color: colors.border.DEFAULT },
  binaryRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[3] },
  binaryButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[1],
  },
  godButtonActive: { borderColor: colors.god.DEFAULT, backgroundColor: 'rgba(247, 184, 75, 0.12)' },
  trashButtonActive: {
    borderColor: colors.trash.DEFAULT,
    backgroundColor: 'rgba(94, 100, 104, 0.12)',
  },
  binaryButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.secondary,
  },
  godButtonTextActive: { color: colors.god.DEFAULT },
  trashButtonTextActive: { color: colors.trash.light },
  commentsList: { marginTop: spacing[3] },
  commentDivider: { height: 1, backgroundColor: colors.border.DEFAULT, marginVertical: spacing[3] },
  commentItem: { gap: spacing[2] },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  commentAuthor: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
    marginLeft: 'auto',
  },
  commentContent: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.secondary,
    lineHeight: 20,
    paddingLeft: spacing[2],
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    alignSelf: 'flex-start',
  },
  likeIcon: { fontSize: 14 },
  likeCount: { fontSize: 12, fontFamily: 'Poppins_400Regular', color: colors.text.muted },
  bottomArea: {
    backgroundColor: colors.ink.soft,
    borderTopWidth: 1,
    borderTopColor: colors.border.DEFAULT,
  },
  bottomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.pagePadding,
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: colors.ink.elevated,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[4],
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.primary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.ink.DEFAULT },
});
