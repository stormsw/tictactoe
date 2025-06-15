/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-x': '#dc2626',
        'game-o': '#2563eb',
      },
      gridTemplateColumns: {
        'game': 'repeat(3, 1fr)',
      },
    },
  },
  plugins: [],
}
