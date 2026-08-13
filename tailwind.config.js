/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bubblegum: '#F3A2BE',
        cottoncandy: '#FFD3DD',
        candyfloss: '#F0F9F8',
        mint: '#C6E6E3',
        wintergreen: '#81BFB7',
        diner: {
          pink: '#F3A2BE',
          lightPink: '#FFD3DD',
          whiteTone: '#F0F9F8',
          mint: '#C6E6E3',
          teal: '#81BFB7',
          darkTeal: '#4F8881',
          accent: '#E11D48',
        },
        pinchos: {
          dark: '#1e293b',
          card: '#ffffff',
          accent: '#81BFB7',
          gold: '#F3A2BE',
          goldDark: '#4F8881',
          red: '#F3A2BE',
          redLight: '#FFD3DD',
          redDark: '#81BFB7',
        },
      },
      backgroundImage: {
        'diner-bg': 'radial-gradient(ellipse at top, #FFD3DD 0%, #F0F9F8 60%, #C6E6E3 100%)',
        'diner-pattern': 'linear-gradient(135deg, rgba(255, 211, 221, 0.4) 0%, rgba(240, 249, 248, 0.6) 50%, rgba(198, 230, 227, 0.4) 100%)',
        'diner-banner': 'repeating-linear-gradient(45deg, #F3A2BE, #F3A2BE 20px, #81BFB7 20px, #81BFB7 40px)',
        'diner-card': 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 248, 0.9) 100%)',
      },
      boxShadow: {
        'neon-pink': '0 0 10px #F3A2BE, 0 0 20px #F3A2BE, 0 0 30px #e11d48',
        'mint-glow': '0 0 15px rgba(129, 191, 183, 0.4)',
        'diner-card': '0 10px 25px -5px rgba(129, 191, 183, 0.25), 0 8px 10px -6px rgba(243, 162, 190, 0.2)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'curtain-reveal': 'fadeIn 0.5s ease-out forwards',
        'neon-flicker': 'neonFlicker 2.5s infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        neonFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.92' },
          '52%': { opacity: '1' },
          '54%': { opacity: '0.85' },
          '56%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
