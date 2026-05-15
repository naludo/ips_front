import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://10.182.173.176:8000',
        changeOrigin: true,
        ws: true
      },
      '/ws': {
        target: 'ws://10.182.173.176:8000',
        changeOrigin: true,
        ws: true
      }
    },
    port:8080
  }
})