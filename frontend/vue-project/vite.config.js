import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: false,
    cors: true,
    watch: {
      usePolling: true
    }
  },
  preview: {
    port: 3000,
    strictPort: false,
    host: '127.0.0.1'
  },
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ['@stellar/stellar-sdk']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'stellar-sdk': ['@stellar/stellar-sdk']
        }
      }
    }
  }
})
