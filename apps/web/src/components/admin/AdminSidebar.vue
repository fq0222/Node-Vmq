<template>
  <aside class="admin-sidebar">
    <div class="admin-sidebar__brand">
      <div class="admin-sidebar__logo">VMQ</div>
      <div v-if="!appStore.sidebarCollapsed" class="admin-sidebar__brand-copy">
        <strong>Node-Vmq</strong>
        <span>Admin Framework</span>
      </div>
    </div>

    <nav class="admin-sidebar__nav" aria-label="后台导航">
      <section
        v-for="group in ADMIN_NAVIGATION"
        :key="group.title"
        class="admin-sidebar__group"
      >
        <p v-if="!appStore.sidebarCollapsed" class="admin-sidebar__group-title">
          {{ group.title }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.name"
          :to="item.to"
          class="admin-sidebar__link"
          :class="{ 'admin-sidebar__link--active': route.path === item.to }"
        >
          <span class="admin-sidebar__badge">{{ item.badge }}</span>
          <span v-if="!appStore.sidebarCollapsed" class="admin-sidebar__label-wrap">
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </RouterLink>
      </section>
    </nav>
  </aside>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router';
import { ADMIN_NAVIGATION } from '../../config/admin-navigation.js';
import { useAppStore } from '../../stores/app.js';

/**
 * 后台左侧导航
 * 基于统一配置渲染后台入口，并根据当前路由高亮对应菜单。
 */
const route = useRoute();
const appStore = useAppStore();
</script>
