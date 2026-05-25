<template>
  <div class="empty-state">
    <span class="empty-state__badge">{{ badge }}</span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <slot />
  </div>
</template>

<script setup>
/**
 * 空状态组件
 * 用于明确提示当前页面尚未接入真实业务数据。
 */
defineProps({
  badge: {
    type: String,
    default: '占位'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});
</script>
