<!--
  工程基础设施首页
  用于展示当前工作区骨架已初始化完成
-->

<template>
  <main class="home-page">
    <section class="home-page__content">
      <h1 class="home-page__title">Node-Vmq 工程骨架已初始化</h1>
      <p class="home-page__desc">
        当前阶段已完成 TP-01 工程基础设施搭建，后续将按文档逐步实现业务模块。
      </p>
      <ul class="home-page__list">
        <li>后端：Node.js + Express 骨架已建立</li>
        <li>前端：Vue 3 + Vite 骨架已建立</li>
        <li>共享包：packages/shared 已建立</li>
        <li>数据库目录：migrations / seeds 已建立</li>
      </ul>
    </section>
  </main>
</template>

<script setup>
/**
 * 首页当前不需要复杂脚本逻辑
 * 这里保持最小实现，便于后续迭代
 */
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #f5f7fb;
  color: #111827;
}

.home-page__content {
  width: min(720px, 100%);
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
}

.home-page__title {
  margin: 0 0 12px;
  font-size: 28px;
  line-height: 1.2;
}

.home-page__desc {
  margin: 0 0 20px;
  color: #4b5563;
  line-height: 1.7;
}

.home-page__list {
  margin: 0;
  padding-left: 20px;
  line-height: 1.8;
  color: #1f2937;
}
</style>
