import { defineConfig } from 'vite';
import { resolve } from 'path';
import terser from '@rollup/plugin-terser';

// https://vitejs.dev/config/
export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@js': resolve(__dirname, 'src/js'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    // 生成静态资源的存放路径
    assetsInlineLimit: 4096, // 4kb
    // 小于此阈值的导入或引用资源将内联为 base64 编码
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      plugins: [terser()],
      output: {
        manualChunks: {
          vendor: ['@/utils/storage', '@/utils/ui'],
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
});
