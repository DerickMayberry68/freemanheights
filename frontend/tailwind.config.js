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
          DEFAULT: '#1e3a8a', // Royal blue (logo banner)
          dark: '#0f2057',    // Deep navy (logo vignette)
          light: '#2563eb',   // Cobalt blue (logo cross glow)
          50: '#eff6ff',      // Very light blue
        },
        secondary: {
          DEFAULT: '#64748B',
          dark: '#334155',
          light: '#94A3B8',
        },
        accent: {
          DEFAULT: '#ca8a04', // Gold (logo sparkles)
          warm: '#eab308',
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
      keyframes: {
        'word-flicker': {
          '0%': { opacity: '0' },
          '15%': { opacity: '0.3' },
          '35%': { opacity: '0.3' },
          '50%': { opacity: '0' },
          '100%': { opacity: '0' },
        },
        ticker: {
          '0%': { left: '100%' },
          '100%': { left: '-100%' },
        },
      },
      animation: {
        'word-flicker': 'word-flicker 4s ease-in-out infinite',
        'ticker': 'ticker 28s linear infinite',
      },
    },
  },
  plugins: [],
}
