import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, layout } from '../../src/theme';
import { useMyProfile, useUpdateProfile } from '../../src/api/user';
import { UserIcon } from '../../src/components/icons';

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useMyProfile();
  const updateMutation = useUpdateProfile();

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [initialized, setInitialized] = useState(false);

  // 从 profile 填充初始值（只做一次）
  if (profile && !initialized) {
    setNickname(profile.nickname ?? '');
    setBio(profile.bio ?? '');
    setInitialized(true);
  }

  const handleSave = useCallback(async () => {
    if (!nickname.trim()) {
      Alert.alert('请填写昵称', '昵称不能为空');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        nickname: nickname.trim(),
        bio: bio.trim() || undefined,
      });
      Alert.alert('保存成功', '个人资料已更新', [{ text: '好的', onPress: () => router.back() }]);
    } catch {
      Alert.alert('保存失败', '请稍后重试');
    }
  }, [nickname, bio, updateMutation, router]);

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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          编辑资料
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={updateMutation.isPending}
          style={{
            backgroundColor: colors.brand.DEFAULT,
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 8,
            opacity: updateMutation.isPending ? 0.6 : 1,
          }}
        >
          <Text
            style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.ink.DEFAULT }}
          >
            {updateMutation.isPending ? '保存中...' : '保存'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: `${colors.brand.DEFAULT}22`,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.border.DEFAULT,
            }}
          >
            <UserIcon color={colors.brand.DEFAULT} size={38} />
          </View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_500Medium',
              color: colors.brand.DEFAULT,
              marginTop: 8,
            }}
          >
            点击更换头像
          </Text>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: layout.pagePadding }}>
          {/* Nickname */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              昵称
            </Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="输入昵称"
              placeholderTextColor={colors.text.muted}
              maxLength={20}
              style={{
                backgroundColor: colors.ink.soft,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.primary,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginTop: 4,
                textAlign: 'right',
              }}
            >
              {nickname.length}/20
            </Text>
          </View>

          {/* Bio */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              个人简介
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="介绍一下自己..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={4}
              maxLength={100}
              textAlignVertical="top"
              style={{
                backgroundColor: colors.ink.soft,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.primary,
                minHeight: 100,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginTop: 4,
                textAlign: 'right',
              }}
            >
              {bio.length}/100
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
