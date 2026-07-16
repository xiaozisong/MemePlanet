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
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { LoadingSkeleton, EmptyState } from '../../src/components/ui';
import { SearchIcon, EyeIcon } from '../../src/components/icons';
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

      {hotRank.length > 0 && <HotRankSection memes={hotRank} onMemePress={onMemePress} />}
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

/** 热度排行区（替换原来的 FeaturedMemesSection） */
function HotRankSection({
  memes,
  onMemePress,
}: {
  memes: MemeCardData[];
  onMemePress: (id: string) => void;
}) {
  return (
    <View style={{ paddingTop: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
          热度飙升
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: 'Poppins_500Medium',
            color: colors.brand.DEFAULT,
          }}
        >
          查看全部
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {memes.map((meme) => (
          <Pressable
            key={meme.meme_id}
            onPress={() => onMemePress(meme.meme_id)}
            style={{
              width: 240,
              borderRadius: 16,
              backgroundColor: colors.ink.soft,
              marginRight: 12,
              padding: 16,
            }}
          >
            <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <UserAvatar uri={meme.author_avatar_url} size="sm" />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 12,
                  fontFamily: 'Poppins_500Medium',
                  color: colors.text.secondary,
                }}
                numberOfLines={1}
              >
                {meme.author_nickname}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.text.primary,
                lineHeight: 20,
              }}
              numberOfLines={3}
            >
              {meme.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins_700Bold',
                  color: colors.brand.DEFAULT,
                }}
              >
                {meme.score_avg.toFixed(1)}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                  marginLeft: 4,
                }}
              >
                分
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                <EyeIcon color={colors.text.muted} size={14} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.text.muted,
                    marginLeft: 4,
                  }}
                >
                  {meme.favorite_count}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
