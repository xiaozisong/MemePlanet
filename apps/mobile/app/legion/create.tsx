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
import { useCreateLegion } from '../../src/api/legion';
import { ShieldIcon, SparklesIcon } from '../../src/components/icons';

const THEME_TAG_PRESETS = [
  '搞笑',
  '鬼畜',
  '沙雕',
  '讽刺',
  '可爱',
  '抽象',
  '游戏',
  '影视',
  '校园',
  '打工人',
  '二次元',
  '热梗',
];

const MEMBER_CAP_OPTIONS = [30, 50, 100, 200];

export default function CreateLegionPage() {
  const router = useRouter();
  const createMutation = useCreateLegion();

  const [name, setName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [joinMode, setJoinMode] = useState<'public' | 'approval'>('public');
  const [memberCap, setMemberCap] = useState(50);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, tag];
    });
  }, []);

  const validate = useCallback((): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return '请输入军团名称';
    if (trimmedName.length > 20) return '军团名称最多 20 字';
    if (slogan.length > 50) return '口号最多 50 字';
    return null;
  }, [name, slogan]);

  const handleCreate = useCallback(async () => {
    const err = validate();
    if (err) {
      Alert.alert('提示', err);
      return;
    }
    try {
      const result = (await createMutation.mutateAsync({
        name: name.trim(),
        slogan: slogan.trim() || undefined,
        themeTags: selectedTags,
        joinMode,
      })) as { legion_id?: string };
      Alert.alert('创建成功', `军团「${name.trim()}」已组建`, [
        {
          text: '查看军团',
          onPress: () => {
            const legionId = result?.legion_id;
            if (legionId) {
              router.replace(`/legion/${legionId}`);
            } else {
              router.replace('/(tabs)/legion');
            }
          },
        },
        {
          text: '返回列表',
          style: 'cancel',
          onPress: () => router.replace('/(tabs)/legion'),
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请稍后重试';
      Alert.alert('创建失败', msg);
    }
  }, [name, slogan, selectedTags, joinMode, createMutation, router, validate]);

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
          创建军团
        </Text>
        <Pressable
          onPress={handleCreate}
          disabled={createMutation.isPending}
          style={{
            backgroundColor: colors.brand.DEFAULT,
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingVertical: 8,
            opacity: createMutation.isPending ? 0.6 : 1,
          }}
        >
          <Text
            style={{ fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.ink.DEFAULT }}
          >
            {createMutation.isPending ? '创建中...' : '创建'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Beam Icon */}
        <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 16 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.brand.DEFAULT}22`,
              borderWidth: 2,
              borderColor: colors.brand.DEFAULT,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldIcon color={colors.brand.DEFAULT} size={36} />
          </View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_500Medium',
              color: colors.text.muted,
              marginTop: 8,
            }}
          >
            组建你自己的梗大军
          </Text>
        </View>

        <View style={{ paddingHorizontal: layout.pagePadding, paddingBottom: 96 }}>
          {/* Name */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              军团名称 *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="输入军团名称（1-20 字）"
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
              {name.length}/20
            </Text>
          </View>

          {/* Slogan */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              军团口号
            </Text>
            <TextInput
              value={slogan}
              onChangeText={setSlogan}
              placeholder="一句口号，让大家记住你们（选填）"
              placeholderTextColor={colors.text.muted}
              maxLength={50}
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
              {slogan.length}/50
            </Text>
          </View>

          {/* Theme Tags */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'Poppins_500Medium',
                  color: colors.text.secondary,
                  marginBottom: 8,
                }}
              >
                主题标签
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                  marginBottom: 8,
                }}
              >
                最多选 3 个（{selectedTags.length}/3）
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {THEME_TAG_PRESETS.map((tag) => {
                const selected = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={{
                      borderRadius: 9999,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      marginRight: 8,
                      marginBottom: 8,
                      backgroundColor: selected ? colors.brand.DEFAULT : colors.ink.soft,
                      borderWidth: 1,
                      borderColor: selected ? colors.brand.DEFAULT : colors.border.DEFAULT,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins_500Medium',
                        color: selected ? colors.ink.DEFAULT : colors.text.secondary,
                      }}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Join Mode */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              加入方式
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <JoinModeButton
                title="公开加入"
                description="任何人可加入"
                selected={joinMode === 'public'}
                onPress={() => setJoinMode('public')}
              />
              <JoinModeButton
                title="审核加入"
                description="需团长同意"
                selected={joinMode === 'approval'}
                onPress={() => setJoinMode('approval')}
              />
            </View>
          </View>

          {/* Member Cap */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              成员上限
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {MEMBER_CAP_OPTIONS.map((cap) => (
                <Pressable
                  key={cap}
                  onPress={() => setMemberCap(cap)}
                  style={{
                    flex: 1,
                    backgroundColor: memberCap === cap ? colors.brand.DEFAULT : colors.ink.soft,
                    borderWidth: 1,
                    borderColor: memberCap === cap ? colors.brand.DEFAULT : colors.border.DEFAULT,
                    borderRadius: 12,
                    paddingVertical: 12,
                    marginRight: 8,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'Poppins_600SemiBold',
                      color: memberCap === cap ? colors.ink.DEFAULT : colors.text.secondary,
                    }}
                  >
                    {cap}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tip Card */}
          <View
            style={{
              backgroundColor: `${colors.accent.DEFAULT}15`,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <SparklesIcon color={colors.accent.DEFAULT} size={18} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                团长特权
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.muted,
                  marginTop: 4,
                  lineHeight: 18,
                }}
              >
                成为团长后可发起 PK、审核加入申请、设置军团信息，每人最多创建 1 个军团、加入 3
                个军团。
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {createMutation.isPending && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: `${colors.overlay.DEFAULT}99`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator size="large" color={colors.brand.DEFAULT} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function JoinModeButton({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: selected ? colors.brand.DEFAULT : colors.ink.soft,
        borderWidth: 1,
        borderColor: selected ? colors.brand.DEFAULT : colors.border.DEFAULT,
        borderRadius: 12,
        padding: 14,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontFamily: 'Poppins_600SemiBold',
          color: selected ? colors.ink.DEFAULT : colors.text.primary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontFamily: 'Poppins_400Regular',
          color: selected ? colors.ink.DEFAULT : colors.text.muted,
          marginTop: 4,
        }}
      >
        {description}
      </Text>
    </Pressable>
  );
}
