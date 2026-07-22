import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout } from '../../src/theme';
import { MemeCard, MemeCardData } from '../../src/components/MemeCard';
import { LoadingSkeleton, EmptyState } from '../../src/components/ui';
import { SearchIcon } from '../../src/components/icons';
import { useHomeFeed, useHotRank } from '../../src/api/feed';

const CATEGORIES = [
  { key: 'hot', label: '热梗', emoji: '🔥', color: '#E8593B' },
  { key: 'god', label: '神梗', emoji: '✨', color: '#F7B84B' },
  { key: 'cold', label: '冷梗', emoji: '🥶', color: '#70A3EE' },
  { key: 'anime', label: '二次元', emoji: '🎀', color: '#9E5CBD' },
  { key: 'meme', label: '表情包', emoji: '😂', color: '#5ED36A' },
];

export default function FeedScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = React.useState('');

  const homeFeed = useHomeFeed();
  const { data: hotRank } = useHotRank(5);

  const memes = homeFeed.data?.pages.flatMap((p) => p.list) ?? [];
  const isRefreshing = homeFeed.isRefetching && !homeFeed.isPending;
  const isLoading = homeFeed.isPending && homeFeed.fetchStatus === 'fetching';

  const onRefresh = useCallback(() => {
    homeFeed.refetch();
  }, [homeFeed]);

  const loadMore = useCallback(() => {
    if (homeFeed.hasNextPage && !homeFeed.isFetchingNextPage) {
      homeFeed.fetchNextPage();
    }
  }, [homeFeed]);

  const onMemePress = useCallback(
    (memeId: string) => {
      router.push(`/meme/${memeId}`);
    },
    [router],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ backgroundColor: colors.ink.DEFAULT, flex: 1 }} edges={['top']}>
        <FeedHeader
          searchText={searchText}
          onChangeSearch={setSearchText}
          hotRank={hotRank?.list ?? []}
          onMemePress={onMemePress}
        />
        <LoadingSkeleton variant="feed" count={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.ink.DEFAULT, flex: 1 }} edges={['top']}>
      <FlatList
        data={memes}
        keyExtractor={(item) => item.meme_id}
        renderItem={({ item }) => (
          <MemeCard meme={item} onPress={() => onMemePress(item.meme_id)} />
        )}
        contentContainerStyle={{
          paddingHorizontal: layout.pagePadding,
          paddingBottom: layout.pagePadding,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.DEFAULT}
            colors={[colors.brand.DEFAULT]}
          />
        }
        ListHeaderComponent={
          <FeedHeader
            searchText={searchText}
            onChangeSearch={setSearchText}
            hotRank={hotRank?.list ?? []}
            onMemePress={onMemePress}
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          homeFeed.isFetchingNextPage ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.text.muted, fontSize: 13 }}>加载中...</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function FeedHeader({
  searchText,
  onChangeSearch,
  hotRank,
  onMemePress,
}: {
  searchText: string;
  onChangeSearch: (text: string) => void;
  hotRank: MemeCardData[];
  onMemePress: (id: string) => void;
}) {
  const [cat, setCat] = React.useState('hot');

  return (
    <View style={{ paddingBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 20,
              fontFamily: 'Poppins_700Bold',
              color: colors.text.primary,
            }}
          >
            发现好梗
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.secondary,
              marginTop: 2,
            }}
          >
            今天也想笑一下
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.ink.soft,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 12,
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
      </View>

      <CategoryGrid categories={CATEGORIES} selected={cat} onSelect={setCat} />

      {hotRank.length > 0 && <MiniHotRankBar memes={hotRank} onMemePress={onMemePress} />}
    </View>
  );
}

function CategoryGrid({
  categories,
  selected,
  onSelect,
}: {
  categories: { key: string; label: string; emoji: string; color: string }[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={{ paddingTop: 20, paddingBottom: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((cat) => {
          const isActive = cat.key === selected;
          return (
            <Pressable
              key={cat.key}
              onPress={() => onSelect(cat.key)}
              style={{
                alignItems: 'center',
                marginRight: 20,
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 22,
                  backgroundColor: cat.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                  opacity: isActive ? 1 : 0.55,
                }}
              >
                <Text style={{ fontSize: 26 }}>{cat.emoji}</Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Poppins_500Medium',
                  fontSize: 10,
                  color: isActive ? colors.text.primary : colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** 顶部迷你热度榜 — 仅展示前 3 名，紧凑横排 */
function MiniHotRankBar({
  memes,
  onMemePress,
}: {
  memes: MemeCardData[];
  onMemePress: (id: string) => void;
}) {
  // 复制并按 score_avg 降序后取前 3 名
  const top3 = [...memes].sort((a, b) => b.score_avg - a.score_avg).slice(0, 3);

  if (top3.length === 0) return null;

  const rankColors = [
    colors.brand.DEFAULT, // 第1名 — 品牌粉紫
    colors.brand.light, // 第2名 — 浅粉
    colors.accent.DEFAULT, // 第3名 — 暖粉
  ];

  return (
    <View
      style={{
        marginTop: 16,
        backgroundColor: colors.ink.soft,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_700Bold',
              color: colors.text.primary,
            }}
          >
            🔥 热度前 3
          </Text>
        </View>
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Poppins_500Medium',
            color: colors.brand.DEFAULT,
          }}
        >
          查看全部 ›
        </Text>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {top3.map((meme, idx) => (
          <Pressable
            key={meme.meme_id}
            onPress={() => onMemePress(meme.meme_id)}
            style={{
              flex: 1,
              marginRight: idx < top3.length - 1 ? 8 : 0,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  backgroundColor: rankColors[idx],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins_700Bold',
                    color: '#fff',
                  }}
                >
                  {idx + 1}
                </Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontFamily: 'Poppins_500Medium',
                  color: colors.text.primary,
                }}
                numberOfLines={1}
              >
                {meme.title}
              </Text>
            </View>
            <View
              style={{
                marginTop: 4,
                marginLeft: 28,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                }}
              >
                @{meme.author_nickname}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.brand.DEFAULT,
                  marginLeft: 8,
                }}
              >
                {meme.score_avg.toFixed(1)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
