/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'void': '#000000',
        'deep': '#020804',
        'surface': '#050f08',
        'card': '#0a1a0f',
        'green-neon': '#00ff6a',
        'green-mid': '#00c44f',
        'green-dark': '#003d1a',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'vinyl-spin': 'vinylSpin 20s linear infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'wave-dot': 'waveDot 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
