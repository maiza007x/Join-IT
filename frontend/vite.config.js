import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: true  // อนุญาตให้ทดสอบ PWA ในโหมด dev ได้
    //   },
    //   manifest: {
    //     name: 'Join IT Support',
    //     short_name: 'Join-IT',
    //     description: 'ระบบจัดการงานไอที (IT Support Management)',
    //     theme_color: '#2563eb',
    //     background_color: '#f8fafc',
    //     display: 'standalone',
    //     icons: [
    //       {
    //         src: '/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: '/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   }
    // })
  ], 
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
