import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { colorsFlat as themeColors } from '../../src/theme';
import { LoadingSkeleton, EmptyState } from '../../src/components/ui';

// TODO: 替换为实际 API 调用
interface FeedItem {
  id: string;
  title: string;
  author_nickname: string;
  author_avatar_url: string | null;
  type: 'text' | 'image' | 'video';
  cover_url: string | null;
  score_avg: number;
  comment_count: number;
  favorite_count: number;
  is_ai_generated: boolean;
  tags: { name: string }[];
  published_at: string;
}

// 模拟数据 - 后续接入 API 后替换
const MOCK_FEED: FeedItem[] = [
  {
    id: '1',
    title: '当你的代码终于跑通时，却发现需求改了',
    author_nickname: '码农小王',
    author_avatar_url: null,
    type: 'text',
    cover_url: null,
    score_avg: 8.5,
    comment_count: 42,
    favorite_count: 128,
    is_ai_generated: false,
    tags: [{ name: '程序员' }, { name: '日常' }],
    published_at: '2026-07-08T12:00:00Z',
  },
  {
    id: '2',
    title: 'AI 帮我写的周报，老板说比我自己写的有深度',
    author_nickname: '摸鱼大师',
    author_avatar_url: null,
    type: 'text',
    cover_url: null,
    score_avg: 9.1,
    comment_count: 86,
    favorite_count: 256,
    is_ai_generated: true,
    tags: [{ name: 'AI' }, { name: '打工' }],
    published_at: '2026-07-08T10:00:00Z',
  },
  {
    id: '3',
    title: '周一早上的你 vs 周五下午的你',
    author_nickname: '梗王本王',
    author_avatar_url: null,
    type: 'image',
    cover_url: null,
    score_avg: 7.8,
    comment_count: 23,
    favorite_count: 89,
    is_ai_generated: false,
    tags: [{ name: '对比' }, { name: '上班' }],
    published_at: '2026-07-07T18:00:00Z',
  },
];

export default function FeedScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  if (loading) {
    return (
      <View className="bg-ink flex-1">
        <FeedHeader />
        <LoadingSkeleton variant="feed" count={4} />
      </View>
    );
  }

  return (
    <View className="bg-ink flex-1">
      <FeedHeader />
      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.brand!}
            colors={[themeColors.brand!]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="还没有梗"
            description="快去造梗工坊创作第一个梗吧！"
            actionLabel="去造梗"
            onAction={() => router.push('/create')}
          />
        }
        ItemSeparatorComponent={() => <View className="h-card-gap" />}
      />
    </View>
  );
}

function FeedHeader() {
  return (
    <View className="px-page pb-2 pt-4">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-text-primary text-title-lg font-bold">梗星球</Text>
          <Text className="text-text-muted text-caption mt-0.5">发现今日好梗</Text>
        </View>
        <Pressable className="active:opacity-70">
          <View className="bg-ink-soft h-9 w-9 items-center justify-center rounded-full">
            <Text className="text-text-secondary text-sm">🔍</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  const typeEmoji = item.type === 'text' ? '📝' : item.type === 'image' ? '🖼️' : '🎬';
  const aiTag = item.is_ai_generated ? '🤖 AI' : '';

  return (
    <Pressable
      className="rounded-card bg-ink-soft active:bg-ink-elevated p-4"
      onPress={() => {
        // TODO: 跳转详情页
      }}
    >
      {/* 作者行 */}
      <View className="mb-3 flex-row items-center">
        <View className="bg-ink-elevated h-9 w-9 items-center justify-center rounded-full">
          <Text className="text-sm">🤡</Text>
        </View>
        <View className="ml-2 flex-1">
          <Text className="text-text-primary text-subtitle font-semibold">
            {item.author_nickname}
          </Text>
          <View className="mt-0.5 flex-row items-center">
            <Text className="text-text-muted text-caption">
              {formatRelativeTime(item.published_at)}
            </Text>
            {aiTag && (
              <View
                className="rounded-tag ml-2 px-1.5 py-0.5"
                style={{ backgroundColor: 'rgba(124,58,255,0.15)' }}
              >
                <Text className="text-[10px] font-semibold" style={{ color: '#9D5FFF' }}>
                  {aiTag}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text className="text-text-muted text-lg">{typeEmoji}</Text>
      </View>

      {/* 标题 */}
      <Text className="text-text-primary text-title mb-2 font-semibold" numberOfLines={2}>
        {item.title}
      </Text>

      {/* 标签 */}
      {item.tags.length > 0 && (
        <View className="mb-3 flex-row">
          {item.tags.map((tag, i) => (
            <View key={i} className="bg-ink-elevated rounded-tag mr-1.5 px-2 py-0.5">
              <Text className="text-text-secondary text-[11px]">#{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 互动栏 */}
      <View className="border-border flex-row items-center border-t pt-2">
        <View className="mr-4 flex-row items-center">
          <Text className="text-brand mr-1 text-sm">⭐</Text>
          <Text className="text-text-secondary text-caption">{item.score_avg.toFixed(1)}</Text>
        </View>
        <View className="mr-4 flex-row items-center">
          <Text className="text-text-secondary mr-1 text-sm">💬</Text>
          <Text className="text-text-secondary text-caption">{item.comment_count}</Text>
        </View>
        <View className="mr-4 flex-row items-center">
          <Text className="text-text-secondary mr-1 text-sm">♥</Text>
          <Text className="text-text-secondary text-caption">{item.favorite_count}</Text>
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
