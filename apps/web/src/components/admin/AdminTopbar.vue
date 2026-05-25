<template>
  <header class="admin-topbar">
    <div class="admin-topbar__left">
      <button
        class="admin-topbar__toggle"
        type="button"
        :aria-label="appStore.sidebarCollapsed ? '展开导航' : '折叠导航'"
        :title="appStore.sidebarCollapsed ? '展开导航' : '折叠导航'"
        @click="appStore.toggleSidebar()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="2.2" rx="1.1"></rect>
          <rect x="3" y="10.9" width="18" height="2.2" rx="1.1"></rect>
          <rect x="3" y="16.8" width="18" height="2.2" rx="1.1"></rect>
          <path :d="appStore.sidebarCollapsed ? 'M10 7l4 5-4 5' : 'M14 7l-4 5 4 5'"></path>
        </svg>
      </button>
      <div class="admin-topbar__heading">
        <h1>{{ appStore.pageMeta.title }}</h1>
      </div>
    </div>

    <div class="admin-topbar__right">
      <div class="admin-topbar__status">
        <span class="admin-topbar__status-dot"></span>
        <span>{{ authStore.loggedIn ? '已登录' : '未登录' }}</span>
      </div>
      <button
        v-if="authStore.loggedIn"
        class="admin-topbar__action"
        type="button"
        :disabled="authStore.loading"
        @click="handleLogout"
      >
        {{ authStore.loading ? '退出中...' : '退出登录' }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAppStore } from '../../stores/app.js';
import { useAuthStore } from '../../stores/auth.js';

/**
 * 后台顶部栏组件
 * 负责展示页面标题、登录状态和真实退出登录入口。
 */
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

/**
 * 执行真实退出登录
 * 成功或失败都回收前端状态，确保后台页面重新受保护。
 */
async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>
