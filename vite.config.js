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
    allowedHosts: ['mba.ptit.edu.vn', 'mini.dinhmanhhung.net'],
    // Local dev proxy: routes API calls to local BE, strips prefix
    // This avoids CORS issues and makes cookies work (same-origin)
    proxy: {
      '/auth_mini': {
        target: 'http://localhost:4559',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth_mini/, ''),
      },
      '/mba_mini': {
        target: 'http://localhost:4559',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mba_mini/, '/mba'),
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-icons', 'react-toastify'],
          'admin': [
            './src/pages/AdminDashboard.jsx',
            './src/pages/QuestionManager.jsx',
            './src/pages/UserManager.jsx',
            './src/pages/SourceManager.jsx',
          ],
          'teacher': [
            './src/pages/TeacherDashboard.jsx',
            './src/pages/TeacherQuizHistory.jsx',
          ],
        },
      },
    },

    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    chunkSizeWarningLimit: 500,
  },

  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['plyr'],
  },
});
