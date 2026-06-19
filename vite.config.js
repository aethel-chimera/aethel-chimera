import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // R3F (v9) é sensível a múltiplas cópias de React — deduplicar evita o
  // "Invalid hook call" no dev e em produção.
  resolve: {
    dedupe: ['react', 'react-dom', '@react-three/fiber'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@react-three/fiber', '@react-three/drei', 'three'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          motion: ['gsap', 'lenis'],
        },
      },
    },
  },
})
