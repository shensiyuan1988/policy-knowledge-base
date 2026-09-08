/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        gov: {
          primary: '#1A73E8',
          dark: '#1557B0',
          deeper: '#0B3D91',
          navy: '#0F2A4A',
          sidebar: '#12294A',
          bg: '#F4F6FA',
          border: '#E4E9F2',
        },
      },
      fontFamily: {
        sans: [
          'PingFang SC',
          'Microsoft YaHei',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 42, 74, 0.06), 0 1px 2px rgba(15, 42, 74, 0.04)',
        cardHover: '0 4px 14px rgba(26, 115, 232, 0.12)',
      },
    },
  },
  plugins: [],
};
