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
          DEFAULT: '#991B1B', // Deep burgundy red
          dark: '#7F1D1D',
          light: '#DC2626',
          50: '#FEF2F2',
        },
        secondary: {
          DEFAULT: '#64748B',
          dark: '#334155',
          light: '#94A3B8',
        },
        accent: {
          DEFAULT: '#B91C1C',
          warm: '#DC2626',
        },
        cream: {
          DEFAULT: '#F8FAFC',
          dark: '#F1F5F9',
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
