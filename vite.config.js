import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@styles': resolve(__dirname, './src/styles'),
      '@js': resolve(__dirname, './src/js'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
