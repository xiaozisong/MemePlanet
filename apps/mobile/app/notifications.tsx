import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon, BellIcon } from '../src/components/icons';
import { colors, layout } from '../src/theme';
import {
  useNotifications,
  useMarkNotifRead,
  useMarkAllNotifsRead,
  type NotificationItem,
  type NotifType,
} from '../src/api/notification';

const TYPE_META: Record<NotifType, { icon: string; color: string; label: string }> = {
  comment: { icon: '💬', color: colors.accent.info, label: '评论' },
  like: { icon: '❤️', color: colors.status.error, label: '赞' },
  legion_invite: { icon: '⚔️', color: colors.brand.DEFAULT, label: '军团邀请' },
  pk_invite: { icon: '🏆', color: colors.status.warning, label: 'PK 邀请' },
  system: { icon: '🔔', color: colors.text.secondary, label: '系统通知' },
};

function NotifCard({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.system;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        paddingHorizontal: layout.pagePadding,
        backgroundColor: item.isRead ? 'transparent' : `${colors.brand.DEFAULT}08`,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: `${meta.color}18`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          marginTop: 2,
        }}
      >
        <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          {!item.isRead && (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: colors.brand.DEFAULT,
                marginRight: 6,
              }}
            />
          )}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_600SemiBold',
              color: item.isRead ? colors.text.secondary : colors.text.primary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.title ?? meta.label}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginLeft: 8,
            }}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {item.body && (
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function formatTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return '刚刚';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}天前`;
    return new Date(iso).toLocaleDateString('zh-CN');
  } catch {
    return '';
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading, isRefetching, refetch } = useNotifications(page);
  const markRead = useMarkNotifRead();
  const markAllRead = useMarkAllNotifsRead();

  const handlePress = useCallback(
    (item: NotificationItem) => {
      if (!item.isRead) markRead.mutate(item.notifId);

      const payload = item.payload as Record<string, unknown>;
      if (item.type === 'comment' || item.type === 'like') {
        const memeId = (payload.memeId as string) ?? (payload.meme_id as string);
        if (memeId) router.push(`/meme/${memeId}`);
      } else if (item.type === 'legion_invite') {
        const legionId = (payload.legionId as string) ?? (payload.legion_id as string);
        if (legionId) router.push(`/legion/${legionId}`);
      } else if (item.type === 'pk_invite') {
        const pkId = (payload.pkId as string) ?? (payload.pk_id as string);
        if (pkId) router.push(`/pk/${pkId}`);
      }
    },
    [markRead, router],
  );

  const list = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const hasMore = data?.hasMore ?? false;

  const renderItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <NotifCard item={item} onPress={() => handlePress(item)} />
    ),
    [handlePress],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: layout.pagePadding,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeftIcon color={colors.text.primary} size={22} />
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BellIcon color={colors.brand.DEFAULT} size={20} />
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins_700Bold',
              color: colors.text.primary,
              marginLeft: 8,
            }}
          >
            通知
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                marginLeft: 8,
                backgroundColor: colors.status.error,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins_600SemiBold',
                  color: '#fff',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <Pressable
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={{ padding: 4 }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins_500Medium',
                color: colors.brand.DEFAULT,
                opacity: markAllRead.isPending ? 0.5 : 1,
              }}
            >
              全部已读
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brand.DEFAULT} size="large" />
        </View>
      ) : list.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
          <BellIcon color={colors.text.muted} size={48} />
          <Text
            style={{
              fontSize: 15,
              fontFamily: 'Poppins_500Medium',
              color: colors.text.muted,
              marginTop: 16,
            }}
          >
            暂无通知
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginTop: 4,
              opacity: 0.6,
            }}
          >
            评论、点赞、邀请会在这里出现
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.notifId}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                setPage(1);
                refetch();
              }}
              tintColor={colors.brand.DEFAULT}
            />
          }
          onEndReached={() => {
            if (hasMore) setPage((p) => p + 1);
          }}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            !hasMore && list.length > 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.text.muted,
                  }}
                >
                  没有更多了
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
