<template>
  <div class="admin-layout" :class="{ 'admin-layout--collapsed': appStore.sidebarCollapsed }">
    <AdminSidebar />
    <div class="admin-layout__main">
      <AdminTopbar />
      <main class="admin-layout__content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import AdminSidebar from '../components/admin/AdminSidebar.vue';
import AdminTopbar from '../components/admin/AdminTopbar.vue';
import { useAppStore } from '../stores/app.js';

const route = useRoute();
const appStore = useAppStore();

/**
 * 同步当前页面元信息
 * 页面标题、说明、阶段标签统一由路由元信息驱动。
 */
watch(
  () => route.meta,
  (meta) => {
    appStore.setPageMeta(meta);
  },
  {
    immediate: true
  }
);
</script>
