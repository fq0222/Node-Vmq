<template>
  <section class="panel-card">
    <header v-if="title || description" class="panel-card__header">
      <div>
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="panel-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="panel-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
/**
 * 面板卡片组件
 * 统一承载列表、说明块和后续功能占位内容。
 */
defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
});
</script>
