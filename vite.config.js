import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

// Plugin to serve standalone HTML pages before Vite's SPA fallback kicks in
function serveStaticHtml(pages) {
  return {
    name: 'serve-static-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (pages.includes(req.url)) {
          const filePath = resolve(server.config.root, req.url.slice(1));
          if (existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/html');
            res.end(readFileSync(filePath, 'utf-8'));
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    serveStaticHtml(['/script-visualization.html']),
    react()
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    open: false,
    watch: {
      ignored: ['**/script-visualization.html']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'script-visualization': resolve(__dirname, 'script-visualization.html')
      }
    }
  }
});
