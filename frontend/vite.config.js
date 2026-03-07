import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-192-maskable.png', 'icons/icon-512-maskable.png', 'icons/icon.svg'],
      devOptions: {
        enabled: true, // Enable SW in dev mode for testing
      },
      manifest: {
        name: 'DevBlog — Developer Stories & Tutorials',
        short_name: 'DevBlog',
        description: 'A modern platform for developers to share knowledge, stories, and ideas.',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cache all static assets (JS, CSS, fonts, images)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Runtime caching: posts list — network first, fallback to cache
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/posts'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-posts',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/users'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-users',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 6 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
})
