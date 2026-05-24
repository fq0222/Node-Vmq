/**
 * Vite 配置文件
 * 用于定义前端开发服务的基础行为
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
