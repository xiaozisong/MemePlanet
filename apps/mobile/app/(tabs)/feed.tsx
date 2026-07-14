import { useState, useCallback, useEffect } from 'react';
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
import { SearchIcon, EyeIcon, LiveDotIcon } from '../../src/components/icons';

const CATEGORIES = [
  { key: 'hot', label: '热梗', emoji: '🔥', color: '#E8593B' },
  { key: 'god', label: '神梗', emoji: '✨', color: '#F7B84B' },
  { key: 'cold', label: '冷梗', emoji: '🥶', color: '#70A3EE' },
  { key: 'anime', label: '二次元', emoji: '🎀', color: '#9E5CBD' },
  { key: 'meme', label: '表情包', emoji: '😂', color: '#5ED36A' },
];

const TOP_CREATORS = [
  {
    id: 'c1',
    nickname: '码农小王',
    avatar_url: null,
    followers: 12400,
    title: '当你的代码终于跑通时',
  },
  { id: 'c2', nickname: '摸鱼大师', avatar_url: null, followers: 8600, title: 'AI 帮我写的周报' },
  {
    id: 'c3',
    nickname: '梗王本王',
    avatar_url: null,
    followers: 15300,
    title: '周一早上的你 vs 周五',
  },
  {
    id: 'c4',
    nickname: '人间清醒',
    avatar_url: null,
    followers: 7200,
    title: '我的精神状态belike',
  },
  { id: 'c5', nickname: '社牛新星', avatar_url: null, followers: 9800, title: '这届00后整顿职场' },
];

const FEATURED_MEMES: MemeCardData[] = [
  {
    meme_id: 'f1',
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
    meme_id: 'f2',
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
    meme_id: 'f3',
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
        <LoadingSkeleton variant="feed" count={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: colors.ink.DEFAULT, flex: 1 }} edges={['top']}>
      <FlatList
        data={MOCK_FEED}
        keyExtractor={(item) => item.meme_id}
        renderItem={({ item }) => <MemeCard meme={item} onPress={() => {}} />}
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
        ListHeaderComponent={<FeedHeader searchText={searchText} onChangeSearch={setSearchText} />}
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
  const [cat, setCat] = useState('hot');
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

      <NowLiveSection creators={TOP_CREATORS} />

      <TopCreatorsSection creators={TOP_CREATORS} />

      <FeaturedMemesSection memes={FEATURED_MEMES} />
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

function NowLiveSection({ creators }: { creators: typeof TOP_CREATORS }) {
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
        <Text style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
          热梗 LIVE
        </Text>
        <Text
          style={{
            fontSize: 10,
            fontFamily: 'Poppins_400Regular',
            color: colors.brand.DEFAULT,
            letterSpacing: 0.8,
          }}
        >
          查看全部
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {creators.map((c) => (
          <Pressable
            key={c.id}
            style={{
              width: 270,
              height: 150,
              borderRadius: 16,
              backgroundColor: colors.ink.soft,
              marginRight: 12,
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
              <View
                style={{
                  backgroundColor: '#EB5757',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <LiveDotIcon color="#FFFFFF" size={7} />
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
                    fontFamily: 'Poppins_600SemiBold',
                    color: '#FFFFFF',
                    letterSpacing: 0.5,
                  }}
                >
                  LIVE
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: 'rgba(51,51,51,0.8)',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <EyeIcon color="#FFFFFF" size={12} />
                <Text
                  style={{
                    marginLeft: 4,
                    fontSize: 10,
                    fontFamily: 'Poppins_600SemiBold',
                    color: '#FFFFFF',
                  }}
                >
                  {formatFollowerCount(c.followers)}
                </Text>
              </View>
            </View>
            <View style={{ padding: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <UserAvatar uri={c.avatar_url} size="sm" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 13,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.text.primary,
                  }}
                  numberOfLines={1}
                >
                  {c.nickname}
                </Text>
              </View>
              <Text
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.secondary,
                }}
                numberOfLines={1}
              >
                {c.title}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function TopCreatorsSection({
  creators,
}: {
  creators: {
    id: string;
    nickname: string;
    avatar_url: string | null;
    followers: number;
    title: string;
  }[];
}) {
  return (
    <View style={{ paddingTop: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Poppins_700Bold',
            color: colors.text.primary,
          }}
        >
          热门创作者
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
        {creators.map((creator) => (
          <Pressable
            key={creator.id}
            style={{
              width: 240,
              height: 130,
              borderRadius: 16,
              backgroundColor: colors.ink.soft,
              marginRight: 12,
              padding: 16,
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                alignSelf: 'flex-start',
              }}
            >
              <LiveDotIcon color="#FF4444" size={8} />
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 10,
                  fontFamily: 'Poppins_600SemiBold',
                  color: '#FFFFFF',
                  letterSpacing: 0.5,
                }}
              >
                HOT
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <UserAvatar uri={creator.avatar_url} size="sm" />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.text.primary,
                  }}
                  numberOfLines={1}
                >
                  {creator.nickname}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.text.muted,
                    marginTop: 2,
                  }}
                >
                  {formatFollowerCount(creator.followers)} 粉丝
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function FeaturedMemesSection({ memes }: { memes: MemeCardData[] }) {
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
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Poppins_700Bold',
            color: colors.text.primary,
          }}
        >
          精选梗卡
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
            style={{
              width: 240,
              borderRadius: 16,
              backgroundColor: colors.ink.soft,
              marginRight: 12,
              padding: 16,
            }}
          >
            <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <UserAvatar uri={null} size="sm" />
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

function formatFollowerCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}
