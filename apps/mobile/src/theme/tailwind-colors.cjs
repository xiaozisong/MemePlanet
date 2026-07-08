// 与 colors.ts 保持一致的扁平颜色映射（供 tailwind.config.js CJS require 使用）
// 更新 colors.ts 时请同步更新此文件
const twColors = {
  brand: {
    DEFAULT: '#FF5A1F',
    light: '#FF8A5C',
    dark: '#E04A14',
  },
  accent: {
    DEFAULT: '#7C3AFF',
    light: '#A78BFA',
    dark: '#5B21B6',
  },
  ink: {
    DEFAULT: '#0F0F12',
    soft: '#1A1A20',
    elevated: '#252530',
    surface: '#2A2A35',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0B0',
    muted: '#6B6B78',
    disabled: '#4A4A55',
  },
  border: {
    DEFAULT: '#2A2A35',
    light: '#3A3A48',
    strong: '#4A4A58',
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  god: {
    DEFAULT: '#FFD700',
    light: '#FFE873',
  },
  trash: {
    DEFAULT: '#6B7280',
    light: '#9CA3AF',
  },
  overlay: {
    DEFAULT: 'rgba(0, 0, 0, 0.6)',
    light: 'rgba(0, 0, 0, 0.4)',
  },
  ai: {
    DEFAULT: '#7C3AFF',
    bg: 'rgba(124, 58, 255, 0.12)',
  },
  tag: {
    bg: 'rgba(255, 90, 31, 0.12)',
    text: '#FF8A5C',
  },
};

module.exports = twColors;
