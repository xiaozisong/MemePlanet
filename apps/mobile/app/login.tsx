import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, colorsFlat as themeColors, radius, layout } from '../src/theme';
import { useSendOtp, useVerifyOtp } from '../src/api/auth';
import { ApiError } from '@memestar/shared';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const sendingCode = sendOtp.isPending;
  const loading = verifyOtp.isPending;

  const isValidPhone = /^1[3-9]\d{9}$/.test(phone);
  const canSendCode = isValidPhone && !sendingCode && countdown === 0;
  const canLogin = isValidPhone && code.length >= 4 && !loading;

  // 清理倒计时定时器
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!canSendCode) return;
    setError(null);
    try {
      const res = await sendOtp.mutateAsync(`+86${phone}`);
      setCodeSent(true);
      // 后端 TTL 用作 redis 内 otp 有效期；前端倒计时锁定为 60s（防发骚扰）
      void res;
      startCountdown();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '验证码发送失败，请稍后重试';
      setError(message);
    }
  };

  const handleLogin = async () => {
    if (!canLogin) return;
    setError(null);
    try {
      await verifyOtp.mutateAsync({ phone: `+86${phone}`, code });
      const redirect = params.redirect;
      if (redirect) {
        router.replace(redirect);
      } else {
        router.back();
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : '登录失败，请重试';
      setError(message);
    }
  };

  // 错误 toast
  useEffect(() => {
    if (error) {
      Alert.alert('提示', error);
      setError(null);
    }
  }, [error]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          {/* 品牌区 — 深黑氛围 */}
          <View
            style={{
              alignItems: 'center',
              paddingTop: 80,
              paddingBottom: 48,
              paddingHorizontal: layout.pagePadding,
            }}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: colors.brand.DEFAULT,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: colors.brand.DEFAULT,
                shadowOpacity: 0.35,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 40 }}>🔥</Text>
            </View>
            <Text
              style={{
                fontSize: 32,
                fontFamily: 'Poppins_800ExtraBold',
                color: colors.text.primary,
                textAlign: 'center',
              }}
            >
              梗星球
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.secondary,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              AI 造梗 · 神梗评分 · 军团 PK
            </Text>
          </View>

          {/* 登录表单 */}
          <View style={{ paddingHorizontal: layout.pagePadding }}>
            {/* 手机号 */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_500Medium',
                  color: colors.text.secondary,
                  marginBottom: 8,
                }}
              >
                手机号
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.ink.soft,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border.DEFAULT,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 16,
                    color: colors.text.muted,
                    marginRight: 8,
                  }}
                >
                  +86
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="请输入手机号"
                  placeholderTextColor={themeColors['text-disabled']}
                  keyboardType="phone-pad"
                  maxLength={11}
                  style={{
                    flex: 1,
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 16,
                    color: colors.text.primary,
                  }}
                />
              </View>
            </View>

            {/* 验证码 */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_500Medium',
                  color: colors.text.secondary,
                  marginBottom: 8,
                }}
              >
                验证码
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.ink.soft,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.border.DEFAULT,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="请输入验证码"
                  placeholderTextColor={themeColors['text-disabled']}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={codeSent}
                  style={{
                    flex: 1,
                    fontFamily: 'Poppins_400Regular',
                    fontSize: 16,
                    color: colors.text.primary,
                  }}
                />
                <Pressable
                  onPress={handleSendCode}
                  disabled={!canSendCode}
                  style={{ opacity: canSendCode ? 1 : 0.4 }}
                >
                  <View
                    style={{
                      borderRadius: radius.sm,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      backgroundColor: colors.tag.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins_600SemiBold',
                        color: canSendCode ? colors.brand.DEFAULT : colors.text.muted,
                      }}
                    >
                      {sendingCode
                        ? '发送中...'
                        : countdown > 0
                          ? `${countdown}s`
                          : codeSent
                            ? '重新发送'
                            : '获取验证码'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* 登录按钮 — 金黄 CTA */}
            <Pressable
              onPress={handleLogin}
              disabled={!canLogin}
              style={{
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                backgroundColor: canLogin ? colors.brand.DEFAULT : colors.ink.elevated,
                opacity: canLogin ? 1 : 0.6,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.ink.DEFAULT} />
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_700Bold',
                    color: canLogin ? '#0A0A0A' : colors.text.muted,
                  }}
                >
                  登录 / 注册
                </Text>
              )}
            </Pressable>

            {/* 服务条款 */}
            <Text
              style={{
                textAlign: 'center',
                marginTop: 16,
                fontSize: 12,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
              }}
            >
              登录即同意
              <Text style={{ color: colors.brand.DEFAULT }}> 《用户协议》</Text>和
              <Text style={{ color: colors.brand.DEFAULT }}> 《隐私政策》</Text>
            </Text>

            {/* 分隔 */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 32,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border.DEFAULT }} />
              <Text
                style={{
                  marginHorizontal: 16,
                  fontSize: 12,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                }}
              >
                其他方式
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border.DEFAULT }} />
            </View>

            {/* M2 OAuth 占位 */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.ink.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.4,
                }}
              >
                <Text style={{ fontSize: 18 }}>💬</Text>
              </View>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.ink.soft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.4,
                }}
              >
                <Text style={{ fontSize: 18 }}>🍎</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
