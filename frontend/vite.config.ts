import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    outDir: 'dist',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
