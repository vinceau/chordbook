import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    // The vendored chords-db guitar dataset is bundled and dominates the
    // chunk size (~1 MB before gzip).
    chunkSizeWarningLimit: 1100,
  },
})
