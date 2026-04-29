import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        casino: {
          950: '#04000e',
          900: '#080012',
          800: '#0f0020',
          700: '#180030',
          600: '#220040',
        },
      },
      animation: {
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'confetti': 'confetti 1s ease-out forwards',
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 8px #F59E0B, 0 0 20px #F59E0B44' },
          '50%': { boxShadow: '0 0 20px #F59E0B, 0 0 40px #F59E0B88' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%, 100%': { textShadow: '0 0 8px #F59E0B' },
          '50%': { textShadow: '0 0 20px #F59E0B, 0 0 40px #FBBF24' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gold-shimmer': 'linear-gradient(90deg, #D97706 0%, #FCD34D 25%, #F59E0B 50%, #FCD34D 75%, #D97706 100%)',
        'casino-gradient': 'radial-gradient(ellipse at top, #1a0533 0%, #080012 70%)',
        'card-gradient': 'linear-gradient(135deg, #110020 0%, #1a0030 100%)',
      },
    },
  },
  plugins: [],
}

export default config
