/**
 * 兴趣标签字典 —— 梗星球预设 35 个兴趣标签（8 大类）
 *
 * 用户可以从中选择 3~10 个作为个人兴趣标签，用于冷启动 feed 推荐。
 * 如需新增标签，直接在此数组追加即可（短名不超过 16 字符）。
 */

export interface InterestTagDef {
  /** 唯一英文标识（DB 存储值） */
  name: string;
  /** 中文显示名（前端展示） */
  label: string;
  /** 所属大类 */
  category: InterestCategory;
}

export type InterestCategory =
  | 'meme' // 梗文化
  | 'game' // 游戏
  | 'anime' // 动漫
  | 'movie' // 影视
  | 'music' // 音乐
  | 'life' // 生活
  | 'tech' // 科技
  | 'other'; // 其他

export const INTEREST_TAGS: InterestTagDef[] = [
  // ── 梗文化 ──
  { name: '抽象', label: '抽象', category: 'meme' },
  { name: '阴阳怪气', label: '阴阳怪气', category: 'meme' },
  { name: '谐音梗', label: '谐音梗', category: 'meme' },
  { name: '表情包', label: '表情包制作', category: 'meme' },
  { name: '热梗', label: '实时热梗', category: 'meme' },
  { name: '考古', label: '考古玩梗', category: 'meme' },
  { name: '二创', label: '二创改编', category: 'meme' },

  // ── 游戏 ──
  { name: '王者荣耀', label: '王者荣耀', category: 'game' },
  { name: '原神', label: '原神', category: 'game' },
  { name: '英雄联盟', label: '英雄联盟', category: 'game' },
  { name: '吃鸡', label: 'PUBG/和平精英', category: 'game' },
  { name: '主机游戏', label: '主机/PC 游戏', category: 'game' },
  { name: '独立游戏', label: '独立游戏', category: 'game' },

  // ── 动漫 ──
  { name: '日漫', label: '日本动漫', category: 'anime' },
  { name: '国漫', label: '国产动漫', category: 'anime' },
  { name: '经典动漫', label: '经典老番', category: 'anime' },

  // ── 影视 ──
  { name: '电影', label: '电影', category: 'movie' },
  { name: '电视剧', label: '电视剧/网剧', category: 'movie' },
  { name: '综艺', label: '综艺', category: 'movie' },
  { name: '短视频', label: '短视频', category: 'movie' },

  // ── 音乐 ──
  { name: '华语流行', label: '华语流行', category: 'music' },
  { name: '说唱', label: '说唱/Rap', category: 'music' },
  { name: '古风', label: '古风', category: 'music' },
  { name: '鬼畜', label: '鬼畜', category: 'music' },

  // ── 生活 ──
  { name: '校园', label: '校园生活', category: 'life' },
  { name: '职场', label: '职场日常', category: 'life' },
  { name: '美食', label: '美食', category: 'life' },
  { name: '宠物', label: '萌宠', category: 'life' },
  { name: '恋爱', label: '恋爱/情感', category: 'life' },
  { name: '星座', label: '星座/运势', category: 'life' },

  // ── 科技 ──
  { name: 'AI', label: 'AI/人工智能', category: 'tech' },
  { name: '数码', label: '数码产品', category: 'tech' },
  { name: '编程', label: '编程/技术', category: 'tech' },

  // ── 其他 ──
  { name: '二次元', label: '二次元', category: 'other' },
  { name: '沙雕', label: '沙雕欢乐', category: 'other' },
];

/** 有效 tag name 集合（用于校验入参） */
export const VALID_TAG_NAMES = new Set(INTEREST_TAGS.map((t) => t.name));

/**
 * 冷启动 feed 推荐比例配置。
 *
 * `interest` 字段指定按用户兴趣标签筛选的梗卡占 feed 的比例，
 * 其余来自热门/新品。用户未选兴趣标签时全量热门。
 */
export const COLD_START_FEED_CONFIG = {
  /** 兴趣推荐占比（0.0 ~ 1.0） */
  interestRatio: 0.7,
  /** 新品占比（发布时间 24h 内） */
  newRatio: 0.3,
  /** 最多返回标签数（用于兴趣匹配） */
  maxTags: 5,
  /** 分页默认 size */
  defaultPageSize: 20,
} as const;
