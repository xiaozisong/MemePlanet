import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeftIcon, SendIcon } from '../../src/components/icons';
import { colors, layout } from '../../src/theme';
import { useChatMessages, useSendMessage, type ChatMessage } from '../../src/api';

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { data, isLoading, isError } = useChatMessages(roomId);
  const sendMessage = useSendMessage();
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const list = data?.list ?? [];

  useEffect(() => {
    if (list.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [list.length]);

  function handleSend() {
    const content = text.trim();
    if (!content) return;
    sendMessage.mutate({ roomId, msgType: 'text', content });
    setText('');
  }

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: layout.pagePadding,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.DEFAULT,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeftIcon color={colors.text.primary} size={24} />
        </Pressable>
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Poppins_700Bold',
            color: colors.text.primary,
            marginLeft: 12,
          }}
        >
          聊天
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.pagePadding, paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {isError ? (
          <Text style={{ color: colors.status.error, textAlign: 'center', padding: 20 }}>
            加载失败，请下拉刷新
          </Text>
        ) : list.length === 0 ? (
          <Text
            style={{
              color: colors.text.muted,
              textAlign: 'center',
              padding: 20,
              fontFamily: 'Poppins_400Regular',
            }}
          >
            还没有消息，发一条打个招呼吧
          </Text>
        ) : (
          list.map((msg) => <MessageBubble key={msg.message_id} msg={msg} />)
        )}
      </ScrollView>

      {/* Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: layout.pagePadding,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border.DEFAULT,
          backgroundColor: colors.ink.soft,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="发送消息…"
          placeholderTextColor={colors.text.muted}
          multiline
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            borderRadius: 20,
            backgroundColor: colors.ink.elevated,
            color: colors.text.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            fontFamily: 'Poppins_400Regular',
            fontSize: 15,
            marginRight: 10,
          }}
          editable={!sendMessage.isPending}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor:
              !text.trim() || sendMessage.isPending ? colors.ink.elevated : colors.brand.DEFAULT,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SendIcon color={colors.ink.DEFAULT} size={20} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  return (
    <View
      style={{
        alignSelf: msg.is_mine ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        backgroundColor: msg.is_mine ? colors.brand.DEFAULT : colors.ink.soft,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 10,
      }}
    >
      {!msg.is_mine && msg.sender_nickname ? (
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Poppins_600SemiBold',
            color: colors.text.muted,
            marginBottom: 4,
          }}
        >
          {msg.sender_nickname}
        </Text>
      ) : null}
      <Text
        style={{
          fontSize: 15,
          fontFamily: 'Poppins_400Regular',
          color: msg.is_mine ? colors.ink.DEFAULT : colors.text.primary,
          lineHeight: 20,
        }}
      >
        {msg.content ?? ''}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: 'Poppins_400Regular',
          color: msg.is_mine ? `${colors.ink.DEFAULT}AA` : colors.text.muted,
          alignSelf: 'flex-end',
          marginTop: 4,
        }}
      >
        {new Date(msg.sent_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
}
