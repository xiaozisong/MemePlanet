import { View, Text, Pressable, Image } from 'react-native';
import { UserAvatar } from './ui/UserAvatar';

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
  const typeEmoji = meme.type === 'text' ? '📝' : meme.type === 'image' ? '🖼️' : '🎬';

  return (
    <Pressable
      onPress={onPress}
      className="mb-card-gap rounded-card bg-ink-soft active:bg-ink-elevated p-4"
    >
      {/* 作者信息 */}
      <View className="mb-3 flex-row items-center">
        <UserAvatar uri={meme.author_avatar_url} size="sm" />
        <View className="ml-2 flex-1">
          <Text className="text-text-primary text-subtitle font-semibold">
            {meme.author_nickname}
          </Text>
          <View className="mt-0.5 flex-row items-center">
            {meme.is_ai_generated && (
              <View
                className="rounded-tag mr-2 px-1.5 py-0.5"
                style={{ backgroundColor: 'rgba(124,58,255,0.15)' }}
              >
                <Text className="text-[10px] font-semibold" style={{ color: '#9D5FFF' }}>
                  AI
                </Text>
              </View>
            )}
            {meme.published_at && (
              <Text className="text-text-muted text-caption">
                {formatRelativeTime(meme.published_at)}
              </Text>
            )}
          </View>
        </View>
        <Text className="text-text-muted text-lg">{typeEmoji}</Text>
      </View>

      {/* 标题 */}
      <Text className="text-text-primary text-title mb-2 font-semibold" numberOfLines={2}>
        {meme.title}
      </Text>

      {/* 标签 */}
      {meme.tags && meme.tags.length > 0 && (
        <View className="mb-2 flex-row">
          {meme.tags.slice(0, 3).map((tag, i) => (
            <View key={i} className="bg-ink-elevated rounded-tag mr-1.5 px-2 py-0.5">
              <Text className="text-text-secondary text-[11px]">#{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 封面图 */}
      {meme.cover_url && (
        <View className="mb-3 overflow-hidden rounded-lg">
          <Image
            source={{ uri: meme.cover_url }}
            style={{ width: '100%', height: 180, borderRadius: 12 }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* 神梗/烂梗徽章 */}
      {meme.god_trash_status === 'god' && (
        <View className="mb-2">
          <View
            className="rounded-tag px-2 py-0.5"
            style={{ backgroundColor: 'rgba(255,215,0,0.15)' }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: '#FFD700' }}>
              ✦ 神梗
            </Text>
          </View>
        </View>
      )}
      {meme.god_trash_status === 'trash' && (
        <View className="mb-2">
          <View
            className="rounded-tag px-2 py-0.5"
            style={{ backgroundColor: 'rgba(139,139,139,0.15)' }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: '#8B8B8B' }}>
              烂梗
            </Text>
          </View>
        </View>
      )}

      {/* 互动栏 */}
      <View className="border-border flex-row items-center border-t pt-2">
        <View className="mr-4 flex-row items-center">
          <Text className="text-brand mr-1 text-sm">⭐</Text>
          <Text className="text-text-secondary text-caption">{meme.score_avg.toFixed(1)}</Text>
        </View>
        <View className="mr-4 flex-row items-center">
          <Text className="text-text-secondary mr-1 text-sm">💬</Text>
          <Text className="text-text-secondary text-caption">{meme.comment_count}</Text>
        </View>
        <View className="mr-4 flex-row items-center">
          <Text className="text-text-secondary mr-1 text-sm">♥</Text>
          <Text className="text-text-secondary text-caption">{meme.favorite_count}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-text-secondary mr-1 text-sm">↗</Text>
          <Text className="text-text-secondary text-caption">{meme.share_count}</Text>
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
