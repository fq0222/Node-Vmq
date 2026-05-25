<template>
  <section class="table-shell">
    <div class="table-shell__toolbar">
      <slot name="toolbar" />
    </div>
    <div class="table-shell__content">
      <slot />
    </div>
  </section>
</template>

<script setup>
/**
 * 表格占位容器
 * 便于后续订单页、二维码页逐步接入真实表格能力。
 */
</script>
