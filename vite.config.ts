import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    // The vendored chords-db guitar and ukulele datasets are bundled and
    // dominate the chunk size (~1.4 MB before gzip).
    chunkSizeWarningLimit: 1500,
  },
})
