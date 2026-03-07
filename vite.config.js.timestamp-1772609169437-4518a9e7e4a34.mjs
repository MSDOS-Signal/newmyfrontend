// vite.config.js
import { defineConfig } from "file:///E:/xmnew/XinhaoChat/frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///E:/xmnew/XinhaoChat/frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import electron from "file:///E:/xmnew/XinhaoChat/frontend/node_modules/vite-plugin-electron/dist/index.mjs";
import renderer from "file:///E:/xmnew/XinhaoChat/frontend/node_modules/vite-plugin-electron-renderer/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "E:\\xmnew\\XinhaoChat\\frontend";
var vite_config_default = defineConfig({
  base: "./",
  // Ensure relative paths for Electron
  plugins: [
    vue(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: "electron/main.js"
      },
      {
        entry: "electron/preload.js",
        onstart(options) {
          options.reload();
        }
      }
    ]),
    renderer({
      nodeIntegration: false,
      optimizeDeps: {
        include: ["sockjs-client", "stompjs"]
      }
    })
  ],
  resolve: {
    alias: {
      // Use our custom shim for sockjs-client compatibility
      crypto: path.resolve(__vite_injected_original_dirname, "src/shims/crypto.js"),
      // Polyfill events for browser/renderer (sockjs-client needs it)
      events: "events"
    }
  },
  optimizeDeps: {
    include: ["sockjs-client", "stompjs"]
  },
  server: {
    host: "0.0.0.0",
    // Listen on all network interfaces
    port: 5173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFx4bW5ld1xcXFxYaW5oYW9DaGF0XFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFx4bW5ld1xcXFxYaW5oYW9DaGF0XFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi94bW5ldy9YaW5oYW9DaGF0L2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IGVsZWN0cm9uIGZyb20gJ3ZpdGUtcGx1Z2luLWVsZWN0cm9uJ1xuaW1wb3J0IHJlbmRlcmVyIGZyb20gJ3ZpdGUtcGx1Z2luLWVsZWN0cm9uLXJlbmRlcmVyJ1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCcgLy8gQWRkIHBhdGggaW1wb3J0XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnLi8nLCAvLyBFbnN1cmUgcmVsYXRpdmUgcGF0aHMgZm9yIEVsZWN0cm9uXG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoKSxcbiAgICBlbGVjdHJvbihbXG4gICAgICB7XG4gICAgICAgIC8vIE1haW4tUHJvY2VzcyBlbnRyeSBmaWxlIG9mIHRoZSBFbGVjdHJvbiBBcHAuXG4gICAgICAgIGVudHJ5OiAnZWxlY3Ryb24vbWFpbi5qcycsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBlbnRyeTogJ2VsZWN0cm9uL3ByZWxvYWQuanMnLFxuICAgICAgICBvbnN0YXJ0KG9wdGlvbnMpIHtcbiAgICAgICAgICAvLyBOb3RpZnkgdGhlIFJlbmRlcmVyLVByb2Nlc3MgdG8gcmVsb2FkIHRoZSBwYWdlIHdoZW4gdGhlIFByZWxvYWQtU2NyaXB0cyBidWlsZCBpcyBjb21wbGV0ZSwgXG4gICAgICAgICAgLy8gaW5zdGVhZCBvZiByZXN0YXJ0aW5nIHRoZSBlbnRpcmUgRWxlY3Ryb24gQXBwLlxuICAgICAgICAgIG9wdGlvbnMucmVsb2FkKClcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSksXG4gICAgcmVuZGVyZXIoe1xuICAgICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxuICAgICAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgICAgICAgIGluY2x1ZGU6IFsnc29ja2pzLWNsaWVudCcsICdzdG9tcGpzJ11cbiAgICAgICAgfVxuICAgIH0pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICAgLy8gVXNlIG91ciBjdXN0b20gc2hpbSBmb3Igc29ja2pzLWNsaWVudCBjb21wYXRpYmlsaXR5XG4gICAgICAgIGNyeXB0bzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9zaGltcy9jcnlwdG8uanMnKSxcbiAgICAgICAgLy8gUG9seWZpbGwgZXZlbnRzIGZvciBicm93c2VyL3JlbmRlcmVyIChzb2NranMtY2xpZW50IG5lZWRzIGl0KVxuICAgICAgICBldmVudHM6ICdldmVudHMnLFxuICAgIH1cbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydzb2NranMtY2xpZW50JywgJ3N0b21wanMnXVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiAnMC4wLjAuMCcsIC8vIExpc3RlbiBvbiBhbGwgbmV0d29yayBpbnRlcmZhY2VzXG4gICAgcG9ydDogNTE3M1xuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4USxTQUFTLG9CQUFvQjtBQUMzUyxPQUFPLFNBQVM7QUFDaEIsT0FBTyxjQUFjO0FBQ3JCLE9BQU8sY0FBYztBQUNyQixPQUFPLFVBQVU7QUFKakIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixTQUFTO0FBQUEsTUFDUDtBQUFBO0FBQUEsUUFFRSxPQUFPO0FBQUEsTUFDVDtBQUFBLE1BQ0E7QUFBQSxRQUNFLE9BQU87QUFBQSxRQUNQLFFBQVEsU0FBUztBQUdmLGtCQUFRLE9BQU87QUFBQSxRQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFNBQVM7QUFBQSxNQUNMLGlCQUFpQjtBQUFBLE1BQ2pCLGNBQWM7QUFBQSxRQUNWLFNBQVMsQ0FBQyxpQkFBaUIsU0FBUztBQUFBLE1BQ3hDO0FBQUEsSUFDSixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBO0FBQUEsTUFFSCxRQUFRLEtBQUssUUFBUSxrQ0FBVyxxQkFBcUI7QUFBQTtBQUFBLE1BRXJELFFBQVE7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLGlCQUFpQixTQUFTO0FBQUEsRUFDdEM7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
