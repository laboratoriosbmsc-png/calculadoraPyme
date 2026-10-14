import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/calculadora-pyme.svg', 'icons/calculadora-pyme-apple-180.png'],
      manifest: {
        id: '/',
        name: 'Calculadora Pyme',
        short_name: 'Calculadora Pyme',
        description: 'Calculadora Pyme para la evaluación de solicitudes.',
        lang: 'es-BO',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#006341',
        background_color: '#f8f9f7',
        icons: [
          { src: '/icons/calculadora-pyme-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/calculadora-pyme-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/calculadora-pyme-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    allowedHosts: ['small-cycles-rush.loca.lt'],
  },
  preview: {
    allowedHosts: ['calculadorapyme.onrender.com'],
  },
})
