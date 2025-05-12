import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          pdfjs: ['pdfjs-dist']
        }
      }
    },
    sourcemap: true,
    chunkSizeWarningLimit: 2000
  }
}) 