import React from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/user.store';
import { useMyProfile, useMemePower } from '../../src/api/user';
import {
  CrownIcon,
  EditIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
} from '../../src/components/icons';
import { colors, layout } from '../../src/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  // 后台刷新用户资料（不阻塞渲染）
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: power } = useMemePower();

  const displayUser = profile ?? user;
  const memePower = power?.memePower ?? user?.memePower ?? 0;
  const energyBalance = power?.energyBalance ?? user?.energyBalance ?? 100;
  const level = power?.level ?? user?.level ?? 1;

  if (profileLoading && !displayUser) {
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: layout.pagePadding, paddingTop: 20 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Text
              style={{ fontSize: 14, fontFamily: 'Poppins_500Medium', color: colors.text.muted }}
            >
              我的
            </Text>
            <Text
              style={{
                fontSize: 28,
                fontFamily: 'Poppins_800ExtraBold',
                color: colors.text.primary,
                marginTop: 4,
              }}
            >
              个人主页
            </Text>
          </View>
          <Pressable
            style={{
              backgroundColor: colors.ink.soft,
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => router.push('/settings')}
          >
            <EditIcon color={colors.brand.DEFAULT} size={18} />
          </Pressable>
        </View>

        {/* Profile Card */}
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
          <View style={{ height: 96, backgroundColor: colors.ink.elevated }}>
            <View
              style={{
                position: 'absolute',
                right: -32,
                top: -40,
                width: 144,
                height: 144,
                borderRadius: 72,
                backgroundColor: `${colors.brand.DEFAULT}20`,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 20,
                top: 20,
                borderRadius: 9999,
                backgroundColor: colors.brand.DEFAULT,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.ink.DEFAULT,
                }}
              >
                Meme Profile
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <View
              style={{
                marginTop: -36,
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 4,
                  borderColor: colors.ink.DEFAULT,
                  backgroundColor: colors.ink.DEFAULT,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserIcon color={colors.brand.DEFAULT} size={34} />
              </View>
              <View
                style={{
                  marginBottom: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 9999,
                  backgroundColor: colors.ink.elevated,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <CrownIcon color={colors.brand.DEFAULT} size={16} />
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.brand.DEFAULT,
                    marginLeft: 4,
                  }}
                >
                  Lv.{level}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 22,
                fontFamily: 'Poppins_700Bold',
                color: colors.text.primary,
                marginTop: 12,
              }}
            >
              {displayUser?.nickname ?? '未登录用户'}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.secondary,
                marginTop: 4,
              }}
              numberOfLines={2}
            >
              {displayUser?.bio ?? '没有填写个人简介'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <ProfileBadge label={displayUser?.isPro ? 'Pro 已开通' : '普通玩家'} />
              <ProfileBadge label="热梗观察员" variant="muted" />
            </View>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={{ paddingHorizontal: layout.pagePadding, paddingVertical: 16 }}>
        <View
          style={{
            backgroundColor: colors.ink.soft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            flexDirection: 'row',
            padding: 16,
          }}
        >
          <DataStat label="作品" value="0" />
          <View
            style={{
              width: 1,
              height: 40,
              backgroundColor: colors.border.DEFAULT,
              marginHorizontal: 16,
            }}
          />
          <DataStat label="梗力值" value={`${memePower}`} highlight />
          <View
            style={{
              width: 1,
              height: 40,
              backgroundColor: colors.border.DEFAULT,
              marginHorizontal: 16,
            }}
          />
          <DataStat label="能量" value={`${energyBalance}`} />
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={{ paddingHorizontal: layout.pagePadding, marginBottom: 16 }}>
        <View
          style={{
            backgroundColor: colors.ink.soft,
            borderRadius: 8,
            flexDirection: 'row',
            padding: 4,
          }}
        >
          <View
            style={{
              backgroundColor: colors.brand.DEFAULT,
              borderRadius: 8,
              flex: 1,
              alignItems: 'center',
              paddingVertical: 8,
            }}
          >
            <Text
              style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.ink.DEFAULT }}
            >
              我的梗
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
            <Text
              style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
            >
              收藏
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
            <Text
              style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
            >
              评分
            </Text>
          </View>
        </View>
      </View>

      {/* Empty State */}
      <View style={{ paddingHorizontal: layout.pagePadding }}>
        <View
          style={{
            backgroundColor: colors.ink.soft,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.DEFAULT,
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: `${colors.brand.DEFAULT}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <SparklesIcon color={colors.brand.DEFAULT} size={30} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Poppins_600SemiBold',
              color: colors.text.primary,
              textAlign: 'center',
            }}
          >
            还没有发布梗
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            先去造梗工坊创作你的第一张梗卡
          </Text>
          <Pressable
            style={{
              backgroundColor: colors.brand.DEFAULT,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
              marginTop: 20,
            }}
            onPress={() => router.push('/create')}
          >
            <Text
              style={{ fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: colors.ink.DEFAULT }}
            >
              去造梗
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Menu Section */}
      <View style={{ paddingHorizontal: layout.pagePadding, marginTop: 20 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: 'Poppins_700Bold',
            color: colors.text.primary,
            marginBottom: 12,
          }}
        >
          常用入口
        </Text>
        <MenuRow
          icon={<EditIcon color={colors.brand.DEFAULT} size={20} />}
          title="编辑资料"
          onPress={() => router.push('/profile/edit')}
        />
        <MenuRow
          icon={<ShieldIcon color={colors.brand.DEFAULT} size={20} />}
          title="设置"
          onPress={() => router.push('/settings')}
        />
        <MenuRow
          icon={<ShieldIcon color={colors.accent.info} size={20} />}
          title="青少年模式"
          subtitle="每日≤40分钟 · 22:00-06:00禁用"
          onPress={() => router.push('/teen-mode')}
        />
        <MenuRow
          icon={<UserIcon color={colors.text.secondary} size={20} />}
          title={user ? '切换账号' : '登录 / 注册'}
          onPress={() => router.push('/login')}
        />
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

function ProfileBadge({
  label,
  variant = 'brand',
}: {
  label: string;
  variant?: 'brand' | 'muted';
}) {
  const isBrand = variant === 'brand';
  return (
    <View
      style={{
        borderRadius: 8,
        marginRight: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: isBrand ? `${colors.brand.DEFAULT}22` : colors.ink.elevated,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'Poppins_600SemiBold',
          color: isBrand ? colors.brand.DEFAULT : colors.text.secondary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function DataStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 22,
          fontFamily: 'Poppins_700Bold',
          color: highlight ? colors.brand.DEFAULT : colors.text.primary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 14,
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

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={{
        backgroundColor: colors.ink.soft,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border.DEFAULT,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.ink.elevated,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontFamily: 'Poppins_500Medium', color: colors.text.primary }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.muted,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={{ fontSize: 18, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}>
        {'>'}
      </Text>
    </Pressable>
  );
}
