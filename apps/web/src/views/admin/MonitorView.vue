<template>
  <PageShell>
    <PageHeader
      eyebrow="TP-16"
      title="监控端"
      description="这里将承接监控端在线状态、最后心跳时间和绑定配置能力。"
    />

    <section class="stats-grid">
      <InfoCard label="在线状态" value="待接接口" hint="后续接入 /getState 与监控状态接口。" />
      <InfoCard label="绑定串" value="待生成" hint="后续将支持绑定串和绑定二维码。" />
      <InfoCard label="APK 入口" value="待接入" hint="后续在本页提供下载与说明。" />
    </section>

    <EmptyState
      badge="监控端"
      title="监控页骨架已就位"
      description="当前先完成壳子与信息层级，后续接入真实状态看板。"
    />
  </PageShell>
</template>

<script setup>
import EmptyState from '../../components/admin/EmptyState.vue';
import InfoCard from '../../components/admin/InfoCard.vue';
import PageHeader from '../../components/admin/PageHeader.vue';
import PageShell from '../../components/admin/PageShell.vue';

/**
 * 监控端占位页
 * 当前只展示未来将接入的监控状态与绑定能力结构。
 */
</script>
