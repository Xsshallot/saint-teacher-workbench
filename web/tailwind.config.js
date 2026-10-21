/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      colors: {
        // SAINT 主题色 #5B84FA 及其色阶
        primary: {
          50: '#EEF3FE',
          100: '#DCE6FD',
          200: '#B9CCFB',
          300: '#8FADFA',
          400: '#6F96FA',
          500: '#5B84FA',
          600: '#3D66E8',
          700: '#2F51C7',
          800: '#2845A0',
          900: '#243B7D',
        },
      },
    },
  },
  plugins: [],
};
