/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF5A1F',
          dark: '#E04A14',
        },
        ink: {
          DEFAULT: '#0F0F12',
          soft: '#1A1A20',
        },
      },
    },
  },
  plugins: [],
};
