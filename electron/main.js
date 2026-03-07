import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Remove this if you don't use a preload script
// const path = require('node:path')

// 在创建窗口前设置命令行参数
app.commandLine.appendSwitch('auto-detect', 'true')
app.commandLine.appendSwitch('enable-features', 'WebRTCPipeWireCapturer')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // Enable Node integration for require() polyfills
      contextIsolation: false, // Disable isolation to allow shim access (security tradeoff for compatibility)
    },
    // Hide menu bar by default
    autoHideMenuBar: true,
  })

  // Development
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    // win.webContents.openDevTools()
  } else {
    // Production
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
  
  // 处理权限请求
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'microphone') {
      // 自动允许麦克风权限
      callback(true)
    } else {
      callback(false)
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
