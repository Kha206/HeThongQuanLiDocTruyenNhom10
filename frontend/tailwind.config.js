/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marvel: {
          dark: '#0F0F14',
          card: '#1A1A22',
          cardHover: '#23232E',
          border: '#2A2A38',
          red: '#ED1D24',
          redGlow: '#FF3333',
          cosmicBlue: '#4D6FFF',
          gold: '#FFD700'
        }
      },
      fontFamily: {
        italiana: ['Italiana', 'serif'],
        merriweather: ['Merriweather', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
