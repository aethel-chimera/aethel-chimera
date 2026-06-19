/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0B10',
        'obsidian-deep': '#07070B',
        titanium: '#C8CAD0',
        ivory: '#F4F2EC',
        amber: '#E0A458',
        signal: '#3DDC97',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        wide2: '0.18em',
      },
    },
  },
  plugins: [],
}
