/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0b0f19',
          card: '#131b2e',
          border: '#1f293d',
          accent: '#00f0ff',
          green: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          blue: '#3b82f6'
        }
      }
    },
  },
  plugins: [],
}
