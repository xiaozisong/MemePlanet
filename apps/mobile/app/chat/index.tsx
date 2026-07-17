import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SendIcon, ShieldIcon, UserIcon } from '../../src/components/icons';
import { colors, layout } from '../../src/theme';
import { useChatRooms, type ChatRoomSummary } from '../../src/api';

export default function ChatListScreen() {
  const { data: rooms, isLoading, isError } = useChatRooms();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.ink.DEFAULT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.brand.DEFAULT} size="large" />
      </View>
    );
  }

  const list = rooms ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: layout.pagePadding,
        paddingTop: 20,
        paddingBottom: 24,
      }}
    >
      <Text style={{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text.muted }}>
        Inbox
      </Text>
      <Text
        style={{
          fontSize: 28,
          fontFamily: 'Poppins_800ExtraBold',
          color: colors.text.primary,
          marginTop: 4,
          marginBottom: 20,
        }}
      >
        消息
      </Text>

      {isError ? (
        <Text style={{ color: colors.status.error, textAlign: 'center', padding: 20 }}>
          加载失败，请下拉刷新重试
        </Text>
      ) : list.length === 0 ? (
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            backgroundColor: colors.ink.soft,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: `${colors.brand.DEFAULT}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <SendIcon color={colors.brand.DEFAULT} size={26} />
          </View>
          <Text
            style={{ fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary }}
          >
            还没有消息
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginTop: 4,
              textAlign: 'center',
            }}
          >
            加入军团后会自动出现军团群聊
          </Text>
        </View>
      ) : (
        list.map((room) => <RoomCard key={room.room_id} room={room} />)
      )}
    </ScrollView>
  );
}

function RoomCard({ room }: { room: ChatRoomSummary }) {
  const isLegion = room.type === 'legion';
  const displayName = isLegion ? room.name : (room.peer_nickname ?? '私聊');
  const lastMsg = room.last_message?.content;
  const lastTime = room.last_message?.sent_at
    ? new Date(room.last_message.sent_at).toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <Pressable
      onPress={() => router.push(`/chat/${room.room_id}`)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.ink.soft,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border.DEFAULT,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: isLegion ? `${colors.brand.DEFAULT}22` : `${colors.accent.DEFAULT}22`,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {isLegion ? (
          <ShieldIcon color={colors.brand.DEFAULT} size={24} />
        ) : (
          <UserIcon color={colors.accent.DEFAULT!} size={24} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Poppins_600SemiBold',
              color: colors.text.primary,
            }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginLeft: 8,
            }}
          >
            {lastTime}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              flex: 1,
              marginRight: 8,
            }}
            numberOfLines={1}
          >
            {lastMsg ?? '暂无消息'}
          </Text>
          {room.unread_count > 0 ? (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.status.error,
                paddingHorizontal: 6,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins_700Bold',
                  color: '#fff',
                }}
              >
                {room.unread_count > 99 ? '99+' : String(room.unread_count)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
