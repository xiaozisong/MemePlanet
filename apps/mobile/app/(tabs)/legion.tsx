import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import {
  CrownIcon,
  ShieldIcon,
  SparklesIcon,
  SwordsIcon,
  UserIcon,
} from '../../src/components/icons';
import { colors, layout } from '../../src/theme';
import { useLegions } from '../../src/api/legion';

const CATEGORIES = ['推荐', '热梗', '新军团', 'PK 强队'];

export default function LegionScreen() {
  const { data, isLoading, isError } = useLegions(1);
  const legions = data?.list ?? [];

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
              Legion Plaza
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Poppins_800ExtraBold',
                color: colors.text.primary,
                marginTop: 4,
              }}
            >
              梗大军
            </Text>
          </View>
          <Pressable
            style={{
              backgroundColor: colors.brand.DEFAULT,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldIcon color={colors.ink.DEFAULT} size={20} />
          </Pressable>
        </View>

        {/* Hero Card */}
        <View
          style={{
            backgroundColor: colors.ink.soft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            marginTop: 20,
            padding: 16,
          }}
        >
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}
              >
                本周军团战力
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.secondary,
                  marginTop: 4,
                }}
              >
                按活跃、评分、PK 表现综合排序
              </Text>
            </View>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: `${colors.brand.DEFAULT}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CrownIcon color={colors.brand.DEFAULT} size={24} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <HeroMetric label="军团总数" value={String(data?.total ?? 0)} />
            <HeroMetric label="今日 PK" value="36" />
            <HeroMetric label="热梗产出" value="842" />
          </View>
        </View>
      </View>

      {/* Category Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, marginBottom: 16 }}
      >
        {CATEGORIES.map((item, index) => {
          const active = index === 0;
          return (
            <View
              key={item}
              style={{
                borderRadius: 9999,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                backgroundColor: active ? colors.brand.DEFAULT : colors.ink.soft,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_600SemiBold',
                  color: active ? colors.ink.DEFAULT : colors.text.secondary,
                }}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Hot Legions */}
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
            热门军团
          </Text>
          <Text
            style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.brand.DEFAULT }}
          >
            查看全部
          </Text>
        </View>
        {isError ? (
          <Text style={{ color: colors.status.error, textAlign: 'center', padding: 20 }}>
            加载失败，请下拉刷新重试
          </Text>
        ) : legions.length === 0 ? (
          <Text style={{ color: colors.text.muted, textAlign: 'center', padding: 20 }}>
            暂无军团数据
          </Text>
        ) : (
          legions.map((legion, idx) => (
            <LegionCard key={legion.legion_id} legion={legion} rank={idx + 1} />
          ))
        )}
      </View>

      {/* Create Legion CTA */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: `${colors.accent.DEFAULT}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <SparklesIcon color={colors.accent.DEFAULT} size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                创建自己的军团
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                  marginTop: 2,
                }}
              >
                输入军团名称和标签，邀请好友加入
              </Text>
            </View>
            <Text
              style={{ fontSize: 18, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
            >
              {'>'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        marginRight: 12,
        flex: 1,
        borderRadius: 16,
        backgroundColor: colors.ink.elevated,
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    >
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

function LegionCard({
  legion,
  rank,
}: {
  legion: {
    legion_id: string;
    name: string;
    slogan?: string;
    avatar_url?: string;
    member_count: number;
    activity_score: number;
  };
  rank: number;
}) {
  const color =
    rank === 1 ? colors.brand.DEFAULT : rank === 2 ? colors.accent.DEFAULT : colors.accent.info!;
  const memberText =
    legion.member_count >= 1000
      ? `${(legion.member_count / 1000).toFixed(1)}k`
      : String(legion.member_count);
  const powerText =
    legion.activity_score >= 10000
      ? `${(legion.activity_score / 10000).toFixed(1)}w`
      : String(legion.activity_score);

  return (
    <Pressable
      style={{
        backgroundColor: colors.ink.soft,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border.DEFAULT,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            backgroundColor: `${color}22`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ShieldIcon color={color} size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.text.primary,
              }}
              numberOfLines={1}
            >
              {legion.name}
            </Text>
            <View
              style={{
                backgroundColor: colors.ink.elevated,
                borderRadius: 9999,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginLeft: 8,
              }}
            >
              <Text
                style={{ fontSize: 11, fontFamily: 'Poppins_700Bold', color: colors.brand.DEFAULT }}
              >
                #{rank}
              </Text>
            </View>
          </View>
          {legion.slogan ? (
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {legion.slogan}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <UserIcon color={colors.text.muted} size={14} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginLeft: 4,
                marginRight: 12,
              }}
            >
              {memberText}
            </Text>
            <SwordsIcon color={colors.text.muted} size={14} />
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginLeft: 4,
              }}
            >
              {powerText}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 18, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}>
          {'>'}
        </Text>
      </View>
    </Pressable>
  );
}
