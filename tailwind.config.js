/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // PALETA NEUTRA (reset): monocromático cru, pronto p/ um novo design.
      // Os mesmos tokens da marca (amber/violet/signal) agora apontam p/ cinzas,
      // então as classes existentes continuam válidas, sem cor.
      colors: {
        obsidian: '#0B0B10',
        'obsidian-deep': '#07070B',
        titanium: '#BFC1C6',
        ivory: '#F4F4F5',
        amber: '#D8D8DA',
        violet: '#9CA0A6',
        signal: '#C4C6CA',
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
