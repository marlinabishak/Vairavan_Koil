import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function htmlVersionPlugin() {
  const version = Date.now();
  return {
    name: 'html-version-plugin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/bundle\.js/g, `bundle.js?v=${version}`)
        .replace(/bundle\.css/g, `bundle.css?v=${version}`);
    }
  };
}

export default defineConfig({
  plugins: [react(), htmlVersionPlugin()],
  base: './',
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',
        chunkFileNames: 'bundle-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'bundle.css';
          }
          return '[name].[ext]';
        }
      }
    }
  }
});


