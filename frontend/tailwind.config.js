/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D4A84B',
          dark: '#B8923F',
          light: '#E5C46A',
          50: '#FDF8ED',
        },
        secondary: {
          DEFAULT: '#6B5340',
          dark: '#4A3520',
          light: '#8C7A6B',
        },
        accent: {
          DEFAULT: '#8B6D3F',
          warm: '#C4956A',
        },
        cream: {
          DEFAULT: '#FFFBF0',
          dark: '#FDF3E0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
