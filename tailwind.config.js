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
          50: '#fff7ed', // Orange 50
          100: '#ffedd5', // Orange 100
          200: '#fed7aa', // Orange 200
          300: '#fdba74', // Orange 300
          400: '#fb923c', // Orange 400
          500: '#f97316', // Orange 500
          600: '#ea580c', // Orange 600
          700: '#c2410c', // Orange 700
        },
        slate: {
          50: '#fdfbff', // Very subtle purple tint background
        }
      },
      fontFamily: {
        sans: ['"Outfit"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
