import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
  },
  build: {
    // Optimisations de production
    target: 'esnext',
    minify: 'esbuild', // esbuild est intégré à Vite (plus rapide que terser)
    // Code splitting pour des chunks plus petits
    rollupOptions: {
      output: {
        manualChunks: {
          // Séparer les vendors pour un meilleur caching
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-utils': ['axios', 'zustand', 'i18next', 'react-i18next'],
          'vendor-pdf': ['jspdf']
        }
      }
    },
    // Réduire la taille du bundle
    chunkSizeWarningLimit: 500,
    sourcemap: false
  },
  // Supprimer console.log en production via esbuild
  esbuild: {
    drop: ['console', 'debugger']
  },
  // Optimisations de dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand']
  }
})
