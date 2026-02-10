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
          DEFAULT: '#1E3A8A', // Navy blue from church sign
          dark: '#1E293B',
          light: '#3B82F6',
          50: '#EFF6FF',
        },
        secondary: {
          DEFAULT: '#64748B',
          dark: '#334155',
          light: '#94A3B8',
        },
        accent: {
          DEFAULT: '#F59E0B',
          warm: '#FBBF24',
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
