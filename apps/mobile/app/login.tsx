import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colorsFlat as themeColors } from '../src/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const isValidPhone = /^1[3-9]\d{9}$/.test(phone);
  const canSendCode = isValidPhone && !sendingCode && countdown === 0;
  const canLogin = isValidPhone && code.length >= 4 && !loading;

  const handleSendCode = () => {
    if (!canSendCode) return;
    setSendingCode(true);
    // TODO: 接入短信 API
    setTimeout(() => {
      setSendingCode(false);
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1000);
  };

  const handleLogin = () => {
    if (!canLogin) return;
    setLoading(true);
    // TODO: 接入 Supabase Auth
    setTimeout(() => {
      setLoading(false);
      router.back();
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-ink flex-1"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* 品牌区 */}
        <View className="px-page items-center pb-12 pt-20">
          <View className="bg-brand mb-6 h-20 w-20 items-center justify-center rounded-full">
            <Text className="text-4xl">🔥</Text>
          </View>
          <Text className="text-text-primary text-display text-center font-bold">梗星球</Text>
          <Text className="text-text-secondary text-subtitle mt-2 text-center">
            AI 造梗 · 神梗评分 · 军团 PK
          </Text>
        </View>

        {/* 登录表单 */}
        <View className="px-page">
          {/* 手机号输入 */}
          <View className="mb-4">
            <Text className="text-text-secondary text-caption-bold mb-2">手机号</Text>
            <View className="bg-ink-soft rounded-input border-border-light flex-row items-center border px-4 py-3">
              <Text className="text-text-muted text-body mr-2">+86</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="请输入手机号"
                placeholderTextColor={themeColors['text-muted']}
                keyboardType="phone-pad"
                maxLength={11}
                className="text-text-primary text-body flex-1"
              />
            </View>
          </View>

          {/* 验证码输入 */}
          <View className="mb-6">
            <Text className="text-text-secondary text-caption-bold mb-2">验证码</Text>
            <View className="bg-ink-soft rounded-input border-border-light flex-row items-center border px-4 py-3">
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="请输入验证码"
                placeholderTextColor={themeColors['text-muted']}
                keyboardType="number-pad"
                maxLength={6}
                editable={codeSent}
                className="text-text-primary text-body flex-1"
              />
              <Pressable
                onPress={handleSendCode}
                disabled={!canSendCode}
                className={`ml-2 ${canSendCode ? 'active:opacity-70' : 'opacity-50'}`}
              >
                <View
                  className="rounded-tag px-3 py-1.5"
                  style={{ backgroundColor: 'rgba(255,90,31,0.15)' }}
                >
                  <Text
                    className={`text-btn text-[13px] font-semibold ${canSendCode ? 'text-brand' : 'text-text-muted'}`}
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

          {/* 登录按钮 */}
          <Pressable
            onPress={handleLogin}
            disabled={!canLogin}
            className={`rounded-btn items-center justify-center py-4 ${canLogin ? 'bg-brand active:bg-brand-dark' : 'bg-ink-elevated'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                className={`text-btn font-semibold ${canLogin ? 'text-white' : 'text-text-muted'}`}
              >
                登录 / 注册
              </Text>
            )}
          </Pressable>

          {/* 服务条款 */}
          <Text className="text-text-muted text-caption mt-4 text-center">
            登录即同意
            <Text className="text-brand"> 《用户协议》</Text>和
            <Text className="text-brand"> 《隐私政策》</Text>
          </Text>

          {/* M2 分隔线 */}
          <View className="my-8 flex-row items-center">
            <View className="bg-border h-px flex-1" />
            <Text className="text-text-muted text-caption mx-4">其他方式</Text>
            <View className="bg-border h-px flex-1" />
          </View>

          {/* M2 OAuth 占位 */}
          <View className="flex-row justify-center gap-6">
            <View className="bg-ink-soft h-12 w-12 items-center justify-center rounded-full opacity-40">
              <Text className="text-lg">💬</Text>
            </View>
            <View className="bg-ink-soft h-12 w-12 items-center justify-center rounded-full opacity-40">
              <Text className="text-lg">🍎</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
