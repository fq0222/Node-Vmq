/**
 * 前端应用启动入口文件
 * 负责初始化 Vue、Pinia、路由和后台登录态。
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth.js';
import './styles/global.css';

/**
 * 启动前端应用
 * 这里保留清晰的初始化顺序，便于后续扩展真实登录与全局服务。
 */
function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  console.info('[TP-13][main] 正在初始化前端后台框架');

  // 注册状态管理
  app.use(pinia);

  // 初始化登录态，确保路由守卫生效前拿到本地状态
  const authStore = useAuthStore(pinia);
  authStore.bootstrap();

  // 注册路由
  app.use(router);

  // 挂载应用
  app.mount('#app');

  console.info('[TP-13][main] 前端后台框架启动完成');
}

bootstrap();
