/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './index.html',
    './App.tsx',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['"New Title"', 'sans-serif'],
      },
      colors: {
        background: '#FFFFFF',
        surface: '#F9FAFB',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'border-color': '#E5E7EB',
        primary: '#000000',
        dark: {
          background: '#080808',
          surface: '#121212',
          'text-primary': '#FAFAFA',
          'text-secondary': '#a3a3a3',
          'border-color': '#262626',
          primary: '#D946EF',
          'heading-inactive': '#404040',
        },
      },
    },
  },
  plugins: [],
}