import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: '185.181.10.160:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Define which files to use as environment files
  envDir: '.',
}))
