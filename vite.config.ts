import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Load pre-stamped buildinfo (written by scripts/stamp.js before each push)
let buildInfo = { version: pkg.version, hash: 'unknown', date: new Date().toISOString().slice(0, 10) };
try {
  const stamped = JSON.parse(readFileSync('./src/buildinfo.json', 'utf-8'));
  buildInfo = { ...buildInfo, ...stamped };
} catch { /* file not present, use defaults */ }

// Override with live git data when available (local dev)
try {
  buildInfo.hash = execSync('git rev-parse --short HEAD').toString().trim();
  const count = execSync('git rev-list --count HEAD').toString().trim();
  const [major, minor] = pkg.version.split('.');
  buildInfo.version = `${major}.${minor}.${count}`;
} catch { /* git not available, keep stamped values */ }

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildInfo.version),
    __GIT_HASH__:    JSON.stringify(buildInfo.hash),
    __BUILD_DATE__:  JSON.stringify(buildInfo.date),
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
