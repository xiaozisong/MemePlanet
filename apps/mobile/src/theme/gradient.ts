/**
 * 渐变令牌（霓虹粉紫品牌）
 *
 * 用于 CTA、Tab active、Profile banner、PK VS 分隔等需要 UI 高光的场景。
 * 配合 `expo-linear-gradient` 使用：
 *   <LinearGradient colors={gradient.brand} start={{x:0,y:0}} end={{x:1,y:1}}>...</LinearGradient>
 *
 * 取色原则：
 *   - brand 主渐变：粉红 → 紫，135° 对角线流向，提供视觉动势
 *   - brandSoft 次级渐变：浅粉 → 浅紫，用于内嵌背景、章节 banner
 *   - aiGlow AI 元素：紫 → 粉，发光感，配合 AI 标识使用
 *   - danger 危险渐变：粉红 → 玫紫，错误态 CTA
 */
export const gradient = {
  /** 主品牌渐变：#FF6B9D（亮粉） → #A05EE6（霓虹紫） */
  brand: ['#FF6B9D', '#A05EE6'] as const,
  /** 次级渐变：#FF8AB8（暖粉） → #B584E8（浅紫），用于 banner / 次级 CTA */
  brandSoft: ['#FF8AB8', '#B584E8'] as const,
  /** AI 元素发光：紫 → 粉，配合 AI 标识使用 */
  aiGlow: ['#9E5CBD', '#FF6B9D'] as const,
  /** 神梗徽章渐变：暖粉 → 紫金 */
  god: ['#FFD86B', '#FF6B9D'] as const,
  /** 危险渐变：粉红错误 */
  danger: ['#FF6B9D', '#FF4D6D'] as const,
} as const;

export type GradientToken = typeof gradient;
export type GradientName = keyof typeof gradient;
