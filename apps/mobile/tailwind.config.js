/** @type {import('tailwindcss').Config} */
const flatColors = require('./src/theme/tailwind-colors.cjs');

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: flatColors,
      borderRadius: {
        btn: '12px',
        card: '16px',
        input: '10px',
        tag: '8px',
        sheet: '20px',
      },
      spacing: {
        page: '20px',
        section: '16px',
        'card-gap': '12px',
        item: '8px',
        inline: '4px',
      },
      fontSize: {
        display: ['36px', { lineHeight: '44px' }],
        'title-lg': ['28px', { lineHeight: '36px' }],
        subtitle: ['18px', { lineHeight: '26px' }],
        caption: ['14px', { lineHeight: '20px' }],
        btn: ['16px', { lineHeight: '24px' }],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.12)',
        elevated: '0 4px 16px rgba(0,0,0,0.16)',
        deep: '0 8px 24px rgba(0,0,0,0.24)',
      },
    },
  },
  plugins: [],
};
