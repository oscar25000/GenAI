import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const filesToCopy = ['manifest.json', 'content.js']
      for (const f of filesToCopy) {
        const src = resolve(__dirname, 'public', f)
        if (existsSync(src)) {
          copyFileSync(src, resolve(distDir, f))
        }
      }
      const iconsSrc = resolve(__dirname, 'public/icons')
      if (existsSync(iconsSrc)) {
        const iconsDest = resolve(distDir, 'icons')
        if (!existsSync(iconsDest)) mkdirSync(iconsDest, { recursive: true })
        for (const file of readdirSync(iconsSrc)) {
          const src = resolve(iconsSrc, file)
          if (statSync(src).isFile()) {
            copyFileSync(src, resolve(iconsDest, file))
          }
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        background: resolve(__dirname, 'src/background.js'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') return 'background.js'
          return 'assets/[name]-[hash].js'
        },
      },
    },
  },
})
