<template>
  <PageShell>
    <PageHeader
      eyebrow="TP-19"
      title="API 文档"
      description="这里将承接旧版 api.html 的新后台展示形式，并保留接口兼容说明。"
    />

    <PanelCard title="文档结构占位" description="后续文档页会按接口场景拆分展示。">
      <div class="roadmap-grid">
        <span>创建订单</span>
        <span>查询订单</span>
        <span>关闭订单</span>
        <span>状态接口</span>
        <span>异步回调规范</span>
        <span>签名与兼容说明</span>
      </div>
    </PanelCard>

    <EmptyState
      badge="DOCS"
      title="文档页框架已就位"
      description="当前先把文档承载容器建好，后续再接真实接口文档内容。"
    />
  </PageShell>
</template>

<script setup>
import EmptyState from '../../components/admin/EmptyState.vue';
import PageHeader from '../../components/admin/PageHeader.vue';
import PageShell from '../../components/admin/PageShell.vue';
import PanelCard from '../../components/admin/PanelCard.vue';

/**
 * API 文档占位页
 * 当前先建立新后台的文档容器和内容层次。
 */
</script>
