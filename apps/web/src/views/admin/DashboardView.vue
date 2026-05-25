<template>
  <PageShell>
    <PageHeader
      eyebrow="TP-13"
      title="后台框架总览"
      description="当前页面用于承接后台框架状态、后续任务入口和整体视觉基线。"
    />

    <section class="stats-grid">
      <InfoCard label="路由状态" value="已接管" hint="公开区与受保护区已完成拆分。" />
      <InfoCard label="鉴权方式" value="占位登录态" hint="为 TP-14 真实登录预留接口。" />
      <InfoCard label="视觉风格" value="Modern SaaS" hint="已采用卡片式后台布局基线。" />
    </section>

    <PanelCard title="本阶段完成内容" description="TP-13 聚焦后台框架，不承接真实业务逻辑。">
      <ul class="feature-list">
        <li>后台布局：侧边栏、顶部栏、内容区</li>
        <li>路由守卫：未登录拦截与登录页回跳</li>
        <li>状态层：登录态与壳子状态管理</li>
        <li>基础组件：卡片、空状态、表格壳、表单分组</li>
      </ul>
    </PanelCard>

    <PanelCard title="后续模块挂载顺序" description="这些页面都已经具备可挂载入口。">
      <div class="roadmap-grid">
        <span>TP-14 登录与鉴权</span>
        <span>TP-15 系统设置</span>
        <span>TP-16 监控端</span>
        <span>TP-17 二维码管理</span>
        <span>TP-18 订单管理</span>
        <span>TP-19 API 文档</span>
      </div>
    </PanelCard>
  </PageShell>
</template>

<script setup>
import InfoCard from '../../components/admin/InfoCard.vue';
import PageHeader from '../../components/admin/PageHeader.vue';
import PageShell from '../../components/admin/PageShell.vue';
import PanelCard from '../../components/admin/PanelCard.vue';

/**
 * Dashboard 占位页
 * 用于展示 TP-13 已完成的后台框架能力与后续挂载路线。
 */
</script>
