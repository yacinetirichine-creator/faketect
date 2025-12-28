/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eef9ff', 100: '#d8f1ff', 200: '#b9e7ff', 300: '#89daff', 400: '#52c4ff', 500: '#2aa4ff', 600: '#1485f7', 700: '#0d6de3', 800: '#1258b8', 900: '#154b91' },
        secondary: { 50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
        accent: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7c3aed' },
        surface: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
