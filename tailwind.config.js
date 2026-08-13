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
        pinchos: {
          dark: '#0f172a',      // Mörk bakgrund
          card: '#1e293b',      // Mörkare slateglas
          accent: '#f59e0b',    // Guldig accent
          gold: '#fbbf24',      // Ljusare guld
          goldDark: '#b45309',  // Mörkare guld
          red: '#881337',       // Mörkröd primärfärg
          redLight: '#9f1239',  // Ljusare mörkröd
          redDark: '#4c0519',   // Djup vinröd
        },
      },
      backgroundImage: {
        'circus-banner': 'repeating-linear-gradient(45deg, #881337, #881337 20px, #4c0519 20px, #4c0519 40px)',
        'circus-tent': 'radial-gradient(ellipse at top, #9f1239 0%, #0f172a 70%)',
        'gold-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #b45309 100%)',
        'dark-glass': 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(245, 158, 11, 0.35)',
        'red-glow': '0 0 20px rgba(136, 19, 55, 0.5)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounce 2s infinite',
        'curtain-reveal': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
