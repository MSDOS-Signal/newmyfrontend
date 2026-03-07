import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.xinhao.chat',
  appName: 'XinhaoChat',
  webDir: 'dist',
  android: {
    // 允许混合内容（HTTP 资源）- 解决 Android 9.0+ HTTP 限制
    allowMixedContent: true,
    // 捕获硬件返回键
    captureInput: true,
    // 启用 WebView 调试
    webContentsDebuggingEnabled: true,
    // 启用硬件加速
    hardwareAccelerated: true,
  },
  server: {
    // 使用 https 协议加载本地文件
    androidScheme: 'https',
    // 允许访问外部服务器
    allowNavigation: ['47.98.181.100', 'localhost', '127.0.0.1'],
  },
  // 允许加载外部资源
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
