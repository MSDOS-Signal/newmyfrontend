import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path' // Add path import

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = process.env.ELECTRON_BUILD === 'true' || mode === 'electron'

  return {
    base: './', // Ensure relative paths for Electron
    plugins: [
      vue(),
      isElectron && electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'electron/main.js',
        },
        {
          entry: 'electron/preload.js',
          onstart(options) {
            // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete, 
            // instead of restarting the entire Electron App.
            options.reload()
          },
        },
      ]),
      isElectron && renderer({
          nodeIntegration: false,
          optimizeDeps: {
              include: ['sockjs-client', 'stompjs']
          }
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
          // Use our custom shim for sockjs-client compatibility
          crypto: path.resolve(__dirname, 'src/shims/crypto.js'),
          // Polyfill events for browser/renderer (sockjs-client needs it)
          events: 'events',
      }
    },
    optimizeDeps: {
      include: ['sockjs-client', 'stompjs']
    },
    server: {
      host: '0.0.0.0', // Listen on all network interfaces
      port: 5173
    }
  }
})
