import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, layout, spacing, radius } from '../src/theme';
import { ShieldIcon, ArrowLeftIcon } from '../src/components/icons';

const DURATION_OPTIONS = [
  { label: '30 分钟', value: 30 },
  { label: '40 分钟', value: 40 },
  { label: '60 分钟', value: 60 },
] as const;

function Toggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
    >
      <View style={[styles.toggleKnob, value ? styles.knobOn : styles.knobOff]} />
    </Pressable>
  );
}

export default function TeenModeScreen() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [duration, setDuration] = useState(40);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <Pressable
          hitSlop={12}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <ArrowLeftIcon size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.navTitle}>青少年模式</Text>
        <View style={styles.navRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Toggle Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardLeft}>
            <View style={styles.mainIconWrap}>
              <ShieldIcon size={24} color={colors.accent.info} />
            </View>
            <View style={styles.mainTextWrap}>
              <Text style={styles.mainTitle}>青少年模式</Text>
              <Text style={styles.mainDesc}>
                开启后，每日使用时长 ≤ 40 分钟，22:00-06:00 时段禁用
              </Text>
            </View>
          </View>
          <Toggle value={enabled} onValueChange={setEnabled} />
        </View>

        {/* Restriction Details */}
        <Text style={styles.sectionTitle}>限制说明</Text>

        <View style={styles.restrictionCard}>
          <View style={styles.restrictionIconWrap}>
            <Text style={styles.restrictionEmoji}>⏰</Text>
          </View>
          <View style={styles.restrictionBody}>
            <Text style={styles.restrictionTitle}>使用时长</Text>
            <Text style={styles.restrictionDesc}>每日累计使用时长不超过 40 分钟</Text>
          </View>
        </View>

        <View style={styles.restrictionCard}>
          <View style={styles.restrictionIconWrap}>
            <Text style={styles.restrictionEmoji}>🌙</Text>
          </View>
          <View style={styles.restrictionBody}>
            <Text style={styles.restrictionTitle}>时间段限制</Text>
            <Text style={styles.restrictionDesc}>22:00 - 06:00 期间无法使用</Text>
          </View>
        </View>

        <View style={styles.restrictionCard}>
          <View style={styles.restrictionIconWrap}>
            <Text style={styles.restrictionEmoji}>🚫</Text>
          </View>
          <View style={styles.restrictionBody}>
            <Text style={styles.restrictionTitle}>功能限制</Text>
            <Text style={styles.restrictionDesc}>禁止发布梗卡、评分、私信功能</Text>
          </View>
        </View>

        <View style={styles.restrictionCard}>
          <View style={styles.restrictionIconWrap}>
            <Text style={styles.restrictionEmoji}>📋</Text>
          </View>
          <View style={styles.restrictionBody}>
            <Text style={styles.restrictionTitle}>内容池</Text>
            <Text style={styles.restrictionDesc}>仅展示正能量精选梗内容</Text>
          </View>
        </View>

        {/* Duration Setting */}
        <Text style={styles.sectionTitle}>每日使用时长</Text>
        <View style={[styles.durationCard, !enabled && styles.durationCardDisabled]}>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = duration === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  disabled={!enabled}
                  onPress={() => setDuration(opt.value)}
                  style={[
                    styles.durationPill,
                    isSelected ? styles.durationPillSelected : styles.durationPillUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationPillText,
                      isSelected
                        ? styles.durationPillTextSelected
                        : styles.durationPillTextUnselected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Password Setting */}
        <Text style={styles.sectionTitle}>访问密码</Text>
        <View style={styles.passwordCard}>
          <Text style={styles.passwordDesc}>设置密码防止关闭青少年模式</Text>
          <TextInput
            style={styles.passwordInput}
            placeholder="设置 4 位数字密码"
            placeholderTextColor={colors.text.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            maxLength={4}
            keyboardType="number-pad"
          />
          <TextInput
            style={styles.passwordInput}
            placeholder="确认密码"
            placeholderTextColor={colors.text.disabled}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            maxLength={4}
            keyboardType="number-pad"
          />
          <Pressable
            disabled={!password || password !== confirmPassword}
            style={[
              styles.saveButton,
              (!password || password !== confirmPassword) && styles.saveButtonDisabled,
            ]}
            onPress={() => {
              /* placeholder */
            }}
          >
            <Text
              style={[
                styles.saveButtonText,
                (!password || password !== confirmPassword) && styles.saveButtonTextDisabled,
              ]}
            >
              保存密码
            </Text>
          </Pressable>
        </View>
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
    paddingBottom: 80,
  },

  /* Main Toggle Card */
  mainCard: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  mainCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  mainIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(112, 163, 238, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTextWrap: {
    flex: 1,
  },
  mainTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.text.primary,
  },
  mainDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
    lineHeight: 18,
  },

  /* Toggle */
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 2,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: colors.accent.info,
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

  /* Section Title */
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.text.muted,
    paddingLeft: 4,
    marginBottom: 8,
  },

  /* Restriction Cards */
  restrictionCard: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    marginBottom: spacing[3],
    gap: 12,
  },
  restrictionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictionEmoji: {
    fontSize: 18,
  },
  restrictionBody: {
    flex: 1,
  },
  restrictionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.text.primary,
  },
  restrictionDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 2,
    lineHeight: 18,
  },

  /* Duration Setting */
  durationCard: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: 28,
  },
  durationCardDisabled: {
    opacity: 0.5,
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  durationPill: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPillSelected: {
    backgroundColor: 'rgba(247, 184, 75, 0.2)',
    borderColor: colors.brand.DEFAULT,
  },
  durationPillUnselected: {
    backgroundColor: colors.ink.elevated,
    borderColor: colors.border.DEFAULT,
  },
  durationPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  durationPillTextSelected: {
    color: colors.brand.DEFAULT,
  },
  durationPillTextUnselected: {
    color: colors.text.secondary,
  },

  /* Password Setting */
  passwordCard: {
    backgroundColor: colors.ink.soft,
    borderRadius: radius.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  passwordDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  passwordInput: {
    backgroundColor: colors.ink.elevated,
    borderRadius: radius.lg,
    padding: spacing[3],
    color: colors.text.primary,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 8,
  },
  saveButton: {
    backgroundColor: colors.brand.DEFAULT,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.ink.elevated,
  },
  saveButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.ink.DEFAULT,
  },
  saveButtonTextDisabled: {
    color: colors.text.disabled,
  },
});
