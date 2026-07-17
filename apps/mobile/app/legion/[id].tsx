import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, layout } from '../../src/theme';
import { useLegionDetail, useJoinLegion, useLeaveLegion } from '../../src/api/legion';
import { CrownIcon, ShieldIcon, UserIcon } from '../../src/components/icons';

const ROLE_LABEL: Record<string, string> = {
  leader: '团长',
  vice_leader: '副团长',
  elite: '精英',
  member: '成员',
};

const ROLE_COLOR: Record<string, string> = {
  leader: colors.brand.DEFAULT,
  vice_leader: colors.accent.DEFAULT,
  elite: colors.accent.info!,
  member: colors.text.muted,
};

export default function LegionDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: legion, isLoading, isError, refetch } = useLegionDetail(id ?? '');
  const joinMutation = useJoinLegion();
  const leaveMutation = useLeaveLegion();
  const [showAllMembers, setShowAllMembers] = useState(false);

  const handleJoin = useCallback(async () => {
    if (!id) return;
    try {
      await joinMutation.mutateAsync(id);
      Alert.alert('已加入', '你已成功加入该军团');
      refetch();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '请稍后重试';
      Alert.alert('加入失败', msg);
    }
  }, [id, joinMutation, refetch]);

  const handleLeave = useCallback(async () => {
    if (!id) return;
    Alert.alert('确认退出', '确定要退出该军团吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            await leaveMutation.mutateAsync(id);
            Alert.alert('已退出', '你已退出该军团');
            refetch();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '请稍后重试';
            Alert.alert('退出失败', msg);
          }
        },
      },
    ]);
  }, [id, leaveMutation, refetch]);

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

  if (isError || !legion) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.ink.DEFAULT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.status.error, marginBottom: 12 }}>加载失败</Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            backgroundColor: colors.brand.DEFAULT,
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.ink.DEFAULT, fontFamily: 'Poppins_600SemiBold' }}>重试</Text>
        </Pressable>
      </View>
    );
  }

  const members = legion.members ?? [];
  const visibleMembers = showAllMembers ? members : members.slice(0, 20);

  // 按 role 排序：leader → vice_leader → elite → member
  const roleOrder = ['leader', 'vice_leader', 'elite', 'member'];
  const sortedMembers = [...visibleMembers].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role),
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: layout.pagePadding, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24, color: colors.text.primary }}>{'<'}</Text>
          </Pressable>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: `${colors.brand.DEFAULT}22`,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <ShieldIcon color={colors.brand.DEFAULT} size={28} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 24, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}
            >
              {legion.name}
            </Text>
            {legion.slogan ? (
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                  marginTop: 2,
                }}
              >
                {legion.slogan}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.ink.soft,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
            }}
          >
            <Text
              style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.brand.DEFAULT }}
            >
              {legion.member_count}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginTop: 2,
              }}
            >
              成员
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.ink.soft,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
            }}
          >
            <Text
              style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.accent.DEFAULT }}
            >
              {legion.activity_score >= 10000
                ? `${(legion.activity_score / 10000).toFixed(1)}w`
                : String(legion.activity_score)}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginTop: 2,
              }}
            >
              活跃度
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.ink.soft,
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
            }}
          >
            <Text
              style={{ fontSize: 20, fontFamily: 'Poppins_700Bold', color: colors.accent.info! }}
            >
              {legion.pk_wins ?? 0}W / {legion.pk_losses ?? 0}L
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginTop: 2,
              }}
            >
              PK 战绩
            </Text>
          </View>
        </View>

        {/* Join / Leave Buttons */}
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
          <Pressable
            onPress={handleJoin}
            disabled={joinMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: colors.brand.DEFAULT,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              opacity: joinMutation.isPending ? 0.6 : 1,
            }}
          >
            <Text
              style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.ink.DEFAULT }}
            >
              {joinMutation.isPending ? '加入中...' : '加入军团'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleLeave}
            disabled={leaveMutation.isPending}
            style={{
              flex: 1,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.status.error,
              opacity: leaveMutation.isPending ? 0.6 : 1,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.status.error,
              }}
            >
              {leaveMutation.isPending ? '退出中...' : '退出军团'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Theme Tags */}
      {legion.theme_tags && legion.theme_tags.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: layout.pagePadding,
            marginBottom: 16,
          }}
        >
          {legion.theme_tags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: `${colors.accent.DEFAULT}15`,
                borderRadius: 9999,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginRight: 8,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins_500Medium',
                  color: colors.accent.DEFAULT,
                }}
              >
                #{tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Members Section */}
      <View style={{ paddingHorizontal: layout.pagePadding, paddingBottom: 96 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
            成员列表 ({members.length})
          </Text>
          {members.length > 20 ? (
            <Pressable onPress={() => setShowAllMembers(!showAllMembers)}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.brand.DEFAULT,
                }}
              >
                {showAllMembers ? '收起' : '查看全部'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {sortedMembers.length === 0 ? (
          <Text style={{ color: colors.text.muted, textAlign: 'center', padding: 24 }}>
            暂无成员
          </Text>
        ) : (
          sortedMembers.map((member) => (
            <View
              key={member.user_id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.ink.soft,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: `${ROLE_COLOR[member.role] ?? colors.text.muted}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                {member.role === 'leader' ? (
                  <CrownIcon color={colors.brand.DEFAULT} size={20} />
                ) : (
                  <UserIcon color={colors.text.secondary} size={20} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.text.primary,
                  }}
                >
                  {member.nickname}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: `${ROLE_COLOR[member.role] ?? colors.text.muted}15`,
                  borderRadius: 9999,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins_600SemiBold',
                    color: ROLE_COLOR[member.role] ?? colors.text.muted,
                  }}
                >
                  {ROLE_LABEL[member.role] ?? member.role}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
