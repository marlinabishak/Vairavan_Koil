/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Exact Figma tokens */
        'fig-bg': '#f4ead7',
        'fig-text': '#000000',
        'fig-maroon': '#5c292c',
        'fig-border-light': '#c7b0a4',
        'fig-border-card': '#cdb9ab',
        'fig-white': '#ffffff',
        'fig-gray': '#808080',
        'fig-present-green': '#45b653',
        'fig-orange': '#f37435',
        'fig-yellow': '#fbb12f',
        'fig-blue': '#6f8ea8',
        'fig-todo-header': '#cdb9ab',
      },
      fontFamily: {
        barlow: ['Barlow', 'sans-serif'],
      },
      borderRadius: {
        'fig-date': '3px',
        'fig-pill': '15px',
        'fig-toggle': '14.5px',
        'fig-avatar': '26.5px',
      },
      fontSize: {
        'fig-9': ['9px', { lineHeight: '10.8px' }],
        'fig-12': ['12px', { lineHeight: '14.4px' }],
        'fig-14': ['14px', { lineHeight: '16.8px' }],
        'fig-14-todo': ['14px', { lineHeight: '21px' }],
        'fig-14-panch': ['14px', { lineHeight: '18px' }],
        'fig-18': ['18px', { lineHeight: '21.6px' }],
        'fig-24': ['24px', { lineHeight: '28.8px' }],
      },
    },
  },
  plugins: [],
};
