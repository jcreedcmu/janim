import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@napi-rs/canvas'],
  },
  build: {
    rollupOptions: {
      external: ['@napi-rs/canvas'],
    },
  },
});
