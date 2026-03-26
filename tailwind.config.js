/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sanctuary Mode - Warm/Calm
        sanctuary: {
          bg: '#fffef8',
          primary: '#f8eedd',
          secondary: '#f0e2c5',
          text: '#3a2812',
          accent: '#c8a870',
          muted: '#9a8060'
        },
        // Theophany Mode - Electric/Dark
        theophany: {
          bg: '#010407',
          primary: '#030a0e',
          secondary: '#060c14',
          text: '#c8e0e0',
          accent: '#7ababa',
          muted: '#2e5858'
        }
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'Cinzel', 'Georgia', 'serif'],
        serif: ['Cinzel', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Didact Gothic', 'system-ui', 'sans-serif']
      },
      keyframes: {
        bfIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        bpop: {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        bfIn: 'bfIn 0.6s ease forwards',
        bpop: 'bpop 0.35s ease both'
      }
    }
  },
  plugins: []
}
