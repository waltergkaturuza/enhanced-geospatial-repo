import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve('./src'),
      '@/lib': resolve('./src/lib'),
      '@/components': resolve('./src/components'),
      '@/types': resolve('./src/types'),
      '@/contexts': resolve('./src/contexts'),
      '@/hooks': resolve('./src/hooks'),
      '@/constants': resolve('./src/constants'),
      '@/assets': resolve('./src/assets'),
      '@/tests': resolve('./src/tests'),
    },
  },
})
