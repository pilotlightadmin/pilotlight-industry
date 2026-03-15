// vite.config.js
import { defineConfig } from "file:///sessions/optimistic-funny-franklin/mnt/pilot-light/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/optimistic-funny-franklin/mnt/pilot-light/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";
var __vite_injected_original_dirname = "/sessions/optimistic-funny-franklin/mnt/pilot-light";
function serveStaticHtml(pages) {
  return {
    name: "serve-static-html",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (pages.includes(req.url)) {
          const filePath = resolve(server.config.root, req.url.slice(1));
          if (existsSync(filePath)) {
            res.setHeader("Content-Type", "text/html");
            res.end(readFileSync(filePath, "utf-8"));
            return;
          }
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [
    serveStaticHtml(["/script-visualization.html"]),
    react()
  ],
  server: {
    port: 3e3,
    host: "0.0.0.0",
    open: false,
    watch: {
      ignored: ["**/script-visualization.html"]
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html"),
        "script-visualization": resolve(__vite_injected_original_dirname, "script-visualization.html")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvb3B0aW1pc3RpYy1mdW5ueS1mcmFua2xpbi9tbnQvcGlsb3QtbGlnaHRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy9vcHRpbWlzdGljLWZ1bm55LWZyYW5rbGluL21udC9waWxvdC1saWdodC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMvb3B0aW1pc3RpYy1mdW5ueS1mcmFua2xpbi9tbnQvcGlsb3QtbGlnaHQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tICdmcyc7XG5cbi8vIFBsdWdpbiB0byBzZXJ2ZSBzdGFuZGFsb25lIEhUTUwgcGFnZXMgYmVmb3JlIFZpdGUncyBTUEEgZmFsbGJhY2sga2lja3MgaW5cbmZ1bmN0aW9uIHNlcnZlU3RhdGljSHRtbChwYWdlcykge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdzZXJ2ZS1zdGF0aWMtaHRtbCcsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKHBhZ2VzLmluY2x1ZGVzKHJlcS51cmwpKSB7XG4gICAgICAgICAgY29uc3QgZmlsZVBhdGggPSByZXNvbHZlKHNlcnZlci5jb25maWcucm9vdCwgcmVxLnVybC5zbGljZSgxKSk7XG4gICAgICAgICAgaWYgKGV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9odG1sJyk7XG4gICAgICAgICAgICByZXMuZW5kKHJlYWRGaWxlU3luYyhmaWxlUGF0aCwgJ3V0Zi04JykpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBuZXh0KCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzZXJ2ZVN0YXRpY0h0bWwoWycvc2NyaXB0LXZpc3VhbGl6YXRpb24uaHRtbCddKSxcbiAgICByZWFjdCgpXG4gIF0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIG9wZW46IGZhbHNlLFxuICAgIHdhdGNoOiB7XG4gICAgICBpZ25vcmVkOiBbJyoqL3NjcmlwdC12aXN1YWxpemF0aW9uLmh0bWwnXVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICAgICdzY3JpcHQtdmlzdWFsaXphdGlvbic6IHJlc29sdmUoX19kaXJuYW1lLCAnc2NyaXB0LXZpc3VhbGl6YXRpb24uaHRtbCcpXG4gICAgICB9XG4gICAgfVxuICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlUsU0FBUyxvQkFBb0I7QUFDeFcsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGNBQWMsa0JBQWtCO0FBSHpDLElBQU0sbUNBQW1DO0FBTXpDLFNBQVMsZ0JBQWdCLE9BQU87QUFDOUIsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sZ0JBQWdCLFFBQVE7QUFDdEIsYUFBTyxZQUFZLElBQUksQ0FBQyxLQUFLLEtBQUssU0FBUztBQUN6QyxZQUFJLE1BQU0sU0FBUyxJQUFJLEdBQUcsR0FBRztBQUMzQixnQkFBTSxXQUFXLFFBQVEsT0FBTyxPQUFPLE1BQU0sSUFBSSxJQUFJLE1BQU0sQ0FBQyxDQUFDO0FBQzdELGNBQUksV0FBVyxRQUFRLEdBQUc7QUFDeEIsZ0JBQUksVUFBVSxnQkFBZ0IsV0FBVztBQUN6QyxnQkFBSSxJQUFJLGFBQWEsVUFBVSxPQUFPLENBQUM7QUFDdkM7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUNBLGFBQUs7QUFBQSxNQUNQLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsZ0JBQWdCLENBQUMsNEJBQTRCLENBQUM7QUFBQSxJQUM5QyxNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsU0FBUyxDQUFDLDhCQUE4QjtBQUFBLElBQzFDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUNyQyx3QkFBd0IsUUFBUSxrQ0FBVywyQkFBMkI7QUFBQSxNQUN4RTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
