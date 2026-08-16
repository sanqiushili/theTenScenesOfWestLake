/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Songti SC"', '"SimSun"', 'serif'],
        calligraphy: ['"Ma Shan Zheng"', '"Noto Serif SC"', 'serif']
      },
      colors: {
        paper: '#F4F1EA',
        ink: {
          dark: '#1A1A1A',
          main: '#2C2C2C',
          mid: '#555555',
          light: '#888888',
          faint: '#C8C5BC'
        },
        mineral: '#3B6B5E',
        lotus: '#7BA07A',
        ochre: '#A0522D',
        gilded: '#C5A55A',
        cinnabar: '#B83B32',
        peach: '#C45A65',
        moon: '#E8E4DF',
        lake: '#1A2836'
      }
    }
  },
  plugins: []
};
