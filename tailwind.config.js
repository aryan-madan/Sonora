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
          background: '#0D0A10',
          surface: '#18151B',
          'text-primary': '#FAFAFA',
          'text-secondary': '#a3a3a3',
          'border-color': '#2D2A30',
          primary: '#D946EF',
          'heading-inactive': '#413E42',
        },
      },
    },
  },
  plugins: [],
}