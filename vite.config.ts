import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
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
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist']
        }
      }
    },
    chunkSizeWarningLimit: 2000
  }
}) 