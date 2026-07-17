import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, layout } from '../../src/theme';
import { usePKDetail, useVotePK } from '../../src/api/pk';
import { SwordsIcon, ShieldIcon, CrownIcon, LiveDotIcon } from '../../src/components/icons';

const STATUS_LABEL: Record<string, string> = {
  idle: '待开始',
  challenged: '已挑战',
  preparing: '准备中',
  battling: '进行中',
  judging: '评审中',
  settled: '已结束',
  cancelled: '已取消',
};

const STATUS_COLOR: Record<string, string> = {
  idle: colors.text.muted,
  challenged: colors.accent.info!,
  preparing: colors.accent.DEFAULT,
  battling: colors.status.error,
  judging: colors.accent.info!, // Reuse info for blue
  settled: colors.text.secondary,
  cancelled: colors.text.muted,
};

/** 实时倒计时 */
function useCountdown(target: string | undefined): string {
  const [text, setText] = useState('--:--:--');

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) {
        setText('已结束');
        return;
      }
      const h = Math.floor(diff / 3600_000);
      const m = Math.floor((diff % 3600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setText(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return text;
}

export default function PKDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: match, isLoading, isError, refetch } = usePKDetail(id ?? '');
  const voteMutation = useVotePK();
  const [votedLegion, setVotedLegion] = useState<string | null>(null);
  const countdown = useCountdown(match?.endAt);
  const startCountdown = useCountdown(match?.startAt);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // 实时刷新
  useEffect(() => {
    if (match?.status === 'battling') {
      intervalRef.current = setInterval(() => refetch(), 15000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [match?.status, refetch]);

  const handleVote = useCallback(
    async (legionId: string) => {
      if (!id) return;
      try {
        const result = await voteMutation.mutateAsync({ pkId: id, legionId });
        setVotedLegion(legionId);
        Alert.alert(
          '投票成功',
          `已为军团投出宝贵一票！今日剩余 ${(result as { votesToday?: number })?.votesToday ?? '?'} 票`,
        );
        refetch();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '投票失败';
        Alert.alert('投票失败', msg);
      }
    },
    [id, voteMutation, refetch],
  );

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
        <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
      </View>
    );
  }

  if (isError || !match) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.ink.DEFAULT,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.status.error, fontFamily: 'Poppins_400Regular' }}>
          加载 PK 详情失败
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            backgroundColor: colors.brand.DEFAULT,
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 10,
            marginTop: 16,
          }}
        >
          <Text style={{ color: colors.ink.DEFAULT, fontFamily: 'Poppins_600SemiBold' }}>重试</Text>
        </Pressable>
      </View>
    );
  }

  const isLive = match.status === 'battling';
  const isSettled = match.status === 'settled';
  const totalScore = match.scoreA + match.scoreB;
  const leftPercent = totalScore > 0 ? Math.round((match.scoreA / totalScore) * 100) : 50;
  const isVotable = isLive && !votedLegion;

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
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 24, color: colors.text.primary }}>{'<'}</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
          PK 详情
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View
          style={{
            marginHorizontal: layout.pagePadding,
            backgroundColor: `${STATUS_COLOR[match.status] ?? colors.text.muted}15`,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: `${STATUS_COLOR[match.status] ?? colors.text.muted}30`,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          {isLive && <LiveDotIcon color={colors.status.error} size={8} />}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_600SemiBold',
              color: STATUS_COLOR[match.status] ?? colors.text.muted,
              marginLeft: isLive ? 6 : 0,
            }}
          >
            {STATUS_LABEL[match.status] ?? match.status}
            {isLive ? ` · 剩余 ${countdown}` : ''}
          </Text>
        </View>

        {/* Theme */}
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'Poppins_700Bold',
            color: colors.text.primary,
            textAlign: 'center',
            paddingHorizontal: layout.pagePadding,
            marginBottom: 24,
          }}
        >
          {match.theme}
        </Text>

        {/* VS Section */}
        <View style={{ paddingHorizontal: layout.pagePadding, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Team A */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: `${colors.brand.DEFAULT}22`,
                  borderWidth: 2,
                  borderColor:
                    isSettled && match.winnerId === match.legionA
                      ? colors.brand.DEFAULT
                      : colors.border.DEFAULT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <ShieldIcon
                  color={
                    isSettled && match.winnerId === match.legionA
                      ? colors.brand.DEFAULT
                      : colors.text.secondary
                  }
                  size={34}
                />
              </View>
              {isSettled && match.winnerId === match.legionA && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.brand.DEFAULT,
                    borderRadius: 9999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginBottom: 4,
                  }}
                >
                  <CrownIcon color={colors.ink.DEFAULT} size={12} />
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Poppins_700Bold',
                      color: colors.ink.DEFAULT,
                      marginLeft: 3,
                    }}
                  >
                    胜
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.text.primary,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {match.legionAName || '军团A'}
              </Text>
              <Text
                style={{
                  fontSize: 36,
                  fontFamily: 'Poppins_800ExtraBold',
                  color:
                    isSettled && match.winnerId === match.legionA
                      ? colors.brand.DEFAULT
                      : colors.text.primary,
                }}
              >
                {match.scoreA}
              </Text>
              {isVotable && (
                <Pressable
                  onPress={() => handleVote(match.legionA)}
                  disabled={voteMutation.isPending}
                  style={{
                    backgroundColor: colors.brand.DEFAULT,
                    borderRadius: 9999,
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    marginTop: 8,
                    opacity: voteMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins_600SemiBold',
                      color: colors.ink.DEFAULT,
                    }}
                  >
                    {voteMutation.isPending ? '...' : '投票'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* VS Badge */}
            <View style={{ width: 48, alignItems: 'center' }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isLive ? colors.status.error : colors.ink.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SwordsIcon color={isLive ? colors.ink.DEFAULT : colors.text.muted} size={22} />
              </View>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins_700Bold',
                  color: colors.text.muted,
                  marginTop: 4,
                }}
              >
                VS
              </Text>
            </View>

            {/* Team B */}
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: `${colors.accent.DEFAULT}22`,
                  borderWidth: 2,
                  borderColor:
                    isSettled && match.winnerId === match.legionB
                      ? colors.accent.DEFAULT
                      : colors.border.DEFAULT,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <ShieldIcon
                  color={
                    isSettled && match.winnerId === match.legionB
                      ? colors.accent.DEFAULT
                      : colors.text.secondary
                  }
                  size={34}
                />
              </View>
              {isSettled && match.winnerId === match.legionB && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.accent.DEFAULT,
                    borderRadius: 9999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    marginBottom: 4,
                  }}
                >
                  <CrownIcon color={colors.ink.DEFAULT} size={12} />
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: 'Poppins_700Bold',
                      color: colors.ink.DEFAULT,
                      marginLeft: 3,
                    }}
                  >
                    胜
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.text.primary,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {match.legionBName || '军团B'}
              </Text>
              <Text
                style={{
                  fontSize: 36,
                  fontFamily: 'Poppins_800ExtraBold',
                  color:
                    isSettled && match.winnerId === match.legionB
                      ? colors.accent.DEFAULT
                      : colors.text.primary,
                }}
              >
                {match.scoreB}
              </Text>
              {isVotable && (
                <Pressable
                  onPress={() => handleVote(match.legionB)}
                  disabled={voteMutation.isPending}
                  style={{
                    backgroundColor: colors.accent.DEFAULT,
                    borderRadius: 9999,
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                    marginTop: 8,
                    opacity: voteMutation.isPending ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Poppins_600SemiBold',
                      color: colors.ink.DEFAULT,
                    }}
                  >
                    {voteMutation.isPending ? '...' : '投票'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              backgroundColor: colors.ink.elevated,
              height: 10,
              borderRadius: 5,
              marginTop: 20,
              overflow: 'hidden',
              flexDirection: 'row',
            }}
          >
            <View style={{ flex: leftPercent, backgroundColor: colors.brand.DEFAULT }} />
            <View style={{ flex: 100 - leftPercent, backgroundColor: colors.accent.DEFAULT }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text
              style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
            >
              {leftPercent}%
            </Text>
            <Text
              style={{ fontSize: 11, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
            >
              {100 - leftPercent}%
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View
          style={{
            marginHorizontal: layout.pagePadding,
            backgroundColor: colors.ink.soft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Poppins_600SemiBold',
              color: colors.text.primary,
              marginBottom: 12,
            }}
          >
            PK 信息
          </Text>
          <InfoRow
            label="类型"
            value={
              match.type === 'creation' ? '创作 PK' : match.type === 'vote' ? '投票 PK' : '热度 PK'
            }
          />
          <InfoRow label="开始时间" value={new Date(match.startAt).toLocaleString('zh-CN')} />
          <InfoRow label="结束时间" value={new Date(match.endAt).toLocaleString('zh-CN')} />
          {!isSettled && (
            <InfoRow
              label={isLive ? '剩余时间' : '距开始'}
              value={isLive ? countdown : startCountdown}
            />
          )}
          {isSettled && match.winnerId && (
            <InfoRow
              label="胜者"
              value={
                match.winnerId === match.legionA
                  ? match.legionAName || '军团A'
                  : match.legionBName || '军团B'
              }
            />
          )}
        </View>

        {/* Vote CTA for non-battling states */}
        {!isLive && !isSettled && (
          <View style={{ paddingHorizontal: layout.pagePadding, marginBottom: 48 }}>
            <View
              style={{
                backgroundColor: `${colors.accent.info}15`,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: `${colors.accent.info}30`,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                投票尚未开始，请等待 PK 进入进行阶段
              </Text>
            </View>
          </View>
        )}

        {isSettled && (
          <View style={{ paddingHorizontal: layout.pagePadding, marginBottom: 48 }}>
            <View
              style={{
                backgroundColor: `${colors.text.muted}15`,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.text.secondary,
                }}
              >
                PK 已结束
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                  marginTop: 4,
                }}
              >
                感谢参与！
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.DEFAULT,
      }}
    >
      <Text style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary }}>
        {value}
      </Text>
    </View>
  );
}
