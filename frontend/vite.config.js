import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@game': path.resolve(__dirname, './src/game'),
      '@services': path.resolve(__dirname, './src/services'),
      '@managers': path.resolve(__dirname, './src/managers'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@ui': path.resolve(__dirname, './src/ui')
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
