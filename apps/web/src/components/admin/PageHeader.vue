<template>
  <section class="page-header">
    <div>
      <span class="page-header__eyebrow">{{ eyebrow }}</span>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup>
/**
 * 页面头部组件
 * 统一承载页面标题、说明和扩展操作区。
 */
defineProps({
  eyebrow: {
    type: String,
    default: 'TP-13'
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
