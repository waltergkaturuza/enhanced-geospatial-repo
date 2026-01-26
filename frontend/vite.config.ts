import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure public files are copied
    copyPublicDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  // Configure for SPA routing
  preview: {
    port: 5173,
    strictPort: true,
  },
})
