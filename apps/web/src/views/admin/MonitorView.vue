<template>
  <PageShell>
    <section class="monitor-toolbar">
      <div class="monitor-toolbar__heading">
        <h2>监控状态</h2>
        <p v-if="statusError" class="monitor-inline-error">
          {{ statusError }}
        </p>
      </div>
      <button class="monitor-toolbar__button" :disabled="statusLoading" @click="handleRefresh">
        {{ statusLoading ? '刷新中...' : '刷新状态' }}
      </button>
    </section>

    <section class="stats-grid">
      <InfoCard label="当前状态" :value="viewModel.status.label" />
      <InfoCard label="最后心跳时间" :value="viewModel.lastHeartText" />
      <InfoCard label="最后收款时间" :value="viewModel.lastPayText" />
    </section>

    <PanelCard title="接入配置">
      <div v-if="bindingError" class="settings-alert settings-alert--error">
        {{ bindingError }}
      </div>

      <div class="monitor-access-grid">
        <section class="monitor-access-card">
          <header class="monitor-access-card__header">
            <h3>扫码绑定</h3>
          </header>

          <div class="monitor-qrcode">
            <img
              v-if="bindingQrcodeUrl"
              :src="bindingQrcodeUrl"
              alt="监控端绑定二维码"
            />
            <p v-else>二维码生成中</p>
          </div>

          <div class="monitor-binding-panel">
            <label class="settings-field settings-field--wide">
              <span>绑定串</span>
              <textarea :value="bindingText" rows="3" readonly></textarea>
            </label>

            <button
              class="settings-save-bar__button monitor-binding-panel__button"
              :disabled="!bindingText"
              @click="handleCopyBinding"
            >
              {{ copyMessage || '复制绑定串' }}
            </button>
          </div>
        </section>

        <section class="monitor-access-card">
          <header class="monitor-access-card__header">
            <h3>手动配置</h3>
          </header>

          <div class="monitor-config-grid">
            <div class="placeholder-field">
              <label>服务端地址</label>
              <span>{{ manualConfig.apiBaseUrl }}</span>
            </div>
            <div class="placeholder-field">
              <label>通讯密钥</label>
              <span>{{ manualConfig.key || '未配置' }}</span>
            </div>
            <div class="placeholder-field">
              <label>状态查询地址</label>
              <span>{{ manualConfig.stateUrl }}</span>
            </div>
            <div class="placeholder-field">
              <label>心跳上报地址</label>
              <span>{{ manualConfig.heartUrl }}</span>
            </div>
          </div>
        </section>
      </div>
    </PanelCard>

    <PanelCard title="应用下载">
      <div class="monitor-download">
        <a
          class="settings-save-bar__button monitor-download__link"
          :href="apkDownloadUrl"
          target="_blank"
          rel="noreferrer"
        >
          下载监控端 APK
        </a>

        <ul class="feature-list">
          <li>安装应用并完成基础授权</li>
          <li>使用扫码或手动方式完成绑定</li>
          <li>开启辅助服务后返回本页刷新状态</li>
        </ul>
      </div>
    </PanelCard>
  </PageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import InfoCard from '../../components/admin/InfoCard.vue';
import PageShell from '../../components/admin/PageShell.vue';
import PanelCard from '../../components/admin/PanelCard.vue';
import {
  buildMonitorQrcodePreviewUrl,
  buildMonitorViewModel,
  fetchMonitorSettings,
  fetchMonitorState
} from '../../services/monitor-service.js';

/**
 * 监控端页面
 * 负责展示监控状态、绑定配置、二维码入口和 APK 下载能力。
 */
const statusLoading = ref(true);
const statusError = ref('');
const bindingError = ref('');
const copyMessage = ref('');
const settings = ref({});
const state = ref({});

const viewModel = computed(() =>
  buildMonitorViewModel({
    settings: settings.value,
    state: state.value
  })
);
const bindingText = computed(() => viewModel.value.binding.encoded);
const bindingQrcodeUrl = computed(() => buildMonitorQrcodePreviewUrl(bindingText.value));
const apkDownloadUrl = computed(() => `${viewModel.value.binding.apiBaseUrl}/v.apk`);
const manualConfig = computed(() => ({
  apiBaseUrl: viewModel.value.binding.apiBaseUrl,
  key: viewModel.value.binding.key,
  stateUrl: `${viewModel.value.binding.apiBaseUrl}/getState`,
  heartUrl: `${viewModel.value.binding.apiBaseUrl}/appHeart`
}));

/**
 * 加载监控页基础数据
 * 首次进入时读取绑定配置与状态，并分别记录错误。
 */
async function loadMonitorPage() {
  statusLoading.value = true;
  statusError.value = '';
  bindingError.value = '';

  try {
    settings.value = await fetchMonitorSettings();
    console.info('[TP-16][monitor] 监控端设置读取成功');
  } catch (error) {
    bindingError.value = '监控端绑定配置读取失败，请稍后重试';
    console.error('[TP-16][monitor] 监控端设置读取失败', {
      message: error.message
    });
  }

  if (!settings.value.key) {
    bindingError.value = bindingError.value || '通讯密钥未配置，请先在系统设置中完成配置';
  }

  try {
    state.value = await fetchMonitorState();
    console.info('[TP-16][monitor] 监控端状态读取成功');
  } catch (error) {
    statusError.value = '监控端状态读取失败，请稍后重试';
    console.warn('[TP-16][monitor] 监控端状态读取失败', {
      message: error.message
    });
  } finally {
    statusLoading.value = false;
  }
}

/**
 * 手动刷新监控状态
 * 保持绑定配置不变，仅重新拉取状态。
 */
async function handleRefresh() {
  statusLoading.value = true;
  statusError.value = '';

  try {
    state.value = await fetchMonitorState();
    console.info('[TP-16][monitor] 监控端状态刷新成功');
  } catch (error) {
    statusError.value = '监控端状态读取失败，请稍后重试';
    console.warn('[TP-16][monitor] 监控端状态刷新失败', {
      message: error.message
    });
  } finally {
    statusLoading.value = false;
  }
}

/**
 * 复制绑定串
 * 成功或失败都给出明显反馈，便于手动调试。
 */
async function handleCopyBinding() {
  copyMessage.value = '';

  try {
    await navigator.clipboard.writeText(bindingText.value);
    copyMessage.value = '复制成功';
    console.info('[TP-16][monitor] 绑定串复制成功');
  } catch (error) {
    copyMessage.value = '复制失败';
    console.warn('[TP-16][monitor] 绑定串复制失败', {
      message: error.message
    });
  }
}

onMounted(async () => {
  await loadMonitorPage();
});
</script>
