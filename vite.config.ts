import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs (`./assets/...`) keep the build working wherever the
  // site is mounted, including subpaths such as /chordbook/. The app has no
  // path-based routing (state lives in the query string), so relative paths
  // are safe. Set VITE_BASE to override for a specific deployment.
  base: process.env.VITE_BASE ?? './',
  plugins: [react()],
  build: {
    // The vendored chords-db guitar and ukulele datasets are bundled and
    // dominate the chunk size (~1.4 MB before gzip).
    chunkSizeWarningLimit: 1500,
  },
})
