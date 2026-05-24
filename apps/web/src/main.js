/**
 * 前端应用入口文件
 * 负责挂载 Vue 应用、路由与全局样式
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/global.css';

/**
 * 启动前端应用
 * 这里保留清晰的挂载顺序，便于后续逐步扩展
 */
function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  // 注册状态管理
  app.use(pinia);

  // 注册路由
  app.use(router);

  // 挂载应用
  app.mount('#app');
}

bootstrap();
