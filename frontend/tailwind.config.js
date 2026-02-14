/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1e1e1e',
        'dark-bg-elevated': '#252526',
        'dark-bg-input': '#3c3c3c',
        'dark-bg-hover': '#2a2d2e',
        'dark-border': '#3e3e42',
        'dark-text': '#cccccc',
        'dark-text-muted': '#858585',
      },
    },
  },
  plugins: [],
}
