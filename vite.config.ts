import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dnd-combat-tracker/',
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split markdown dependencies into a separate chunk
          if (id.includes('react-markdown') || id.includes('remark-gfm')) {
            return 'markdown';
          }
        }
      }
    }
  }
})
