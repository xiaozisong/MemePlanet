import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, layout } from '../../src/theme';
import { useCreatePK } from '../../src/api/pk';
import { useLegions } from '../../src/api/legion';
import { SwordsIcon, ShieldIcon } from '../../src/components/icons';

const PK_TYPES = [
  { key: 'creation' as const, label: '创作 PK', desc: '比谁新梗更神' },
  { key: 'vote' as const, label: '投票 PK', desc: '比谁应援更多' },
  { key: 'hotness' as const, label: '热度 PK', desc: '比谁梗卡更火' },
];

const DURATION_PRESETS = [
  { label: '1 小时', value: 1 },
  { label: '3 小时', value: 3 },
  { label: '6 小时', value: 6 },
  { label: '24 小时', value: 24 },
];

export default function CreatePKPage() {
  const router = useRouter();
  const createMutation = useCreatePK();
  const { data: legionsData } = useLegions(1);

  const [theme, setTheme] = useState('');
  const [pkType, setPkType] = useState<'creation' | 'vote' | 'hotness'>('creation');
  const [legionA, setLegionA] = useState<{ legion_id: string; name: string } | null>(null);
  const [legionB, setLegionB] = useState<{ legion_id: string; name: string } | null>(null);
  const [durationHours, setDurationHours] = useState(3);
  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null);

  const handleOpenPicker = useCallback((target: 'A' | 'B') => {
    setPickerTarget(target);
  }, []);

  const handleSelectLegion = useCallback(
    (legion: { legion_id: string; name: string }) => {
      if (pickerTarget === 'A') {
        if (legionB?.legion_id === legion.legion_id) {
          Alert.alert('提示', '不能选择同一个军团');
          return;
        }
        setLegionA(legion);
      } else if (pickerTarget === 'B') {
        if (legionA?.legion_id === legion.legion_id) {
          Alert.alert('提示', '不能选择同一个军团');
          return;
        }
        setLegionB(legion);
      }
      setPickerTarget(null);
    },
    [pickerTarget, legionA, legionB],
  );

  const validate = useCallback((): string | null => {
    if (!theme.trim()) return '请输入 PK 主题';
    if (theme.trim().length > 140) return '主题最多 140 字';
    if (!legionA) return '请选择军团 A';
    if (!legionB) return '请选择军团 B';
    return null;
  }, [theme, legionA, legionB]);

  const handleCreate = useCallback(async () => {
    const err = validate();
    if (err) {
      Alert.alert('提示', err);
      return;
    }
    const now = new Date();
    const startAt = now.toISOString();
    const endAt = new Date(now.getTime() + durationHours * 3600_000).toISOString();

    try {
      const result = (await createMutation.mutateAsync({
        type: pkType,
        legionA: legionA!.legion_id,
        legionB: legionB!.legion_id,
        theme: theme.trim(),
        startAt,
        endAt,
      })) as { pk_id?: string };
      Alert.alert('PK 已发起', '对决开始！', [
        {
          text: '查看详情',
          onPress: () => {
            const pkId = result?.pk_id;
            if (pkId) {
              router.replace(`/pk/${pkId}`);
            } else {
              router.replace('/(tabs)/pk');
            }
          },
        },
        {
          text: '返回 PK 大厅',
          style: 'cancel',
          onPress: () => router.replace('/(tabs)/pk'),
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请稍后重试';
      Alert.alert('发起失败', msg);
    }
  }, [theme, legionA, legionB, pkType, durationHours, createMutation, router, validate]);

  const eligibleLegions = legionsData?.list ?? [];
  const selectedLegionA = legionA;
  const selectedLegionB = legionB;

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
          发起 PK
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
            {createMutation.isPending ? '发起中...' : '发起'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 16 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.status.error}20`,
              borderWidth: 2,
              borderColor: colors.status.error,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SwordsIcon color={colors.status.error} size={36} />
          </View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Poppins_500Medium',
              color: colors.text.muted,
              marginTop: 8,
            }}
          >
            选择双方军团，设定主题开战
          </Text>
        </View>

        <View style={{ paddingHorizontal: layout.pagePadding, paddingBottom: 96 }}>
          {/* Legions Selector */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_500Medium',
              color: colors.text.secondary,
              marginBottom: 12,
            }}
          >
            参战军团
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <LegionSelector
              label="军团 A"
              selected={selectedLegionA?.name ?? null}
              onPress={() => handleOpenPicker('A')}
            />
            <Text
              style={{
                fontSize: 20,
                fontFamily: 'Poppins_700Bold',
                color: colors.text.muted,
                marginHorizontal: 12,
              }}
            >
              VS
            </Text>
            <LegionSelector
              label="军团 B"
              selected={selectedLegionB?.name ?? null}
              onPress={() => handleOpenPicker('B')}
            />
          </View>

          {/* Theme */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              PK 主题
            </Text>
            <TextInput
              value={theme}
              onChangeText={setTheme}
              placeholder="输入 PK 主题（如：谁才是今晚神梗王）"
              placeholderTextColor={colors.text.muted}
              maxLength={140}
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
              {theme.length}/140
            </Text>
          </View>

          {/* PK Type */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              PK 类型
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {PK_TYPES.map((t) => {
                const selected = pkType === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setPkType(t.key)}
                    style={{
                      flex: 1,
                      backgroundColor: selected ? colors.brand.DEFAULT : colors.ink.soft,
                      borderWidth: 1,
                      borderColor: selected ? colors.brand.DEFAULT : colors.border.DEFAULT,
                      borderRadius: 12,
                      padding: 12,
                      marginRight: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'Poppins_600SemiBold',
                        color: selected ? colors.ink.DEFAULT : colors.text.primary,
                      }}
                    >
                      {t.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: 'Poppins_400Regular',
                        color: selected ? colors.ink.DEFAULT : colors.text.muted,
                        marginTop: 4,
                      }}
                    >
                      {t.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Duration */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Poppins_500Medium',
                color: colors.text.secondary,
                marginBottom: 8,
              }}
            >
              持续时间
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {DURATION_PRESETS.map((d) => (
                <Pressable
                  key={d.value}
                  onPress={() => setDurationHours(d.value)}
                  style={{
                    flex: 1,
                    backgroundColor:
                      durationHours === d.value ? colors.brand.DEFAULT : colors.ink.soft,
                    borderWidth: 1,
                    borderColor:
                      durationHours === d.value ? colors.brand.DEFAULT : colors.border.DEFAULT,
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
                      color: durationHours === d.value ? colors.ink.DEFAULT : colors.text.secondary,
                    }}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Legion Picker Modal */}
      <Modal
        visible={pickerTarget != null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerTarget(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: `${colors.overlay.DEFAULT}CC`,
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.ink.DEFAULT,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '70%',
              paddingTop: 16,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: layout.pagePadding,
                paddingBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: 'Poppins_700Bold',
                  color: colors.text.primary,
                }}
              >
                选择军团 {pickerTarget}
              </Text>
              <Pressable onPress={() => setPickerTarget(null)}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.brand.DEFAULT,
                  }}
                >
                  取消
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={eligibleLegions}
              keyExtractor={(item) => item.legion_id}
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingHorizontal: layout.pagePadding, paddingBottom: 32 }}
              renderItem={({ item }) => {
                const disabled =
                  (pickerTarget === 'A' && selectedLegionB?.legion_id === item.legion_id) ||
                  (pickerTarget === 'B' && selectedLegionA?.legion_id === item.legion_id);
                return (
                  <Pressable
                    onPress={() => {
                      if (!disabled) handleSelectLegion(item);
                    }}
                    disabled={disabled}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.ink.soft,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.border.DEFAULT,
                      padding: 14,
                      marginBottom: 8,
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: `${colors.brand.DEFAULT}22`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <ShieldIcon color={colors.brand.DEFAULT} size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: 'Poppins_600SemiBold',
                          color: colors.text.primary,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'Poppins_400Regular',
                          color: colors.text.muted,
                          marginTop: 2,
                        }}
                      >
                        {item.member_count} 成员 · 战力 {item.activity_score}
                      </Text>
                    </View>
                    {disabled ? (
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'Poppins_500Medium',
                          color: colors.text.muted,
                        }}
                      >
                        已选
                      </Text>
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: colors.text.muted,
                    textAlign: 'center',
                    padding: 20,
                    fontFamily: 'Poppins_400Regular',
                  }}
                >
                  暂无可用军团
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

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

function LegionSelector({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: colors.ink.soft,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border.DEFAULT,
        padding: 16,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontFamily: 'Poppins_500Medium',
          color: colors.text.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      {selected ? (
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Poppins_600SemiBold',
            color: colors.text.primary,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {selected}
        </Text>
      ) : (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'Poppins_400Regular',
            color: colors.text.muted,
          }}
        >
          点击选择
        </Text>
      )}
    </Pressable>
  );
}
