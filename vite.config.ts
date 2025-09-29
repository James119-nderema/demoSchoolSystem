import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://techhubai.pythonanywhere.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Define which files to use as environment files
  envDir: '.',
}))
