import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

interface CreateModeCard {
  id: string;
  route: string;
  emoji: string;
  title: string;
  description: string;
  available: boolean;
  tag?: string;
  tagVariant?: 'brand' | 'accent' | 'warning' | 'default';
}

const MODES: CreateModeCard[] = [
  {
    id: 'text',
    route: '/create/text',
    emoji: '📝',
    title: '文本造梗',
    description: '输入关键词，AI 生成 3 条候选梗，挑选微调发布',
    available: true,
    tag: '3 候选',
    tagVariant: 'brand',
  },
  {
    id: 'image',
    route: '/create/image',
    emoji: '🖼️',
    title: '图片造梗',
    description: '描述你想要的梗图风格，AI 生成 1 张候选',
    available: true,
    tag: '再来一次',
    tagVariant: 'accent',
  },
  {
    id: 'video',
    route: '/create/video',
    emoji: '🎬',
    title: 'AI 视频',
    description: '一句话生成短视频梗，豆包 Seedance 驱动',
    available: false,
    tag: '即将开放',
    tagVariant: 'warning',
  },
  {
    id: 'agent',
    route: '/create/agent',
    emoji: '🤖',
    title: 'Pro Agent',
    description: 'RAG 检索 + 3 候选 + 自评选优，Pro 专享 10次/日',
    available: false,
    tag: 'Pro',
    tagVariant: 'accent',
  },
];

export default function CreateScreen() {
  return (
    <View className="bg-ink flex-1">
      {/* 标题区 */}
      <View className="px-page pb-2 pt-4">
        <Text className="text-text-primary text-title-lg font-bold">✨ 造梗工坊</Text>
        <Text className="text-text-muted text-caption mt-1">用 AI 把脑洞变成梗</Text>
      </View>

      {/* 模式卡片 */}
      <View className="px-page pt-section">
        {MODES.map((mode) => (
          <ModeCard key={mode.id} mode={mode} />
        ))}
      </View>

      {/* 底部能量提示 */}
      <View className="px-page pb-4 pt-6">
        <View className="bg-ink-soft rounded-card flex-row items-center p-4">
          <Text className="text-brand mr-2 text-lg">⚡</Text>
          <View className="flex-1">
            <Text className="text-text-primary text-subtitle font-semibold">能量值</Text>
            <Text className="text-text-muted text-caption mt-0.5">100 / 100 · 每日自动恢复</Text>
          </View>
          <Text className="text-brand text-subtitle font-bold">100</Text>
        </View>
      </View>
    </View>
  );
}

function ModeCard({ mode }: { mode: CreateModeCard }) {
  const router = useRouter();

  const tagBgStyleMap: Record<string, { backgroundColor: string }> = {
    brand: { backgroundColor: 'rgba(255,90,31,0.15)' },
    accent: { backgroundColor: 'rgba(124,58,255,0.15)' },
    warning: { backgroundColor: 'rgba(245,158,11,0.15)' },
    default: { backgroundColor: '#252530' },
  };
  const tagTextColorMap: Record<string, string> = {
    brand: '#FF5A1F',
    accent: '#9D5FFF',
    warning: '#F59E0B',
    default: '#6B6B78',
  };

  return (
    <Pressable
      onPress={() => mode.available && router.push(mode.route)}
      className={`mb-card-gap rounded-card active:bg-ink-elevated p-4 ${mode.available ? 'bg-ink-soft' : 'bg-ink-soft opacity-50'}`}
      disabled={!mode.available}
    >
      <View className="flex-row items-start">
        {/* 图标 */}
        <View className="rounded-card bg-ink-elevated mr-3 h-12 w-12 items-center justify-center">
          <Text className="text-2xl">{mode.emoji}</Text>
        </View>

        {/* 文字区 */}
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-text-primary text-subtitle font-semibold">{mode.title}</Text>
            {mode.tag && (
              <View
                className="rounded-tag ml-2 px-2 py-0.5"
                style={tagBgStyleMap[mode.tagVariant || 'default']}
              >
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: tagTextColorMap[mode.tagVariant || 'default'] }}
                >
                  {mode.tag}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-text-secondary text-caption mt-1 leading-5" numberOfLines={2}>
            {mode.description}
          </Text>
        </View>

        {/* 箭头 */}
        <View className="ml-2 items-center justify-center">
          <Text className="text-text-muted text-lg">›</Text>
        </View>
      </View>
    </Pressable>
  );
}
