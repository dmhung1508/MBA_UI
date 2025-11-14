import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/mini/',
  plugins: [react()],
  server: {
    host: true,
    port: 5000,
    hmr: {
      port: 24679,
      host: 'localhost'
    },
    allowedHosts: ['mba.ptit.edu.vn', 'mba.dinhmanhhung.net', "mini.dinhmanhhung.net"] // 👈 thêm dòng này
  }
});
  