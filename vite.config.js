import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'client'),
  plugins: [vue()],
  build: {
    outDir: resolve(__dirname, 'public'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000' },
      '/covers': { target: 'http://localhost:3000' },
    },
  },
});
