/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
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
          background: '#0a0610',
          surface: '#180f24',
          'text-primary': '#f3e8ff',
          'text-secondary': '#a89db9',
          'border-color': '#3f254d',
          primary: '#D946EF',
          'heading-inactive': '#21182f',
        },
      },
    },
  },
  plugins: [],
}
