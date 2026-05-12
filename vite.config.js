import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const authProxyTarget = env.VITE_DEV_PROXY_AUTH_TARGET || 'http://localhost:4559';
  const mbaProxyTarget = env.VITE_DEV_PROXY_MBA_TARGET || 'http://localhost:4558';

  return {
    base: '/mini/',
    plugins: [react()],

    server: {
      host: true,
      port: 5000,
      hmr: {
        port: 24679,
        host: 'localhost'
      },
      // Allow serving behind arbitrary reverse-proxy domains.
      // This prevents host-header blocks when running through custom domains.
      allowedHosts: true,
      // Local dev proxy: route same-origin requests to backend services.
      proxy: {
        '/auth_mini': {
          target: authProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth_mini/, ''),
        },
        '/mba_mini': {
          target: mbaProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mba_mini/, ''),
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
  };
});
