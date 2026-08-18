import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __MINITOOL__: false
  },
  server: {
    port: 3000,
    host: true
  }
});
