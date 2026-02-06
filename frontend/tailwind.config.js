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
        },
        secondary: {
          DEFAULT: '#4A5568',
          dark: '#2D3748',
          light: '#718096',
        },
        accent: {
          blue: '#3182CE',
          purple: '#553C9A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
