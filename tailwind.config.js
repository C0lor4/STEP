/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        '0.15em': '0.15em',
        '0.2em': '0.2em',
        '0.3em': '0.3em',
      },
    },
  },
  plugins: [],
}