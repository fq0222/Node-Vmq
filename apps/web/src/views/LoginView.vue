<template>
  <main class="login-view">
    <section class="login-view__panel">
      <span class="login-view__eyebrow">TP-13</span>
      <h1>后台登录占位页</h1>
      <p>
        当前阶段只演示后台框架与鉴权拦截，不接真实登录接口。
        你可以点击下面按钮写入模拟登录态，然后进入后台。
      </p>

      <div class="login-view__actions">
        <button type="button" class="login-view__primary" @click="handleMockLogin">
          写入模拟登录态
        </button>
        <button type="button" class="login-view__secondary" @click="handleClear">
          清理本地登录态
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

/**
 * 写入模拟登录态并跳转后台
 * 关键处保留日志，方便确认路由守卫生效路径。
 */
function handleMockLogin() {
  authStore.mockLogin();
  console.info('[TP-13][login] 模拟登录成功，准备进入 Dashboard');
  router.push('/dashboard');
}

/**
 * 清理本地登录态
 * 便于重复验证后台拦截行为。
 */
function handleClear() {
  authStore.logout();
}
</script>
