<template>
  <header class="admin-topbar">
    <div class="admin-topbar__left">
      <button class="admin-topbar__toggle" type="button" @click="appStore.toggleSidebar()">
        {{ appStore.sidebarCollapsed ? '展开导航' : '折叠导航' }}
      </button>
      <div class="admin-topbar__heading">
        <span class="admin-topbar__eyebrow">{{ appStore.pageMeta.eyebrow }}</span>
        <h1>{{ appStore.pageMeta.title }}</h1>
        <p>{{ appStore.pageMeta.description }}</p>
      </div>
    </div>

    <div class="admin-topbar__right">
      <div class="admin-topbar__status">
        <span class="admin-topbar__status-dot"></span>
        <span>{{ authStore.loggedIn ? '模拟已登录' : '未登录' }}</span>
      </div>
      <button
        v-if="authStore.loggedIn"
        class="admin-topbar__action"
        type="button"
        @click="handleLogout"
      >
        清理登录态
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAppStore } from '../../stores/app.js';
import { useAuthStore } from '../../stores/auth.js';

const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

/**
 * 退出当前模拟登录态
 * 这里保留关键日志，便于后续对接真实退出逻辑时核对行为。
 */
function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>
