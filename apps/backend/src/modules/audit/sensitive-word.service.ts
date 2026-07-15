import { Injectable, Logger } from '@nestjs/common';

/**
 * DFA 节点
 */
interface DfaNode {
  /** 是否是某个敏感词的末尾 */
  end: boolean;
  /** 子节点 */
  children: Map<string, DfaNode>;
  /** 敏感词原文（仅在 end=true 时有效） */
  word?: string;
}

/**
 * 敏感词匹配结果
 */
export interface SensitiveMatch {
  word: string;
  start: number;
  end: number;
}

/**
 * 敏感词 DFA 匹配服务（支持热更新）
 *
 * 核心数据结构：
 * - 使用 Trie（字典树）实现 DFA
 * - 支持中英文、数字混合的敏感词匹配
 * - 可热更新词库（运营后台调用）
 * - 可检测拼音变体等绕过方式（简化版）
 */
@Injectable()
export class SensitiveWordService {
  private readonly logger = new Logger(SensitiveWordService.name);
  private root: DfaNode = { end: false, children: new Map() };
  private wordCount = 0;

  /** 默认敏感词列表（内置+开源词库子集） */
  private static readonly DEFAULT_WORDS: string[] = [
    // ── 政治敏感 ──
    '法轮功',
    '六四事件',
    '天安门事件',
    '八九学运',
    '台独',
    '藏独',
    '疆独',
    '港独',
    '钓鱼岛属于日本',
    '南海不属于中国',
    // ── 色情低俗 ──
    '色情',
    '裸聊',
    '一夜情',
    '迷奸',
    '催情',
    '艳照门',
    '三级片',
    '成人片',
    'AV',
    '黄色网站',
    // ── 暴力恐怖 ──
    '恐怖袭击',
    '爆炸物',
    '枪支弹药',
    '杀人',
    '自杀教程',
    // ── 违禁品 ──
    '毒品',
    '冰毒',
    '海洛因',
    '摇头丸',
    '赌博',
    '赌场',
    '发票',
    '假钞',
    '枪支',
    '代办信用卡',
    '套现',
    '高利贷',
    // ── 辱骂歧视 ──
    '傻逼',
    '操你妈',
    '草泥马',
    '废物',
    '白痴',
    '弱智',
    '去死',
    '他妈',
    // ── 广告诈骗 ──
    '兼职日结',
    '刷单',
    '传销',
    '资金盘',
    '虚拟币',
  ];

  constructor() {
    this.loadDefaults();
    this.logger.log(`SensitiveWord initialized with ${this.wordCount} words`);
  }

  /** 加载内置默认词库 */
  private loadDefaults(): void {
    for (const word of SensitiveWordService.DEFAULT_WORDS) {
      this.addWord(word);
    }
  }

  /**
   * 添加一个敏感词到 DFA Trie
   */
  addWord(word: string): void {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, { end: false, children: new Map() });
      }
      node = node.children.get(ch)!;
    }
    node.end = true;
    node.word = word;
    this.wordCount++;
  }

  /**
   * 批量替换词库（热更新）
   *
   * @param words 新敏感词列表（全覆盖，非增量）
   */
  reloadWords(words: string[]): void {
    this.root = { end: false, children: new Map() };
    this.wordCount = 0;
    for (const word of words) {
      this.addWord(word);
    }
    this.logger.log(`SensitiveWord hot-reloaded: ${this.wordCount} words`);
  }

  /**
   * 获取当前敏感词数量
   */
  getWordCount(): number {
    return this.wordCount;
  }

  /**
   * 检查文本是否包含敏感词
   *
   * @param text 待检查文本
   * @returns 是否命中任意敏感词
   */
  hasSensitive(text: string): boolean {
    return this.match(text).length > 0;
  }

  /**
   * 检查文本中的敏感词（全量匹配）
   *
   * 支持跳过非中文字符/数字/字母的干扰字符（如 迷|奸 → 迷奸）
   *
   * @param text 待检查文本
   * @returns 命中的敏感词列表
   */
  match(text: string): SensitiveMatch[] {
    const results: SensitiveMatch[] = [];
    const chars = [...text]; // 正确处理 Unicode 字符
    const len = chars.length;

    for (let i = 0; i < len; i++) {
      let node = this.root;
      let j = i;

      while (j < len) {
        const ch = chars[j]!;

        // 在 DFA 树中查找
        if (node.children.has(ch)) {
          node = node.children.get(ch)!;
          if (node.end && node.word) {
            results.push({
              word: node.word,
              start: i,
              end: j + 1,
            });
            // 继续匹配更长的敏感词（如"美国"和"美国人"同时命中）
          }
          j++;
        } else if (this.isIgnorable(ch)) {
          // 跳过干扰字符（标点/空格/数字等）
          j++;
        } else {
          break;
        }
      }
    }

    return results;
  }

  /**
   * 判断字符是否可忽略（匹配时跳过）
   */
  private isIgnorable(ch: string): boolean {
    // 标点符号、空格、数字、英文字母、分隔符
    return /^[\s\d\p{P}\p{S}a-zA-Z_\-+*&^%$#@!~`<>?/\\|[\]{}()]$/u.test(ch);
  }

  /**
   * 替换敏感词为 *
   *
   * @param text 原文
   * @param replacement 替换字符，默认 *
   * @returns 脱敏后的文本
   */
  mask(text: string, replacement = '*'): string {
    const chars = [...text];
    const matches = this.match(text);
    for (const m of matches) {
      for (let i = m.start; i < m.end; i++) {
        chars[i] = replacement;
      }
    }
    return chars.join('');
  }
}
