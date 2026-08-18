import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 小红书「小工具」专用构建配置（不影响常规 vite.config.ts）。
 * 容器要求：经典脚本（无 ES module）、纯离线相对路径、无 sourcemap。
 * 产物输出到 minitool-dist/，由 minitool/build.mjs 继续加工打包。
 */
export default defineConfig({
  plugins: [react()],
  base: './',
  // 小红书容器用自带图标，根目录的 public/（含 favicon/apple-touch-icon 等）
  // 不应进入小工具产物——会触发合规扫描的"禁用文件类型"拦截
  publicDir: false,
  build: {
    outDir: 'minitool-dist',
    emptyOutDir: true,
    sourcemap: false,
    // 容器禁止 type="module"：输出为单个经典 IIFE 脚本
    rollupOptions: {
      output: {
        format: 'iife',
        name: 'WestLakeMiniTool',
        inlineDynamicImports: true
      }
    }
  }
});
