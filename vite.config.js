import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Increases the warning limit to 1000 KB (1 MB)
    chunkSizeWarningLimit: 1000, 
  }
})
