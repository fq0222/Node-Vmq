<template>
  <article class="info-card">
    <span class="info-card__label">{{ label }}</span>
    <strong class="info-card__value">{{ value }}</strong>
    <p class="info-card__hint">{{ hint }}</p>
  </article>
</template>

<script setup>
/**
 * 信息卡片组件
 * 用于展示后台首页和占位页中的关键摘要信息。
 */
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  hint: {
    type: String,
    default: ''
  }
});
</script>
