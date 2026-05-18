/** @type {import('tailwindcss').Config} */
export default {
  content: ['./popup.html', './dashboard.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07060B',
          900: '#0B0A12',
          800: '#11101A',
          700: '#181724',
          600: '#1F1D2E',
          500: '#2A2840',
          400: '#3A3756',
        },
        violet: {
          50: '#F4F1FF',
          100: '#E9E2FF',
          200: '#D2C2FF',
          300: '#B59CFF',
          400: '#9B7BFF',
          500: '#8257FF',
          600: '#6A3BF5',
          700: '#5429D6',
          800: '#3F1FA3',
          900: '#2A1576',
        },
      },
      boxShadow: {
        glow: '0 0 60px -10px rgba(130, 87, 255, 0.45)',
        soft: '0 8px 32px -8px rgba(0, 0, 0, 0.5)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 40px -20px rgba(0,0,0,0.6)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'SF Pro Display',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseDot: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.5, transform: 'scale(1.4)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 400ms ease-out both',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-dot': 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
