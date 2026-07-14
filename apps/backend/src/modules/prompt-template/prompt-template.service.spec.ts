import { PromptTemplateService } from './prompt-template.service.js';
import type { DbType } from '../../database/drizzle.module.js';

describe('PromptTemplateService — T1.12', () => {
  let service: PromptTemplateService;

  beforeEach(() => {
    // render() 是纯函数，无需实例化 DI
    service = new PromptTemplateService(null as unknown as DbType);
  });

  describe('render', () => {
    it('正常替换模板中的 {{varName}} 占位符', () => {
      const result = service.render(
        {
          userTemplate: '帮我写一个关于{{keyword}}的{{style}}段子',
          variables: ['keyword', 'style'],
        },
        { keyword: '上班', style: '搞笑' },
      );
      expect(result).toBe('帮我写一个关于上班的搞笑段子');
    });

    it('缺失变量保留 {{varName}} 原样', () => {
      const result = service.render(
        { userTemplate: '{{a}} + {{b}} = ?', variables: ['a', 'b'] },
        { a: '1' },
      );
      expect(result).toBe('1 + {{b}} = ?');
    });

    it('模板中无占位符时原样返回', () => {
      const result = service.render({ userTemplate: '你好世界', variables: ['a'] }, { a: 'x' });
      expect(result).toBe('你好世界');
    });

    it('同变量多处出现全部替换', () => {
      const result = service.render(
        { userTemplate: '{{x}} → {{x}} → {{x}}', variables: ['x'] },
        { x: 'star' },
      );
      expect(result).toBe('star → star → star');
    });

    it('variables 为空数组时不替换', () => {
      const result = service.render({ userTemplate: '{{x}} 保留', variables: [] }, { x: 'v' });
      expect(result).toBe('{{x}} 保留');
    });

    it('空模板返回空字符串', () => {
      const result = service.render({ userTemplate: '', variables: [] }, {});
      expect(result).toBe('');
    });

    it('特殊字符变量值正常替换', () => {
      const result = service.render(
        { userTemplate: '测试：{{content}}', variables: ['content'] },
        { content: '你好，世界！@#$%^&*()_+😄' },
      );
      expect(result).toBe('测试：你好，世界！@#$%^&*()_+😄');
    });

    it('变量名含有下划线', () => {
      const result = service.render(
        { userTemplate: '{{my_var}} 替换', variables: ['my_var'] },
        { my_var: 'OK' },
      );
      expect(result).toBe('OK 替换');
    });

    it('变量值为空字符串时替换为空', () => {
      const result = service.render({ userTemplate: '值：[{{x}}]', variables: ['x'] }, { x: '' });
      expect(result).toBe('值：[]');
    });

    it('模板中含多个不同变量', () => {
      const result = service.render(
        {
          userTemplate: '主题：{{topic}}，风格：{{style}}，长度：{{length}}字',
          variables: ['topic', 'style', 'length'],
        },
        { topic: '上班摸鱼', style: '讽刺', length: '200' },
      );
      expect(result).toBe('主题：上班摸鱼，风格：讽刺，长度：200字');
    });
  });
});
