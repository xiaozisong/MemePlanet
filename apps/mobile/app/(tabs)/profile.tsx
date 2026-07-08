import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/store/user.store';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  return (
    <ScrollView className="bg-ink flex-1" showsVerticalScrollIndicator={false}>
      {/* 用户信息区 */}
      <View className="px-page items-center pt-12">
        {/* 头像 */}
        <View className="bg-ink-elevated h-20 w-20 items-center justify-center rounded-full">
          <Text className="text-4xl">🤡</Text>
        </View>

        {/* 昵称 */}
        <Text className="text-text-primary text-title-lg mt-4 font-bold">
          {user?.nickname ?? '未登录'}
        </Text>

        {/* 简介 */}
        <Text className="text-text-secondary text-caption mt-1" numberOfLines={2}>
          {user?.bio ?? '这个人很懒，什么都没留下'}
        </Text>

        {/* Pro 徽章 */}
        {user?.isPro && (
          <View
            className="rounded-tag mt-2 px-2 py-0.5"
            style={{ backgroundColor: 'rgba(124,58,255,0.15)' }}
          >
            <Text className="text-[11px] font-semibold" style={{ color: '#9D5FFF' }}>
              ✦ Pro
            </Text>
          </View>
        )}
      </View>

      {/* 数据行 */}
      <View className="px-page flex-row justify-center py-6">
        <DataStat label="等级" value={`Lv.${user?.level ?? 1}`} />
        <View className="bg-border mx-6 h-10 w-px" />
        <DataStat label="梗力值" value={`${user?.memePower ?? 0}`} highlight />
        <View className="bg-border mx-6 h-10 w-px" />
        <DataStat label="能量" value={`${user?.energyBalance ?? 100}`} />
      </View>

      {/* 我的梗 Tab 占位 */}
      <View className="px-page mb-4">
        <View className="bg-ink-soft rounded-tag flex-row p-1">
          <View className="bg-brand rounded-tag flex-1 items-center py-2">
            <Text className="text-caption font-semibold text-white">我的梗</Text>
          </View>
          <View className="flex-1 items-center py-2">
            <Text className="text-text-muted text-caption">收藏</Text>
          </View>
          <View className="flex-1 items-center py-2">
            <Text className="text-text-muted text-caption">评分</Text>
          </View>
        </View>
      </View>

      {/* 空内容占位 */}
      <View className="px-page items-center py-8">
        <Text className="mb-4 text-5xl">🎭</Text>
        <Text className="text-text-secondary text-subtitle text-center font-semibold">
          还没有发布梗
        </Text>
        <Text className="text-text-muted text-caption mt-1 text-center">
          去造梗工坊创作你的第一个梗吧
        </Text>
        <Pressable
          className="bg-brand rounded-btn active:bg-brand-dark mt-4 px-6 py-3"
          onPress={() => router.push('/create')}
        >
          <Text className="text-btn font-semibold text-white">去造梗</Text>
        </Pressable>
      </View>

      {/* 菜单项 */}
      <View className="px-page mt-4">
        <MenuRow icon="⚙️" title="设置" onPress={() => router.push('/settings')} />
        <MenuRow
          icon="🛡️"
          title="青少年模式"
          subtitle="每日≤40分钟 · 22:00-06:00禁用"
          onPress={() => router.push('/teen-mode')}
        />
        <MenuRow
          icon="🔑"
          title={user ? '切换账号' : '登录 / 注册'}
          onPress={() => router.push('/login')}
        />
      </View>

      {/* 底部安全区 */}
      <View className="h-20" />
    </ScrollView>
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
    <View className="items-center">
      <Text className={`text-title font-bold ${highlight ? 'text-brand' : 'text-text-primary'}`}>
        {value}
      </Text>
      <Text className="text-text-muted text-caption mt-0.5">{label}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="bg-ink-soft rounded-card active:bg-ink-elevated mb-2 flex-row items-center p-4"
      onPress={onPress}
    >
      <Text className="mr-3 text-xl">{icon}</Text>
      <View className="flex-1">
        <Text className="text-text-primary text-body">{title}</Text>
        {subtitle && <Text className="text-text-muted text-caption mt-0.5">{subtitle}</Text>}
      </View>
      <Text className="text-text-muted text-lg">›</Text>
    </Pressable>
  );
}
