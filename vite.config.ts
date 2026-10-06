import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

function gitHash() {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
}

function gitCommitCount() {
  try { return execSync('git rev-list --count HEAD').toString().trim(); }
  catch { return '0'; }
}

// Auto-version: major.minor from package.json, patch = git commit count
const [major, minor] = pkg.version.split('.');
const autoVersion = `${major}.${minor}.${gitCommitCount()}`;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(autoVersion),
    __GIT_HASH__:    JSON.stringify(gitHash()),
    __BUILD_DATE__:  JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'LabelQuote',
        short_name: 'LabelQuote',
        description: 'Roll label sticker quotation app',
        theme_color: '#2563eb',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\//,
            handler: 'NetworkFirst',
          },
        ],
      },
    }),
  ],
})
