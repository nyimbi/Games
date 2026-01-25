/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Scholar's Study Palette
        ink: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#1a365d', // Primary deep ink blue
          950: '#102a43',
        },
        cream: {
          50: '#fffffe',
          100: '#fefcf6', // Primary warm cream
          200: '#fdf8ed',
          300: '#faf3e0',
          400: '#f5ead0',
        },
        gold: {
          50: '#fef9ec',
          100: '#fcf0cd',
          200: '#f9de9b',
          300: '#f5c85a',
          400: '#d4a547', // Primary scholar gold
          500: '#c4932c',
          600: '#a07423',
          700: '#7c5820',
          800: '#674822',
          900: '#583c21',
        },
        sage: {
          50: '#f0f5f3',
          100: '#dce8e3',
          200: '#bcd4ca',
          300: '#93baab',
          400: '#6b9080', // Primary sage green
          500: '#527868',
          600: '#406054',
          700: '#364e45',
          800: '#2e403a',
          900: '#283632',
        },
        coral: {
          50: '#fef3f0',
          100: '#fde4de',
          200: '#fccdc2',
          300: '#f9a898',
          400: '#e07a5f', // Primary coral pop
          500: '#d65d3e',
          600: '#c44830',
          700: '#a33a28',
          800: '#873326',
          900: '#702f26',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Custom scale for readability
        'display-xl': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-md': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'display-sm': ['1.5rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
      },
      spacing: {
        // Custom spacing for touch-friendly targets
        'touch': '48px',
        'touch-lg': '56px',
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '10px',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(26, 54, 93, 0.08)',
        'card-hover': '0 8px 30px rgba(26, 54, 93, 0.12)',
        'button': '0 2px 8px rgba(26, 54, 93, 0.1)',
        'glow-gold': '0 0 20px rgba(212, 165, 71, 0.3)',
        'glow-sage': '0 0 20px rgba(107, 144, 128, 0.3)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'confetti': 'confetti 1s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'timer-pulse': 'timerPulse 1s ease-in-out infinite',
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
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 165, 71, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 165, 71, 0.5)' },
        },
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        timerPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
