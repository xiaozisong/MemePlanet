import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, layout } from '../../src/theme';
import { MemeCard, MemeCardData } from '../../src/components/MemeCard';
import { LoadingSkeleton, EmptyState } from '../../src/components/ui';
import { SearchIcon } from '../../src/components/icons';

const CATEGORIES = [
  { key: 'hot', label: '热梗🔥' },
  { key: 'god', label: '神梗✨' },
  { key: 'cold', label: '冷梗🥶' },
  { key: 'anime', label: '二次元🎀' },
  { key: 'meme', label: '表情包😂' },
  { key: 'daily', label: '日常☕' },
  { key: 'game', label: '游戏🎮' },
  { key: 'ai', label: 'AI 生成🤖' },
];

const MOCK_FEED: MemeCardData[] = [
  {
    meme_id: '1',
    title: '当你的代码终于跑通时，却发现需求改了',
    author_nickname: '码农小王',
    type: 'text',
    score_avg: 8.5,
    score_count: 42,
    comment_count: 42,
    favorite_count: 128,
    share_count: 15,
    is_ai_generated: false,
    god_trash_status: 'god',
    tags: [{ name: '程序员' }, { name: '日常' }],
    published_at: '2026-07-08T12:00:00Z',
  },
  {
    meme_id: '2',
    title: 'AI 帮我写的周报，老板说比我自己写的有深度',
    author_nickname: '摸鱼大师',
    type: 'text',
    score_avg: 9.1,
    score_count: 86,
    comment_count: 86,
    favorite_count: 256,
    share_count: 43,
    is_ai_generated: true,
    god_trash_status: 'god',
    tags: [{ name: 'AI' }, { name: '打工' }],
    published_at: '2026-07-08T10:00:00Z',
  },
  {
    meme_id: '3',
    title: '周一早上的你 vs 周五下午的你',
    author_nickname: '梗王本王',
    type: 'image',
    score_avg: 7.8,
    score_count: 23,
    comment_count: 23,
    favorite_count: 89,
    share_count: 8,
    tags: [{ name: '对比' }, { name: '上班' }],
    published_at: '2026-07-07T18:00:00Z',
  },
  {
    meme_id: '4',
    title: '这届00后整顿职场：面试官先给我发一份岗位说明书',
    author_nickname: '社牛新星',
    type: 'text',
    score_avg: 8.2,
    score_count: 34,
    comment_count: 67,
    favorite_count: 189,
    share_count: 22,
    is_ai_generated: false,
    god_trash_status: 'god',
    tags: [{ name: '职场' }, { name: '00后' }],
    published_at: '2026-07-07T14:00:00Z',
  },
  {
    meme_id: '5',
    title: '我的精神状态belike：想躺平但良心不允许，想奋斗但身体不允许',
    author_nickname: '人间清醒',
    type: 'text',
    score_avg: 7.6,
    score_count: 51,
    comment_count: 104,
    favorite_count: 312,
    share_count: 56,
    is_ai_generated: true,
    tags: [{ name: '精神状态' }, { name: '打工人' }],
    published_at: '2026-07-06T20:00:00Z',
  },
];

export default function FeedScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('hot');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

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
      <SafeAreaView style={{ backgroundColor: colors.ink.DEFAULT, flex: 1 }} edges={['top']}>
        <FeedHeader searchText={searchText} onChangeSearch={setSearchText} />
        <CategoryBar
          categories={CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        <LoadingSkeleton variant="feed" count={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.ink.DEFAULT, flex: 1 }} edges={['top']}>
      <FeedHeader searchText={searchText} onChangeSearch={setSearchText} />
      <CategoryBar
        categories={CATEGORIES}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.meme_id}
        renderItem={({ item }) => (
          <MemeCard
            meme={item}
            onPress={() => {
              // TODO: 跳转详情页
            }}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: layout.pagePadding,
          paddingBottom: layout.pagePadding,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.DEFAULT}
            colors={[colors.brand.DEFAULT]}
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
        ItemSeparatorComponent={() => <View style={{ height: layout.cardGap }} />}
      />
    </SafeAreaView>
  );
}

function FeedHeader({
  searchText,
  onChangeSearch,
}: {
  searchText: string;
  onChangeSearch: (text: string) => void;
}) {
  return (
    <View style={{ paddingHorizontal: layout.pagePadding, paddingBottom: 8, paddingTop: 16 }}>
      {/* 标题 */}
      <View
        style={{
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 24,
              fontFamily: 'Poppins_800ExtraBold',
              color: colors.text.primary,
            }}
          >
            梗星球
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            发现今日好梗
          </Text>
        </View>
      </View>

      {/* 搜索栏 */}
      <Pressable
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.ink.soft,
          borderRadius: radius.lg,
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <SearchIcon color={colors.text.muted} size={18} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 10,
            fontFamily: 'Poppins_400Regular',
            fontSize: 14,
            color: colors.text.primary,
          }}
          placeholder="搜索梗、用户、标签..."
          placeholderTextColor={colors.text.disabled}
          value={searchText}
          onChangeText={onChangeSearch}
        />
      </Pressable>
    </View>
  );
}

function CategoryBar({
  categories,
  selected,
  onSelect,
}: {
  categories: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={{ paddingHorizontal: layout.pagePadding - 4, paddingBottom: 12, paddingTop: 4 }}>
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = item.key === selected;
          return (
            <Pressable
              onPress={() => onSelect(item.key)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: radius.pill,
                backgroundColor: isActive ? colors.brand.DEFAULT : colors.ink.soft,
                marginHorizontal: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins_500Medium',
                  fontSize: 14,
                  color: isActive ? '#0A0A0A' : colors.text.secondary,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
