<template>
  <section class="form-section">
    <header class="form-section__header">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </header>
    <div class="form-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
/**
 * 表单分组组件
 * 为后续系统设置类页面提供统一的分组容器。
 */
defineProps({
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
