import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, radius } from '../src/theme';
import {
  UserIcon,
  ShieldIcon,
  EyeIcon,
  SparklesIcon,
  EditIcon,
  ArrowLeftIcon,
} from '../src/components/icons';

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
}>;

type SettingRowBase = {
  key: string;
  title: string;
  icon: IconComponent;
};

type SettingRowWithChevron = SettingRowBase & {
  type: 'chevron';
  subtitle?: string;
};

type SettingRowWithToggle = SettingRowBase & {
  type: 'toggle';
  value: boolean;
  onValueChange: (value: boolean) => void;
};

type SettingRow = SettingRowWithChevron | SettingRowWithToggle;

const IconButton = ({ Icon, size = 20 }: { Icon: IconComponent; size?: number }) => (
  <View style={styles.iconBadge}>
    <Icon size={size} color={colors.text.primary} />
  </View>
);

const Chevron = () => (
  <Text
    style={{
      color: colors.text.muted,
      fontSize: 18,
      fontFamily: 'Poppins_500Medium',
      lineHeight: 22,
    }}
  >
    {'>'}
  </Text>
);

const Toggle = ({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) => (
  <Pressable
    onPress={() => onValueChange(!value)}
    style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
  >
    <View style={[styles.toggleKnob, value ? styles.knobOn : styles.knobOff]} />
  </Pressable>
);

const Row = ({ row }: { row: SettingRow }) => {
  const Icon = row.icon;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => {
        // 占位：后续路由接入真实页面
      }}
    >
      <IconButton Icon={Icon} />
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        {row.type === 'chevron' && row.subtitle ? (
          <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
        ) : null}
      </View>
      {row.type === 'chevron' ? (
        <Chevron />
      ) : (
        <Toggle value={row.value} onValueChange={row.onValueChange} />
      )}
    </Pressable>
  );
};

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const Spacer = ({ height = 20 }: { height?: number }) => <View style={{ height }} />;

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [logoutPressed, setLogoutPressed] = useState(false);

  const accountRows: SettingRow[] = [
    {
      key: 'nickname',
      title: '昵称',
      icon: UserIcon,
      type: 'chevron',
      subtitle: '游客_3f2a',
    },
    {
      key: 'phone',
      title: '手机号',
      icon: ShieldIcon,
      type: 'chevron',
      subtitle: '138****8888',
    },
    { key: 'password', title: '密码', icon: ShieldIcon, type: 'chevron' },
  ];

  const notifyRows: SettingRow[] = [
    {
      key: 'push',
      title: '推送通知',
      icon: EyeIcon,
      type: 'toggle',
      value: pushEnabled,
      onValueChange: setPushEnabled,
    },
    {
      key: 'teen',
      title: '青少年模式',
      icon: ShieldIcon,
      type: 'chevron',
      subtitle: '未开启',
    },
    { key: 'blocklist', title: '黑名单', icon: EyeIcon, type: 'chevron' },
  ];

  const otherRows: SettingRow[] = [
    { key: 'about', title: '关于我们', icon: SparklesIcon, type: 'chevron' },
    { key: 'feedback', title: '意见反馈', icon: EditIcon, type: 'chevron' },
    {
      key: 'cache',
      title: '清除缓存',
      icon: SparklesIcon,
      type: 'chevron',
      subtitle: '23.5 MB',
    },
    {
      key: 'version',
      title: '当前版本',
      icon: SparklesIcon,
      type: 'chevron',
      subtitle: 'v0.1.0 (1)',
    },
  ];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.navBar}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <ArrowLeftIcon size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.navTitle}>设置</Text>
        <View style={styles.navRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <UserIcon size={48} color={colors.text.secondary} />
          </View>
          <Pressable hitSlop={8}>
            <Text style={styles.editAvatar}>修改头像</Text>
          </Pressable>
        </View>

        <Spacer height={12} />

        <SectionTitle title="账号与安全" />
        <Spacer height={8} />
        <View style={styles.group}>
          {accountRows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </View>

        <Spacer />
        <SectionTitle title="通知与隐私" />
        <Spacer height={8} />
        <View style={styles.group}>
          {notifyRows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </View>

        <Spacer />
        <SectionTitle title="其他" />
        <Spacer height={8} />
        <View style={styles.group}>
          {otherRows.map((row) => (
            <Row key={row.key} row={row} />
          ))}
        </View>

        <Spacer height={28} />
        <Pressable
          onPressIn={() => setLogoutPressed(true)}
          onPressOut={() => setLogoutPressed(false)}
          style={[styles.logoutButton, logoutPressed && styles.logoutButtonPressed]}
        >
          <Text style={[styles.logoutText, logoutPressed && styles.logoutTextPressed]}>
            退出登录
          </Text>
        </Pressable>
        <Spacer height={20} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ink.DEFAULT,
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.DEFAULT,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.ink.soft,
  },
  navTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.text.primary,
  },
  navRight: { width: 40 },
  scrollContent: {
    paddingHorizontal: layout.pagePadding,
    paddingTop: 20,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.ink.soft,
    borderWidth: 2,
    borderColor: colors.brand.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatar: {
    color: colors.brand.DEFAULT,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.text.muted,
    paddingLeft: 4,
  },
  group: {
    gap: 1,
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: colors.ink.elevated,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    flexDirection: 'column',
  },
  rowTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.text.primary,
  },
  rowSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 2,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.brand.DEFAULT,
  },
  toggleOff: {
    backgroundColor: colors.ink.elevated,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.text.primary,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  knobOff: {
    alignSelf: 'flex-start',
  },
  logoutButton: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: 14,
    backgroundColor: colors.ink.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonPressed: {
    backgroundColor: '#3A1A1A',
  },
  logoutText: {
    color: colors.status.error,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  logoutTextPressed: {
    color: '#D11A1A',
  },
});
