import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AiIcon,
  ChevronDownIcon,
  EditIcon,
  EyeIcon,
  SparklesIcon,
  SwordsIcon,
} from '../../src/components/icons';
import { colorsFlat as themeColors, colors, radius, layout, spacing } from '../../src/theme';

const T = (token: string): string => themeColors[token] ?? '#FFFFFF';

interface CreateModeCard {
  id: string;
  route: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  description: string;
  available: boolean;
  tag?: string;
  tagVariant?: 'brand' | 'accent' | 'warning' | 'success' | 'default';
  accentColor: string;
  metric: string;
}

const MODES: CreateModeCard[] = [
  {
    id: 'text',
    route: '/create/text',
    icon: EditIcon,
    title: '文本造梗',
    description: '输入关键词，AI 生成 3 条候选梗，挑选微调发布',
    available: true,
    tag: '3 候选',
    tagVariant: 'brand',
    accentColor: T('brand'),
    metric: '最快 8s',
  },
  {
    id: 'image',
    route: '/create/image',
    icon: SparklesIcon,
    title: '图片造梗',
    description: '描述你想要的梗图风格，AI 生成 1 张候选',
    available: true,
    tag: '再来一次',
    tagVariant: 'accent',
    accentColor: T('accent'),
    metric: 'FLUX',
  },
  {
    id: 'video',
    route: '/create/video',
    icon: EyeIcon,
    title: 'AI 视频',
    description: '一句话生成短视频梗，豆包 Seedance 驱动',
    available: false,
    tag: '即将开放',
    tagVariant: 'warning',
    accentColor: T('accent-info'),
    metric: '5s 短片',
  },
  {
    id: 'agent',
    route: '/create/agent',
    icon: AiIcon,
    title: 'Pro Agent',
    description: 'RAG 检索 + 3 候选 + 自评选优，Pro 专享 10次/日',
    available: false,
    tag: 'Pro',
    tagVariant: 'success',
    accentColor: T('accent-dark'),
    metric: '自评选优',
  },
];

export default function CreateScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ink.DEFAULT }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: layout.pagePadding, paddingTop: 8, paddingBottom: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text
                style={{ fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
              >
                AI 造梗工坊
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: 'Poppins_800ExtraBold',
                  color: colors.text.primary,
                  marginTop: 4,
                }}
              >
                今天想整点什么活
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.ink.soft,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.border.DEFAULT,
                paddingHorizontal: 14,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins_600SemiBold',
                  color: colors.brand.DEFAULT,
                }}
              >
                Lv.1
              </Text>
              <View
                style={{
                  width: 1,
                  height: 14,
                  backgroundColor: colors.border.DEFAULT,
                  marginHorizontal: 10,
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: 'Poppins_400Regular',
                  color: colors.text.secondary,
                }}
              >
                100 能量
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: colors.ink.soft,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
              marginTop: layout.sectionGap,
              overflow: 'hidden',
            }}
          >
            <View style={{ padding: spacing[4] }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'Poppins_700Bold',
                      color: colors.text.primary,
                    }}
                  >
                    Meme Studio
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Poppins_400Regular',
                      color: colors.text.secondary,
                      marginTop: 4,
                    }}
                  >
                    选择模式后进入对应造梗流程
                  </Text>
                </View>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: colors.brand.DEFAULT,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SwordsIcon color={colors.ink.DEFAULT} size={24} />
                </View>
              </View>
              <View
                style={{
                  backgroundColor: colors.ink.elevated,
                  height: 8,
                  borderRadius: 4,
                  marginTop: spacing[4],
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: '76%',
                    height: '100%',
                    backgroundColor: colors.brand.DEFAULT,
                    borderRadius: 4,
                  }}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: spacing[3],
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.text.muted,
                  }}
                >
                  今日创作额度
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.brand.DEFAULT,
                  }}
                >
                  7 / 10
                </Text>
              </View>
            </View>
            <View style={{ height: 4, backgroundColor: colors.brand.DEFAULT }} />
          </View>
        </View>

        <View
          style={{
            paddingHorizontal: layout.pagePadding,
            paddingTop: spacing[5],
            paddingBottom: spacing[3],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.text.primary }}>
            创作模式
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 13,
                fontFamily: 'Poppins_400Regular',
                color: colors.text.muted,
                marginRight: 4,
              }}
            >
              按推荐排序
            </Text>
            <ChevronDownIcon color={T('text-muted')} size={16} />
          </View>
        </View>

        <View style={{ paddingHorizontal: layout.pagePadding }}>
          {MODES.map((mode) => (
            <ModeCard key={mode.id} mode={mode} />
          ))}
        </View>

        <View
          style={{
            paddingHorizontal: layout.pagePadding,
            paddingTop: spacing[3],
            paddingBottom: 96,
          }}
        >
          <View
            style={{
              backgroundColor: colors.ink.soft,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border.DEFAULT,
              padding: spacing[4],
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${T('brand')}22`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <SparklesIcon color={T('brand')} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Poppins_600SemiBold',
                    color: colors.text.primary,
                  }}
                >
                  能量值
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: 'Poppins_400Regular',
                    color: colors.text.muted,
                    marginTop: 2,
                  }}
                >
                  每日自动恢复，深度功能会消耗更多
                </Text>
              </View>
              <Text
                style={{ fontSize: 18, fontFamily: 'Poppins_700Bold', color: colors.brand.DEFAULT }}
              >
                100
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.ink.elevated,
                height: 8,
                borderRadius: 4,
                marginTop: spacing[4],
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: colors.brand.DEFAULT,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeCard({ mode }: { mode: CreateModeCard }) {
  const router = useRouter();
  const Icon = mode.icon;
  const tagStyle = getTagStyle(mode.tagVariant || 'default');

  return (
    <Pressable
      onPress={() => mode.available && router.push(mode.route)}
      disabled={!mode.available}
      style={{
        backgroundColor: colors.ink.soft,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border.DEFAULT,
        padding: spacing[4],
        marginBottom: layout.cardGap,
        opacity: mode.available ? 1 : 0.55,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radius.lg,
            backgroundColor: `${mode.accentColor}22`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Icon color={mode.accentColor} size={24} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Poppins_600SemiBold',
                color: colors.text.primary,
              }}
            >
              {mode.title}
            </Text>
            {mode.tag && (
              <View
                style={{
                  borderRadius: 9999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginLeft: 8,
                  backgroundColor: tagStyle.bg,
                }}
              >
                <Text
                  style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: tagStyle.color }}
                >
                  {mode.tag}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Poppins_400Regular',
              color: colors.text.secondary,
              marginTop: 4,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {mode.description}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing[3] }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: mode.accentColor,
                marginRight: 6,
              }}
            />
            <Text
              style={{ fontSize: 13, fontFamily: 'Poppins_400Regular', color: colors.text.muted }}
            >
              {mode.metric}
            </Text>
          </View>
        </View>

        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.ink.elevated,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 12,
          }}
        >
          <Text style={{ fontSize: 18, color: colors.brand.DEFAULT }}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

function getTagStyle(variant: NonNullable<CreateModeCard['tagVariant']>) {
  const styles: Record<NonNullable<CreateModeCard['tagVariant']>, { bg: string; color: string }> = {
    brand: { bg: `${T('brand')}22`, color: T('brand') },
    accent: { bg: `${T('accent')}22`, color: T('accent') },
    warning: { bg: `${T('status-warning')}22`, color: T('status-warning') },
    success: { bg: `${T('status-success')}22`, color: T('status-success') },
    default: { bg: T('ink-elevated'), color: T('text-secondary') },
  };
  return styles[variant];
}
