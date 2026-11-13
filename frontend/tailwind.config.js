/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      colors: {
        // TECHMINES portfolio tokens (techmines.github.io)
        panel: { DEFAULT: '#0E0E0E', 2: '#171717' },
        line: '#2E2E2E',
        stroke: '#4D4D4D',
        dim: '#A9A9A9',
        body: '#E2E2E2',
        primary: {
          50: '#FFE9E9', 100: '#FFD0D0', 200: '#FFA3A3', 300: '#FF7A7A', 400: '#FF4D4D',
          500: '#FF2626', 600: '#F5141F', 700: '#C40F18', 800: '#8F0B12', 900: '#5C070B', 950: '#2B0305',
        },
        secondary: {
          // Neutral partner to the red: the portfolio has no second accent colour
          50: '#FFFFFF', 100: '#F5F5F5', 200: '#E2E2E2', 300: '#E2E2E2', 400: '#FFFFFF',
          500: '#E2E2E2', 600: '#A9A9A9', 700: '#4D4D4D', 800: '#2E2E2E', 900: '#171717', 950: '#0E0E0E',
        },
        surface: {
          50: '#FFFFFF', 100: '#F5F5F5', 200: '#E2E2E2', 300: '#D0D0D0', 400: '#A9A9A9',
          500: '#8A8A8A', 600: '#6B6B6B', 700: '#171717', 800: '#0E0E0E', 900: '#080808', 950: '#000000',
        },
      },
      fontFamily: {
        display: ['"Chakra Petch"', '"Arial Narrow"', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(255, 38, 38, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(255,38,38, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
