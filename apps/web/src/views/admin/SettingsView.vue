<template>
  <PageShell>
    <PageHeader
      eyebrow="TP-15"
      title="系统设置"
      description="这里将承接系统参数配置、二维码解析输入和全局通知地址等核心设置。"
    />

    <FormSection title="预留表单区" description="后续会接入真实设置项与保存动作。">
      <div class="placeholder-grid">
        <div class="placeholder-field">
          <label>商户 Key</label>
          <div>占位：待接真实表单</div>
        </div>
        <div class="placeholder-field">
          <label>回调地址</label>
          <div>占位：待接真实表单</div>
        </div>
      </div>
    </FormSection>

    <PanelCard title="后续接入清单" description="系统设置页下一阶段会重点补齐下面几块。">
      <ul class="feature-list">
        <li>基础配置表单</li>
        <li>二维码上传与解析</li>
        <li>二维码预览</li>
        <li>设置保存与回显</li>
      </ul>
    </PanelCard>
  </PageShell>
</template>

<script setup>
import FormSection from '../../components/admin/FormSection.vue';
import PageHeader from '../../components/admin/PageHeader.vue';
import PageShell from '../../components/admin/PageShell.vue';
import PanelCard from '../../components/admin/PanelCard.vue';

/**
 * 系统设置占位页
 * 先完成表单结构与视觉骨架，后续再接入真实字段。
 */
</script>
