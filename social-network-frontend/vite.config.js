import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    // Listen on 0.0.0.0 so the dev server is reachable inside Docker.
    host: true,
    // Same port as before (docker-compose maps FRONTEND_PORT to 8080).
    port: 8080,
    strictPort: true
  },
  preview: {
    port: 8080
  },
  test: {
    environment: 'jsdom'
  }
});
