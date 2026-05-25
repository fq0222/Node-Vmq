<template>
  <PageShell>
    <PageHeader
      eyebrow="TP-18"
      title="订单管理"
      description="这里将承接订单列表、筛选、详情、补单和删除等后台操作。"
    />

    <TableShell>
      <template #toolbar>
        <div class="table-toolbar">
          <strong>订单列表</strong>
          <span>占位：后续接入筛选器、分页和批量操作</span>
        </div>
      </template>

      <PanelCard title="待接入能力" description="订单页后续会优先补下面这些功能。">
        <ul class="feature-list">
          <li>按支付方式与状态筛选</li>
          <li>查看订单详情与补单操作</li>
          <li>删除过期订单与历史订单</li>
          <li>统一表格操作栏</li>
        </ul>
      </PanelCard>
    </TableShell>
  </PageShell>
</template>

<script setup>
import PageHeader from '../../components/admin/PageHeader.vue';
import PageShell from '../../components/admin/PageShell.vue';
import PanelCard from '../../components/admin/PanelCard.vue';
import TableShell from '../../components/admin/TableShell.vue';

/**
 * 订单管理占位页
 * 当前优先把表格容器和后续能力清单挂上来。
 */
</script>
