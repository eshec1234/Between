/** @type {import('tailwindcss').Config} */
/* Color tokens for Tailwind v4 live in src/styles/index.css @theme — this file only extends fonts/animations. */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Unused in v4 build — kept for reference only; see @theme in index.css
        sanctuary: {
          bg: '#fff9f0',
          primary: '#f5e8d4',
          secondary: '#e8d4b8',
          text: '#1a1208',
          accent: '#b8893a',
          muted: '#5c4a32'
        },
        theophany: {
          bg: '#030608',
          primary: '#050c10',
          secondary: '#081018',
          text: '#e4f2f2',
          accent: '#8ecbcb',
          muted: '#6a9a9a'
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
