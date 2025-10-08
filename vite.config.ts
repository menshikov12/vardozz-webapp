import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'misleadingly-brainy-kingbird.cloudpub.ru',
      'localhost'
    ],
    // Включаем hot reload
    hmr: {
      port: 5173,
      clientPort: 5173
    },
    // Прокси для dev:watch режима (когда frontend на 5173, а API на 3001)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
    // Настройки для отслеживания изменений
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
