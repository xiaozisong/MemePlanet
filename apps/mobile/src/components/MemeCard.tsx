import { View, Text, Pressable, Image } from 'react-native';
import { UserAvatar } from './ui/UserAvatar';
import { AiIcon, CommentIcon, EyeIcon, HeartIcon, ShareIcon, StarIcon } from './icons';
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
}

interface MemeCardProps {
  meme: MemeCardData;
  onPress?: () => void;
}

export function MemeCard({ meme, onPress }: MemeCardProps) {
  const typeLabel = meme.type === 'text' ? 'TEXT' : meme.type === 'image' ? 'IMG' : 'VIDEO';

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
      {/* 作者信息 */}
      <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
        <UserAvatar uri={meme.author_avatar_url} size="sm" />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text
            style={{ fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary }}
          >
            {meme.author_nickname}
          </Text>
          <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center' }}>
            {meme.is_ai_generated && (
              <View
                style={{
                  borderRadius: 8,
                  marginRight: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: colors.ai.bg,
                }}
              >
                <AiIcon color={colors.ai.DEFAULT} size={11} />
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
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
                style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
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
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 10, fontFamily: 'Poppins_700Bold', color: colors.text.muted }}>
            {typeLabel}
          </Text>
        </View>
      </View>

      {/* 标题 */}
      <Text
        style={{
          fontSize: 22,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.text.primary,
          marginBottom: 8,
        }}
        numberOfLines={2}
      >
        {meme.title}
      </Text>

      {/* 标签 */}
      {meme.tags && meme.tags.length > 0 && (
        <View style={{ marginBottom: 8, flexDirection: 'row' }}>
          {meme.tags.slice(0, 3).map((tag, i) => (
            <View
              key={i}
              style={{
                backgroundColor: colors.ink.elevated,
                borderRadius: 8,
                marginRight: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins_500Medium',
                  color: colors.text.secondary,
                }}
              >
                #{tag.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* 封面图 */}
      {meme.cover_url && (
        <View style={{ marginBottom: 12, overflow: 'hidden', borderRadius: 12 }}>
          <Image
            source={{ uri: meme.cover_url }}
            style={{ width: '100%', height: 180, borderRadius: 12 }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* 神梗/烂梗徽章 */}
      {meme.god_trash_status === 'god' && (
        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              paddingHorizontal: 8,
              paddingVertical: 2,
              backgroundColor: `${colors.god.DEFAULT}22`,
            }}
          >
            <StarIcon color={colors.god.DEFAULT} size={12} />
            <Text
              style={{
                marginLeft: 4,
                fontSize: 11,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.god.DEFAULT,
              }}
            >
              神梗
            </Text>
          </View>
        </View>
      )}
      {meme.god_trash_status === 'trash' && (
        <View style={{ marginBottom: 8 }}>
          <View
            style={{
              borderRadius: 8,
              alignSelf: 'flex-start',
              paddingHorizontal: 8,
              paddingVertical: 2,
              backgroundColor: `${colors.trash.DEFAULT}22`,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.trash.DEFAULT,
              }}
            >
              烂梗
            </Text>
          </View>
        </View>
      )}

      {/* 互动栏 */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border.DEFAULT,
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 8,
        }}
      >
        <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
          <StarIcon color={colors.brand.DEFAULT} size={15} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.secondary,
              marginLeft: 4,
            }}
          >
            {meme.score_avg.toFixed(1)}
          </Text>
        </View>
        <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
          <CommentIcon color={colors.text.secondary} size={15} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.secondary,
              marginLeft: 4,
            }}
          >
            {meme.comment_count}
          </Text>
        </View>
        <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
          <HeartIcon color={colors.text.secondary} size={15} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.secondary,
              marginLeft: 4,
            }}
          >
            {meme.favorite_count}
          </Text>
        </View>
        <View style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
          <ShareIcon color={colors.text.secondary} size={15} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.secondary,
              marginLeft: 4,
            }}
          >
            {meme.share_count}
          </Text>
        </View>
        <View style={{ marginLeft: 'auto' as const, flexDirection: 'row', alignItems: 'center' }}>
          <EyeIcon color={colors.text.muted} size={15} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginLeft: 4,
            }}
          >
            {meme.score_count}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

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
