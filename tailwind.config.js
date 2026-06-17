/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#0f172a', muted: '#1e293b', border: '#334155' },
        accent: { DEFAULT: '#38bdf8', dim: '#0ea5e9' },
      },
    },
  },
  plugins: [],
};
