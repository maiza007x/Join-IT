import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    // path ที่เว็บถูกโฮสต์ (เช่น /joinit/ บน IIS) ตั้งใน .env.production; dev ใช้ /
    base: env.VITE_BASE_PATH || '/',
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      host: '0.0.0.0',
      port: 5177,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:5003'
      }
    }
  }
})
