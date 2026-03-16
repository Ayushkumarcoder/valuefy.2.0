import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all /api requests to the Node backend to avoid CORS issues
      '/api': 'http://localhost:3001'
    }
  }
})
