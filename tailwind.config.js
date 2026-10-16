/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        promind: {
          navy: '#0B132B',
          dark: '#070E1A',
          blue: '#1B4D9B',
          lightBlue: '#2A6FD6',
          sky: '#38BDF8',
          accent: '#0284C7',
          gold: '#C59B27',
          surface: '#111D38',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

