import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LiveDotIcon, ShieldIcon, SwordsIcon, UserIcon } from '../../src/components/icons';
import { colors, layout } from '../../src/theme';
import { useActivePKs, type PKMatchSummary } from '../../src/api/pk';

export default function PKScreen() {
  const router = useRouter();
  const { data: matches, isLoading, isError } = useActivePKs();

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

  const list = matches ?? [];
  const activeCount = list.filter((m) => m.status === 'battling').length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: layout.pagePadding, paddingTop: 20, paddingBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              style={{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text.muted }}
            >
              Battle Arena
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Poppins_800ExtraBold',
                color: colors.text.primary,
                marginTop: 4,
              }}
            >
              PK 大厅
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.brand.DEFAULT,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SwordsIcon color={colors.ink.DEFAULT} size={21} />
          </View>
        </View>

        {/* Hero Card */}
        <View
          style={{
            backgroundColor: colors.ink.soft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            marginTop: 20,
            overflow: 'hidden',
          }}
        >
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 9999,
                  backgroundColor: `${colors.status.error}15`,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  marginRight: 8,
                }}
              >
                <LiveDotIcon color={colors.status.error} size={7} />
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: 'Poppins_700Bold',
                    color: colors.status.error,
                    marginLeft: 4,
                  }}
                >
                  LIVE
                </Text>
              </View>
              <Text
                style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
              >
                今日热战推荐
              </Text>
            </View>
            <Text
              style={{ fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}
            >
              谁才是今晚神梗军团
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.secondary,
                marginTop: 4,
              }}
            >
              实时比分、投票入口和军团对抗
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderTopColor: colors.border.DEFAULT,
            }}
          >
            <ArenaMetric label="进行中" value={String(activeCount)} />
            <ArenaMetric label="总场次" value={String(list.length)} />
            <ArenaMetric label="战报" value="26" />
          </View>
        </View>
      </View>

      {/* Matches */}
      <View style={{ paddingHorizontal: layout.pagePadding }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
            正在进行
          </Text>
          <Text
            style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.brand.DEFAULT }}
          >
            赛程
          </Text>
        </View>
        {isError ? (
          <Text style={{ color: colors.status.error, textAlign: 'center', padding: 20 }}>
            加载失败，请下拉刷新重试
          </Text>
        ) : list.length === 0 ? (
          <Text style={{ color: colors.text.muted, textAlign: 'center', padding: 20 }}>
            暂无进行中的 PK，快来创建一场吧
          </Text>
        ) : (
          list.map((match) => <MatchCard key={match.pkId} match={match} />)
        )}
      </View>

      {/* Create PK CTA */}
      <View style={{ paddingHorizontal: layout.pagePadding, paddingTop: 12, paddingBottom: 96 }}>
        <View
          style={{
            backgroundColor: colors.ink.soft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            padding: 16,
          }}
        >
          <Text
            style={{ fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary }}
          >
            发起一场 PK
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginTop: 4,
            }}
          >
            选择两个军团，设定主题与时间，开始对决
          </Text>
          <Pressable
            onPress={() => router.push('/pk/create')}
            style={{
              backgroundColor: colors.brand.DEFAULT,
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 12,
              marginTop: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.ink.DEFAULT,
                textAlign: 'center',
              }}
            >
              创建 PK
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function ArenaMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
      <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.brand.DEFAULT }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'Poppins_400Regular',
          color: colors.text.muted,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function MatchCard({ match }: { match: PKMatchSummary }) {
  const router = useRouter();
  const total = match.scoreA + match.scoreB;
  const leftPercent = total > 0 ? Math.round((match.scoreA / total) * 100) : 50;
  const isLive = match.status === 'battling';
  const elapsed = Date.now() - new Date(match.startAt).getTime();
  const elapsedMin = Math.max(0, Math.floor(elapsed / 60000));
  const timeText = `${String(Math.floor(elapsedMin / 60)).padStart(2, '0')}:${String(elapsedMin % 60).padStart(2, '0')}`;
  const viewerText =
    match.participant_count != null
      ? match.participant_count >= 1000
        ? `${(match.participant_count / 1000).toFixed(1)}k`
        : String(match.participant_count)
      : '—';

  return (
    <Pressable
      onPress={() => router.push(`/pk/${match.pkId}`)}
      style={{
        backgroundColor: colors.ink.soft,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border.DEFAULT,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isLive && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 9999,
                backgroundColor: `${colors.status.error}15`,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginRight: 8,
              }}
            >
              <LiveDotIcon color={colors.status.error} size={6} />
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Poppins_700Bold',
                  color: colors.status.error,
                  marginLeft: 4,
                }}
              >
                LIVE
              </Text>
            </View>
          )}
          <Text
            style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
          >
            {timeText}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <UserIcon color={colors.text.muted} size={14} />
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginLeft: 4,
            }}
          >
            {viewerText}
          </Text>
        </View>
      </View>

      <Text
        style={{
          fontSize: 18,
          fontFamily: 'Poppins_600SemiBold',
          color: colors.text.primary,
          marginBottom: 16,
        }}
      >
        {match.theme}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TeamBlock name={match.legionAName || '未知军团'} score={match.scoreA} align="left" />
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.brand.DEFAULT,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 12,
          }}
        >
          <SwordsIcon color={colors.ink.DEFAULT} size={22} />
        </View>
        <TeamBlock name={match.legionBName || '未知军团'} score={match.scoreB} align="right" />
      </View>

      <View
        style={{
          backgroundColor: colors.ink.elevated,
          height: 8,
          borderRadius: 4,
          marginTop: 16,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            backgroundColor: colors.brand.DEFAULT,
            height: 8,
            borderRadius: 4,
            width: `${leftPercent}%` as `${number}%`,
          }}
        />
      </View>
    </Pressable>
  );
}

function TeamBlock({
  name,
  score,
  align,
}: {
  name: string;
  score: number;
  align: 'left' | 'right';
}) {
  return (
    <View style={{ flex: 1, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.ink.elevated,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <ShieldIcon color={colors.brand.DEFAULT} size={22} />
      </View>
      <Text
        style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.text.primary }}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text
        style={{
          fontSize: 22,
          fontFamily: 'Poppins_700Bold',
          color: colors.brand.DEFAULT,
          marginTop: 2,
        }}
      >
        {score}
      </Text>
    </View>
  );
}
