<template>
  <PageShell>
    <PageHeader
      eyebrow="TP-17"
      title="二维码管理"
      description="这里将承接微信和支付宝固定金额二维码的新增、查看与删除能力。"
    />

    <TableShell>
      <template #toolbar>
        <div class="table-toolbar">
          <strong>固定金额二维码列表</strong>
          <span>占位：后续接入筛选、新增与删除操作</span>
        </div>
      </template>

      <EmptyState
        badge="QR"
        title="二维码表格骨架已就位"
        description="后续将把真实列表、分页、支付方式筛选接入到这里。"
      />
    </TableShell>
  </PageShell>
</template>

<script setup>
import EmptyState from '../../components/admin/EmptyState.vue';
import PageHeader from '../../components/admin/PageHeader.vue';
import PageShell from '../../components/admin/PageShell.vue';
import TableShell from '../../components/admin/TableShell.vue';

/**
 * 二维码管理占位页
 * 当前用于承载后续固定金额二维码列表与操作区框架。
 */
</script>
