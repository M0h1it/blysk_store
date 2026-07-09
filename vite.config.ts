import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Run this frontend on 5000 so port 4000 stays free for the backend API.
    port: 5000,
    strictPort: true,
  },
})
