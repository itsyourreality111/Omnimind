import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#05080f',
        surface: '#0d1525',
        card: '#101a2e',
        border: 'rgba(255,255,255,0.07)',
        cyan: {
          DEFAULT: '#00d4ff',
          dim: 'rgba(0,212,255,0.12)',
        },
        amber: {
          DEFAULT: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
        serif: ['var(--font-instrument-serif)', 'serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'blink': 'blink 2s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
}

export default config
