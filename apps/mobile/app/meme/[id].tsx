import { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, layout, spacing, radius } from '../../src/theme';
import { UserAvatar } from '../../src/components/ui/UserAvatar';

// ----- Types -----

interface TagItem {
  name: string;
}

interface MemeComment {
  id: string;
  author: string;
  avatar: string | null;
  content: string;
  time: string;
  likes: number;
}

interface MemeData {
  meme_id: string;
  title: string;
  author_nickname: string;
  author_avatar: string | null;
  type: 'text' | 'image';
  score_avg: number;
  score_count: number;
  comment_count: number;
  favorite_count: number;
  share_count: number;
  is_ai_generated: boolean;
  god_trash_status: 'god' | 'trash' | null;
  tags: TagItem[];
  published_at: string;
  comments: MemeComment[];
}

// ----- Mock Data -----

const MOCK_MEME: MemeData = {
  meme_id: 'f1',
  title:
    '当你的代码终于跑通时，却发现需求改了——这种绝望，只有程序员才能理解。深夜的办公室只剩下屏幕的蓝光和一颗想回家的心。',
  author_nickname: '码农小王',
  author_avatar: null,
  type: 'text',
  score_avg: 8.5,
  score_count: 42,
  comment_count: 5,
  favorite_count: 128,
  share_count: 15,
  is_ai_generated: true,
  god_trash_status: 'god',
  tags: [{ name: '程序员' }, { name: '日常' }, { name: '深夜加班' }],
  published_at: '2026-07-08T12:00:00Z',
  comments: [
    {
      id: 'c1',
      author: '摸鱼大师',
      avatar: null,
      content: '太真实了，上周刚经历过😭',
      time: '2 小时前',
      likes: 23,
    },
    {
      id: 'c2',
      author: '人间清醒',
      avatar: null,
      content: '产品经理：需求没变啊，就是加了个小功能',
      time: '3 小时前',
      likes: 45,
    },
    {
      id: 'c3',
      author: '社牛新星',
      avatar: null,
      content: '深夜加班的程序员，是这个时代的缩影',
      time: '5 小时前',
      likes: 12,
    },
    {
      id: 'c4',
      author: '梗王本王',
      avatar: null,
      content: '建议加一行：然后老板说"这个很简单吧"',
      time: '6 小时前',
      likes: 67,
    },
    {
      id: 'c5',
      author: 'AI 造梗机',
      avatar: null,
      content: 'AI 表示：这梗我给满分💯',
      time: '8 小时前',
      likes: 8,
    },
  ],
};

// ----- Helpers -----

function timeAgo(dateStr: string): string {
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

// ----- Page Component -----

export default function MemeDetailPage() {
  // route param reserved for future real API integration (currently uses mock data)
  const { id: _id } = useLocalSearchParams<{ id: string }>();
  void _id;
  const router = useRouter();
  const meme = MOCK_MEME;

  const [isFollowed, setIsFollowed] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [godTrashVote, setGodTrashVote] = useState<'none' | 'god' | 'trash'>('none');
  const [isFavorited, setIsFavorited] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const avgStars = Math.round(meme.score_avg / 2);
  const starCount = userRating > 0 ? userRating : avgStars;

  const toggleCommentLike = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleGodTrashVote = (value: 'god' | 'trash') => {
    setGodTrashVote((prev) => (prev === value ? 'none' : value));
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    setCommentText('');
  };

  return (
    <View style={styles.container}>
      {/* ── Top Navigation Bar ── */}
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.topBarButton}>
            <Text style={styles.backIcon}>{'<'}</Text>
          </Pressable>

          <View style={styles.topBarRight}>
            <Pressable onPress={() => {}} style={styles.topBarButton}>
              <Text style={styles.topBarIcon}>{'\u2197'}</Text>
            </Pressable>
            <Pressable onPress={() => setIsFavorited(!isFavorited)} style={styles.topBarButton}>
              <Text style={[styles.topBarIcon, isFavorited && styles.favoritedIcon]}>
                {isFavorited ? '\u2665' : '\u2661'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Main Scrollable Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Meme Card ── */}
        <View style={styles.memeCard}>
          {meme.type === 'text' ? (
            <Text style={styles.memeText}>{meme.title}</Text>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>{'\uD83D\uDDBC'}</Text>
              <Text style={styles.imagePlaceholderText}>图片梗卡</Text>
            </View>
          )}

          {/* AI + God/Trash Badges */}
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

          {/* Tags */}
          {meme.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {meme.tags.map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Author Info Row ── */}
        <View style={styles.authorRow}>
          <View style={styles.authorLeft}>
            <UserAvatar uri={meme.author_avatar} size="sm" />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{meme.author_nickname}</Text>
              <Text style={styles.authorTime}>{timeAgo(meme.published_at)}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setIsFollowed(!isFollowed)}
            style={[styles.followButton, isFollowed && styles.followedButton]}
          >
            <Text style={[styles.followButtonText, isFollowed && styles.followedButtonText]}>
              {isFollowed ? '已关注' : '+ 关注'}
            </Text>
          </Pressable>
        </View>

        {/* ── Rating Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>评分</Text>
              <Text style={styles.sectionScore}>{meme.score_avg}</Text>
              <Text style={styles.sectionMeta}>{meme.score_count} 人评分</Text>
            </View>
          </View>

          {/* 5-Star Rating */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setUserRating(star)} style={styles.starButton}>
                <Text
                  style={[styles.star, star <= starCount ? styles.starFilled : styles.starEmpty]}
                >
                  {star <= starCount ? '\u2605' : '\u2606'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* God / Trash Binary Vote */}
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

        {/* ── Comments Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>评论</Text>
            <Text style={styles.sectionMeta}>{meme.comment_count} 条评论</Text>
          </View>

          <View style={styles.commentsList}>
            {meme.comments.map((comment, idx) => {
              const isLiked = likedComments.has(comment.id);
              const displayLikeCount = comment.likes + (isLiked ? 1 : 0);

              return (
                <View key={comment.id}>
                  {idx > 0 && <View style={styles.commentDivider} />}
                  <View style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <UserAvatar uri={comment.avatar} size="xs" />
                      <Text style={styles.commentAuthor}>{comment.author}</Text>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    <Pressable
                      onPress={() => toggleCommentLike(comment.id)}
                      style={[styles.likeButton, isLiked && styles.likeButtonActive]}
                    >
                      <Text style={styles.likeIcon}>{'\uD83D\uDC4D'}</Text>
                      <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
                        {displayLikeCount}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Comment Input ── */}
      <SafeAreaView edges={['bottom']} style={styles.bottomArea}>
        <View style={styles.bottomInputRow}>
          <TextInput
            style={styles.input}
            placeholder="说点什么..."
            placeholderTextColor={colors.text.muted}
            value={commentText}
            onChangeText={setCommentText}
          />
          <Pressable onPress={handleSendComment} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>{'\u2191'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ----- Styles -----

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink.DEFAULT,
  },

  /* ── Top Navigation Bar ── */
  headerArea: {
    backgroundColor: colors.ink.DEFAULT,
  },
  topBar: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.pagePadding,
  },
  topBarButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.primary,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  topBarIcon: {
    fontSize: 22,
    color: colors.text.primary,
  },
  favoritedIcon: {
    color: colors.brand.DEFAULT,
  },

  /* ── Scroll Area ── */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.pagePadding,
    paddingTop: layout.cardGap,
    paddingBottom: 100,
  },

  /* ── Meme Card ── */
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
  imagePlaceholderIcon: {
    fontSize: 40,
    marginBottom: spacing[2],
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
  },

  /* ── Badges ── */
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
  aiBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.ai.DEFAULT,
  },
  statusBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  godBadge: {
    backgroundColor: 'rgba(247, 184, 75, 0.12)',
  },
  trashBadge: {
    backgroundColor: 'rgba(94, 100, 104, 0.12)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  godBadgeText: {
    color: colors.god.DEFAULT,
  },
  trashBadgeText: {
    color: colors.trash.DEFAULT,
  },

  /* ── Tags ── */
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  tag: {
    backgroundColor: colors.tag.bg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: colors.tag.text,
  },

  /* ── Author Row ── */
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: layout.cardGap,
    paddingHorizontal: spacing[1],
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.primary,
  },
  authorTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
  },
  followButton: {
    height: 32,
    paddingHorizontal: spacing[4],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followedButton: {
    borderColor: colors.text.muted,
    backgroundColor: colors.ink.elevated,
  },
  followButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: colors.brand.DEFAULT,
  },
  followedButtonText: {
    color: colors.text.muted,
  },

  /* ── Rating Section ── */
  section: {
    marginTop: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: colors.text.primary,
  },
  sectionScore: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: colors.brand.DEFAULT,
  },
  sectionMeta: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  starButton: {
    padding: 2,
  },
  star: {
    fontSize: 28,
  },
  starFilled: {
    color: colors.brand.DEFAULT,
  },
  starEmpty: {
    color: colors.border.DEFAULT,
  },

  /* ── Binary Vote Buttons ── */
  binaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[3],
  },
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
  godButtonActive: {
    borderColor: colors.god.DEFAULT,
    backgroundColor: 'rgba(247, 184, 75, 0.12)',
  },
  trashButtonActive: {
    borderColor: colors.trash.DEFAULT,
    backgroundColor: 'rgba(94, 100, 104, 0.12)',
  },
  binaryButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.secondary,
  },
  godButtonTextActive: {
    color: colors.god.DEFAULT,
  },
  trashButtonTextActive: {
    color: colors.trash.light,
  },

  /* ── Comments ── */
  commentsList: {
    marginTop: spacing[3],
  },
  commentDivider: {
    height: 1,
    backgroundColor: colors.border.DEFAULT,
    marginVertical: spacing[3],
  },
  commentItem: {
    gap: spacing[2],
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.text.primary,
  },
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
  likeButtonActive: {},
  likeIcon: {
    fontSize: 14,
  },
  likeCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: colors.text.muted,
  },
  likeCountActive: {
    color: colors.brand.DEFAULT,
  },

  /* ── Bottom Input Bar ── */
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
  sendButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: colors.ink.DEFAULT,
  },
});
