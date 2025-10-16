import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { rmSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to exclude models from production build (served from CDN)
    {
      name: 'exclude-models-from-dist',
      apply: 'build',
      closeBundle() {
        // Remove models directory after build completes
        const modelsPath = resolve(__dirname, 'dist/models');
        try {
          rmSync(modelsPath, { recursive: true, force: true });
          console.log('✓ Excluded models directory from dist (will be served from CDN)');
        } catch (error) {
          console.log('Note: Models directory not found in dist (may already be excluded)');
        }
      },
    },
  ],
})
