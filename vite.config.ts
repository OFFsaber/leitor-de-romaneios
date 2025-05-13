import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/leitor-de-romaneios/',
  optimizeDeps: {
    include: ['pdfjs-dist/legacy/build/pdf']
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    fs: {
      allow: ['..']
    }
  },
  preview: {
    port: 5173,
    host: true,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      external: ['jspdf'],
      output: {
        globals: {
          jspdf: 'jspdf'
        },
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled',
            'pdfjs-dist',
            'html5-qrcode'
          ]
        },
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    chunkSizeWarningLimit: 2000
  }
}) 