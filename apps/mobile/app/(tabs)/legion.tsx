import { View, Text, Pressable, ScrollView } from 'react-native';
import {
  CrownIcon,
  ShieldIcon,
  SparklesIcon,
  SwordsIcon,
  UserIcon,
} from '../../src/components/icons';
import { colors, layout } from '../../src/theme';

const LEGIONS = [
  { name: '抽象圣殿', members: '12.8k', power: '92.4w', rank: 1, color: colors.brand.DEFAULT },
  { name: '阴阳怪气局', members: '8.6k', power: '71.9w', rank: 2, color: colors.accent.DEFAULT },
  { name: '表情包工会', members: '6.1k', power: '58.2w', rank: 3, color: colors.accent.info },
];

const CATEGORIES = ['推荐', '热梗', '新军团', 'PK 强队'];

export default function LegionScreen() {
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
            <HeroMetric label="参战军团" value="128" />
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
        {LEGIONS.map((legion) => (
          <LegionCard key={legion.name} legion={legion} />
        ))}
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
                M2 接入创建、加入与群聊功能
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
}: {
  legion: { name: string; members: string; power: string; rank: number; color: string };
}) {
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
            backgroundColor: `${legion.color}22`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <ShieldIcon color={legion.color} size={26} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.text.primary,
              }}
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
                #{legion.rank}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
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
              {legion.members}
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
              {legion.power}
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
