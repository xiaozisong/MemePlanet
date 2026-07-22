import { View, Text, Pressable, Image } from 'react-native';
import { UserAvatar } from './ui/UserAvatar';
import { AiIcon, CommentIcon, EyeIcon, HeartIcon, PlayIcon, ShareIcon, StarIcon } from './icons';
import { colors } from '../theme';

export interface MemeCardData {
  meme_id: string;
  title: string;
  author_nickname: string;
  author_avatar_url?: string | null;
  type: 'text' | 'image' | 'video';
  cover_url?: string | null;
  score_avg: number;
  score_count: number;
  comment_count: number;
  favorite_count: number;
  share_count: number;
  is_ai_generated?: boolean;
  god_trash_status?: 'pending' | 'god' | 'trash' | null;
  tags?: { name: string }[];
  published_at?: string | null;
  /** 视频时长（秒），仅 video 类型使用 */
  duration_sec?: number | null;
}

interface MemeCardProps {
  meme: MemeCardData;
  onPress?: () => void;
}

// ─────────────────────────────────────────────
// 共用子组件（作者信息行 + 互动栏）
// ─────────────────────────────────────────────

function AuthorRow({ meme }: { meme: MemeCardData }) {
  const typeLabel = meme.type === 'text' ? '文字' : meme.type === 'image' ? '图文' : '视频';
  return (
    <View style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
      <UserAvatar uri={meme.author_avatar_url} size="sm" />
      <View style={{ marginLeft: 8, flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Poppins_600SemiBold',
            color: colors.text.primary,
          }}
          numberOfLines={1}
        >
          {meme.author_nickname}
        </Text>
        <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center' }}>
          {meme.is_ai_generated && (
            <View
              style={{
                borderRadius: 6,
                marginRight: 6,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 5,
                paddingVertical: 1,
                backgroundColor: colors.ai.bg,
              }}
            >
              <AiIcon color={colors.ai.DEFAULT} size={9} />
              <Text
                style={{
                  marginLeft: 3,
                  fontSize: 9,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.ai.DEFAULT,
                }}
              >
                AI
              </Text>
            </View>
          )}
          {meme.published_at && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
              }}
            >
              {formatRelativeTime(meme.published_at)}
            </Text>
          )}
        </View>
      </View>
      <View
        style={{
          backgroundColor: colors.ink.elevated,
          borderRadius: 9999,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text style={{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.text.muted }}>
          {typeLabel}
        </Text>
      </View>
    </View>
  );
}

function TagsRow({ tags }: { tags?: { name: string }[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <View style={{ marginBottom: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
      {tags.slice(0, 3).map((tag, i) => (
        <View
          key={i}
          style={{
            backgroundColor: colors.tag.bg,
            borderRadius: 6,
            marginRight: 6,
            marginBottom: 4,
            paddingHorizontal: 7,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'Poppins_500Medium',
              color: colors.tag.text,
            }}
          >
            #{tag.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

function GodTrashBadge({ status }: { status: MemeCardData['god_trash_status'] }) {
  if (status === 'god') {
    return (
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            paddingHorizontal: 7,
            paddingVertical: 2,
            backgroundColor: `${colors.god.DEFAULT}22`,
          }}
        >
          <StarIcon color={colors.god.DEFAULT} size={11} />
          <Text
            style={{
              marginLeft: 4,
              fontSize: 10,
              fontFamily: 'Poppins_600SemiBold',
              color: colors.god.DEFAULT,
            }}
          >
            神梗
          </Text>
        </View>
      </View>
    );
  }
  if (status === 'trash') {
    return (
      <View style={{ marginBottom: 8 }}>
        <View
          style={{
            borderRadius: 8,
            alignSelf: 'flex-start',
            paddingHorizontal: 7,
            paddingVertical: 2,
            backgroundColor: `${colors.trash.DEFAULT}22`,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'Poppins_600SemiBold',
              color: colors.trash.DEFAULT,
            }}
          >
            烂梗
          </Text>
        </View>
      </View>
    );
  }
  return null;
}

function ActionBar({ meme }: { meme: MemeCardData }) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border.DEFAULT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8,
      }}
    >
      <View style={{ marginRight: 14, flexDirection: 'row', alignItems: 'center' }}>
        <StarIcon color={colors.brand.DEFAULT} size={14} />
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'Poppins_400Regular',
            color: colors.text.secondary,
            marginLeft: 3,
          }}
        >
          {meme.score_avg.toFixed(1)}
        </Text>
      </View>
      <View style={{ marginRight: 14, flexDirection: 'row', alignItems: 'center' }}>
        <CommentIcon color={colors.text.secondary} size={14} />
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'Poppins_400Regular',
            color: colors.text.secondary,
            marginLeft: 3,
          }}
        >
          {meme.comment_count}
        </Text>
      </View>
      <View style={{ marginRight: 14, flexDirection: 'row', alignItems: 'center' }}>
        <HeartIcon color={colors.text.secondary} size={14} />
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'Poppins_400Regular',
            color: colors.text.secondary,
            marginLeft: 3,
          }}
        >
          {meme.favorite_count}
        </Text>
      </View>
      <View style={{ marginRight: 14, flexDirection: 'row', alignItems: 'center' }}>
        <ShareIcon color={colors.text.secondary} size={14} />
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'Poppins_400Regular',
            color: colors.text.secondary,
            marginLeft: 3,
          }}
        >
          {meme.share_count}
        </Text>
      </View>
      <View style={{ marginLeft: 'auto' as const, flexDirection: 'row', alignItems: 'center' }}>
        <EyeIcon color={colors.text.muted} size={14} />
        <Text
          style={{
            fontSize: 13,
            fontFamily: 'Poppins_400Regular',
            color: colors.text.muted,
            marginLeft: 3,
          }}
        >
          {meme.score_count}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// 型态 A — 纯文字梗（仿知乎想法流）
// ─────────────────────────────────────────────

function TextRow({ meme, onPress }: { meme: MemeCardData; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.ink.elevated : colors.ink.soft,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      })}
    >
      <AuthorRow meme={meme} />

      {/* 正文摘要 — 字号 16，1.5 行距，知乎想法式阅读 */}
      <Text
        style={{
          fontSize: 16,
          fontFamily: 'Poppins_500Medium',
          color: colors.text.primary,
          lineHeight: 24,
          marginBottom: 8,
        }}
        numberOfLines={5}
      >
        {meme.title}
      </Text>

      <TagsRow tags={meme.tags} />
      <GodTrashBadge status={meme.god_trash_status} />
      <ActionBar meme={meme} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// 型态 B — 图梗（仿小红书）
// ─────────────────────────────────────────────

function ImageRow({ meme, onPress }: { meme: MemeCardData; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.ink.elevated : colors.ink.soft,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      })}
    >
      <AuthorRow meme={meme} />

      {/* 标题 — 1 行 */}
      <Text
        style={{
          fontSize: 15,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.text.primary,
          lineHeight: 20,
          marginBottom: 10,
        }}
        numberOfLines={1}
      >
        {meme.title}
      </Text>

      {/* 封面图（全宽，4:3 比例，小红书风格） */}
      {meme.cover_url && (
        <View style={{ marginBottom: 10, overflow: 'hidden', borderRadius: 12 }}>
          <Image
            source={{ uri: meme.cover_url }}
            style={{ width: '100%', height: 200, borderRadius: 12 }}
            resizeMode="cover"
          />
        </View>
      )}

      <TagsRow tags={meme.tags} />
      <GodTrashBadge status={meme.god_trash_status} />
      <ActionBar meme={meme} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// 型态 C — 视频梗（仿视频号信息流）
// ─────────────────────────────────────────────

function VideoRow({ meme, onPress }: { meme: MemeCardData; onPress?: () => void }) {
  const durationText = meme.duration_sec
    ? `${Math.floor(meme.duration_sec / 60)}:${String(meme.duration_sec % 60).padStart(2, '0')}`
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.ink.elevated : colors.ink.soft,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      })}
    >
      <AuthorRow meme={meme} />

      {/* 视频封面（16:9，居中播放按钮） */}
      {meme.cover_url && (
        <View
          style={{ marginBottom: 10, overflow: 'hidden', borderRadius: 12, position: 'relative' }}
        >
          <Image
            source={{ uri: meme.cover_url }}
            style={{ width: '100%', height: 220, borderRadius: 12 }}
            resizeMode="cover"
          />
          {/* AI 标识左上 */}
          {meme.is_ai_generated && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                left: 8,
                borderRadius: 6,
                backgroundColor: colors.ai.bg,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.ai.DEFAULT,
                }}
              >
                AI
              </Text>
            </View>
          )}
          {/* 时长徽章右下 */}
          {durationText && (
            <View
              style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                borderRadius: 6,
                backgroundColor: 'rgba(0,0,0,0.7)',
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins_600SemiBold',
                  color: '#fff',
                }}
              >
                {durationText}
              </Text>
            </View>
          )}
          {/* 中央播放按钮 */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayIcon size={48} color="rgba(255,255,255,0.85)" />
          </View>
        </View>
      )}

      {/* 标题 — 短标题 */}
      <Text
        style={{
          fontSize: 15,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.text.primary,
          marginBottom: 6,
        }}
        numberOfLines={1}
      >
        {meme.title}
      </Text>

      <TagsRow tags={meme.tags} />
      <GodTrashBadge status={meme.god_trash_status} />
      <ActionBar meme={meme} />
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// 主组件：按 type 分流
// ─────────────────────────────────────────────

export function MemeCard({ meme, onPress }: MemeCardProps) {
  switch (meme.type) {
    case 'text':
      return <TextRow meme={meme} onPress={onPress} />;
    case 'image':
      return <ImageRow meme={meme} onPress={onPress} />;
    case 'video':
      return <VideoRow meme={meme} onPress={onPress} />;
    default:
      return <TextRow meme={meme} onPress={onPress} />;
  }
}

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
