import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'main.wasm',
        'main.wasm-loader.js',
        'wasm_exec.js'
      ],
      manifest: {
        name: 'CAAF Orchestrator',
        short_name: 'CAAF',
        description: 'Client-Side AI Agent Framework',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Increase the file size limit to allow large WASM assets (e.g., ort-wasm)
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // 30 MB
        // Optionally, you can exclude large WASM from precaching if not needed offline
        // globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}']
      }
    })
  ],
})
