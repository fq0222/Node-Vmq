# TP-16 监控端页面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个与现有后台风格一致的真实监控端页面，打通监控状态查询、绑定配置展示、二维码接入和 APK 下载入口。

**Architecture:** 前端新增一个监控服务层，负责读取系统设置、生成监控端签名请求参数并调用 `/getState`，同时把绑定串、二维码预览地址和手动配置字段整理成页面可直接消费的数据。页面层在现有后台布局内组织状态卡片、扫码绑定、手动配置与 APK 下载区域，并通过纯函数完成状态映射与时间格式化。

**Tech Stack:** Vue 3、Vue Router、原生 fetch、现有后台样式体系、Node 内置 test、项目共享签名规则。

---

## File Structure

- Create: `apps/web/src/services/monitor-service.js`
  负责封装监控状态读取、绑定串生成、二维码预览地址生成和 APK 下载地址整理。
- Create: `apps/web/src/utils/monitor-format.js`
  负责状态值映射、时间格式化、绑定串拼装等纯函数。
- Create: `apps/web/tests/monitor-format.test.js`
  覆盖状态映射、时间格式化、绑定串生成行为。
- Create: `apps/web/tests/monitor-service.test.js`
  覆盖监控状态请求、系统设置整合和二维码地址生成行为。
- Modify: `apps/web/src/views/admin/MonitorView.vue`
  将占位页替换为真实监控端工作台。
- Modify: `apps/web/src/services/api-client.js`
  如有必要，补充适合监控状态接口的非 JSON body GET 调用复用。
- Modify: `apps/web/src/styles/global.css`
  新增监控页状态、绑定区、下载区样式。
- Modify: `apps/web/src/router/routes.js`
  收敛监控页顶部标题和副文案，避免保留占位描述。
- Modify: `package.json`
  将新的监控页相关测试与校验文件加入 `test:web` 和 `check:web`。

### Task 1: 监控格式化工具

**Files:**
- Create: `apps/web/src/utils/monitor-format.js`
- Test: `apps/web/tests/monitor-format.test.js`

- [ ] **Step 1: 先写失败测试，定义状态映射和时间格式化行为**

```js
/**
 * 监控页格式化工具测试文件
 * 负责验证状态映射、时间格式化和绑定串生成行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMonitorStatus,
  formatMonitorTimestamp,
  buildMonitorBindingPayload
} from '../src/utils/monitor-format.js';

test('监控状态应映射为可读文案和风格类型', () => {
  assert.deepEqual(formatMonitorStatus('1'), {
    label: '在线',
    tone: 'success'
  });
  assert.deepEqual(formatMonitorStatus('0'), {
    label: '离线',
    tone: 'danger'
  });
  assert.deepEqual(formatMonitorStatus('-1'), {
    label: '未绑定',
    tone: 'muted'
  });
});

test('非法状态值应回退为未知状态', () => {
  assert.deepEqual(formatMonitorStatus('999'), {
    label: '未知状态',
    tone: 'muted'
  });
});

test('13 位时间戳应格式化为本地时间字符串', () => {
  const result = formatMonitorTimestamp('1779431415000');

  assert.equal(typeof result, 'string');
  assert.equal(result.includes('暂无记录'), false);
});

test('空时间戳应显示暂无记录', () => {
  assert.equal(formatMonitorTimestamp('0'), '暂无记录');
  assert.equal(formatMonitorTimestamp(''), '暂无记录');
});

test('绑定串应包含服务地址与通讯密钥', () => {
  const result = buildMonitorBindingPayload({
    apiBaseUrl: 'http://localhost:3000',
    key: 'admin-key'
  });

  assert.equal(result.apiBaseUrl, 'http://localhost:3000');
  assert.equal(result.key, 'admin-key');
  assert.equal(typeof result.encoded, 'string');
  assert.equal(result.encoded.includes('admin-key'), true);
});
```

- [ ] **Step 2: 运行测试，确认它们先失败**

Run: `node --test apps/web/tests/monitor-format.test.js`

Expected: FAIL，提示 `../src/utils/monitor-format.js` 不存在或导出缺失。

- [ ] **Step 3: 编写最小实现让测试转绿**

```js
/**
 * 监控页格式化工具文件
 * 负责状态映射、时间格式化和绑定串生成等纯函数逻辑。
 */

/**
 * 映射监控状态值
 * @param {string | number} value - 后端返回的状态值
 * @returns {{label: string, tone: string}} 可读状态信息
 */
export function formatMonitorStatus(value) {
  const normalized = String(value ?? '');

  if (normalized === '1') {
    return {
      label: '在线',
      tone: 'success'
    };
  }

  if (normalized === '0') {
    return {
      label: '离线',
      tone: 'danger'
    };
  }

  if (normalized === '-1') {
    return {
      label: '未绑定',
      tone: 'muted'
    };
  }

  return {
    label: '未知状态',
    tone: 'muted'
  };
}

/**
 * 格式化监控时间戳
 * @param {string | number} value - 13 位毫秒时间戳
 * @returns {string} 可读时间或暂无记录
 */
export function formatMonitorTimestamp(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized || normalized === '0' || !/^\d{13}$/.test(normalized)) {
    return '暂无记录';
  }

  const date = new Date(Number(normalized));

  if (Number.isNaN(date.getTime())) {
    return '暂无记录';
  }

  return date.toLocaleString('zh-CN', {
    hour12: false
  });
}

/**
 * 生成监控端绑定配置
 * @param {{apiBaseUrl: string, key: string}} input - 前端可用配置
 * @returns {{apiBaseUrl: string, key: string, encoded: string}} 绑定串结果
 */
export function buildMonitorBindingPayload(input) {
  const payload = {
    apiBaseUrl: String(input.apiBaseUrl || '').trim(),
    key: String(input.key || '').trim()
  };

  return {
    ...payload,
    encoded: JSON.stringify(payload)
  };
}
```

- [ ] **Step 4: 再跑测试，确认最小实现通过**

Run: `node --test apps/web/tests/monitor-format.test.js`

Expected: PASS，5 个测试全部通过。

- [ ] **Step 5: 本任务完成后暂不提交，继续下一个任务**

原因：当前功能跨多个文件才形成可运行页面，先累积到完整监控页后再由用户决定提交。

### Task 2: 监控服务层

**Files:**
- Create: `apps/web/src/services/monitor-service.js`
- Modify: `apps/web/src/services/api-client.js`
- Test: `apps/web/tests/monitor-service.test.js`

- [ ] **Step 1: 先写失败测试，定义监控状态请求与配置整合行为**

```js
/**
 * 监控页服务测试文件
 * 负责验证状态请求、配置读取和二维码地址生成行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchMonitorState,
  buildMonitorViewModel,
  buildMonitorQrcodePreviewUrl
} from '../src/services/monitor-service.js';

test('监控状态请求应先读取系统设置并调用 /getState', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });

    if (path === '/admin/getSettings') {
      return {
        code: 1,
        msg: '成功',
        data: {
          key: 'admin-key'
        }
      };
    }

    if (path.startsWith('/getState')) {
      return {
        code: 1,
        msg: '成功',
        data: {
          state: '1',
          lastheart: '1779431415000',
          lastpay: '1779431420000'
        }
      };
    }

    throw new Error(`unexpected path: ${path}`);
  };

  const result = await fetchMonitorState(request);

  assert.equal(calls[0].path, '/admin/getSettings');
  assert.equal(calls[1].path.startsWith('/getState?t='), true);
  assert.equal(calls[1].path.includes('&sign='), true);
  assert.equal(result.state, '1');
});

test('监控页面视图模型应合并状态与绑定配置', () => {
  const result = buildMonitorViewModel({
    state: {
      state: '0',
      lastheart: '0',
      lastpay: '1779431420000'
    },
    settings: {
      key: 'admin-key'
    },
    apiBaseUrl: 'http://localhost:3000'
  });

  assert.equal(result.status.label, '离线');
  assert.equal(result.binding.key, 'admin-key');
  assert.equal(result.lastHeartText, '暂无记录');
});

test('二维码预览地址应拼接 enQrcode 接口', () => {
  const result = buildMonitorQrcodePreviewUrl('{"key":"admin-key"}');

  assert.equal(
    result,
    'http://localhost:3000/enQrcode?url=%7B%22key%22%3A%22admin-key%22%7D'
  );
});
```

- [ ] **Step 2: 运行测试，确认先失败**

Run: `node --test apps/web/tests/monitor-service.test.js`

Expected: FAIL，提示服务文件不存在或导出缺失。

- [ ] **Step 3: 编写最小服务实现**

```js
/**
 * 监控页服务文件
 * 负责读取监控状态、整合系统设置并生成页面所需视图模型。
 */
import { signAppHeart } from '../../../../packages/shared/src/index.js';
import { requestJson } from './api-client.js';
import {
  buildMonitorBindingPayload,
  formatMonitorStatus,
  formatMonitorTimestamp
} from '../utils/monitor-format.js';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:3000';

/**
 * 读取系统设置
 * @param {(path: string, options?: Record<string, unknown>) => Promise<any>} request - 请求实现
 * @returns {Promise<Record<string, string>>} 设置结果
 */
export async function fetchMonitorSettings(request = requestJson) {
  const result = await request('/admin/getSettings', {
    method: 'GET'
  });

  return result?.data || {};
}

/**
 * 读取监控状态
 * @param {(path: string, options?: Record<string, unknown>) => Promise<any>} request - 请求实现
 * @returns {Promise<Record<string, string>>} 监控状态
 */
export async function fetchMonitorState(request = requestJson) {
  const settings = await fetchMonitorSettings(request);
  const timestamp = String(Date.now());
  const sign = signAppHeart({
    timestamp,
    key: String(settings.key || '')
  });

  const result = await request(`/getState?t=${encodeURIComponent(timestamp)}&sign=${encodeURIComponent(sign)}`, {
    method: 'GET'
  });

  return result?.data || {};
}

/**
 * 构建监控页视图模型
 * @param {{
 *   state: Record<string, string>,
 *   settings: Record<string, string>,
 *   apiBaseUrl?: string
 * }} input - 页面数据输入
 * @returns {Record<string, unknown>} 页面展示模型
 */
export function buildMonitorViewModel(input) {
  const settings = input.settings || {};
  const state = input.state || {};
  const binding = buildMonitorBindingPayload({
    apiBaseUrl: input.apiBaseUrl || API_BASE_URL,
    key: String(settings.key || '')
  });

  return {
    status: formatMonitorStatus(state.state),
    lastHeartText: formatMonitorTimestamp(state.lastheart),
    lastPayText: formatMonitorTimestamp(state.lastpay),
    binding
  };
}

/**
 * 构建监控端二维码预览地址
 * @param {string} text - 二维码内容
 * @returns {string} 二维码图片地址
 */
export function buildMonitorQrcodePreviewUrl(text) {
  if (!text) {
    return '';
  }

  return `${API_BASE_URL}/enQrcode?url=${encodeURIComponent(text)}`;
}
```

- [ ] **Step 4: 运行服务测试并修正必要导入**

Run: `node --test apps/web/tests/monitor-service.test.js`

Expected: PASS，3 个测试全部通过。

- [ ] **Step 5: 将新文件加入校验脚本计划**

需要在后续任务修改 `package.json`，把 `apps/web/src/utils/monitor-format.js`、`apps/web/src/services/monitor-service.js`、相关测试文件加入 `check:web` 和 `test:web`。

### Task 3: 监控端页面实现

**Files:**
- Modify: `apps/web/src/views/admin/MonitorView.vue`
- Modify: `apps/web/src/router/routes.js`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: 先写页面所需的展示结构草案并替换占位内容**

```vue
<template>
  <PageShell>
    <section class="monitor-toolbar">
      <div class="monitor-toolbar__heading">
        <h2>监控状态</h2>
        <p v-if="statusError" class="monitor-inline-error">{{ statusError }}</p>
      </div>
      <button class="monitor-toolbar__button" :disabled="statusLoading" @click="handleRefresh">
        {{ statusLoading ? '刷新中...' : '刷新状态' }}
      </button>
    </section>

    <section class="stats-grid">
      <InfoCard :label="'当前状态'" :value="viewModel.status.label" :hint="statusHint" />
      <InfoCard label="最后心跳时间" :value="viewModel.lastHeartText" hint="最近一次监控端心跳上报时间" />
      <InfoCard label="最后收款时间" :value="viewModel.lastPayText" hint="最近一次监控到支付推送时间" />
    </section>

    <PanelCard title="扫码绑定">
      <div class="monitor-binding-grid">
        <div class="monitor-qrcode">
          <img v-if="bindingQrcodeUrl" :src="bindingQrcodeUrl" alt="监控端绑定二维码" />
          <p v-else>二维码生成中</p>
        </div>
        <div class="monitor-binding-panel">
          <label class="settings-field settings-field--wide">
            <span>绑定串</span>
            <textarea :value="bindingText" rows="8" readonly></textarea>
          </label>
          <button class="settings-save-bar__button" @click="handleCopyBinding">
            {{ copyMessage || '复制绑定串' }}
          </button>
        </div>
      </div>
    </PanelCard>

    <PanelCard title="手动配置">
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
    </PanelCard>

    <PanelCard title="应用下载">
      <div class="monitor-download">
        <a class="settings-save-bar__button monitor-download__link" :href="apkDownloadUrl" target="_blank" rel="noreferrer">
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
```

- [ ] **Step 2: 运行现有前端校验，确认页面尚未完整通过**

Run: `npm.cmd run check:web`

Expected: FAIL，提示 `MonitorView.vue` 中脚本变量缺失或未定义，证明页面模板确实覆盖到了新行为。

- [ ] **Step 3: 编写页面脚本和最小交互逻辑**

```vue
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
const statusHint = computed(() => `当前监控端状态为${viewModel.value.status.label}`);
const manualConfig = computed(() => ({
  apiBaseUrl: viewModel.value.binding.apiBaseUrl,
  key: viewModel.value.binding.key,
  stateUrl: `${viewModel.value.binding.apiBaseUrl}/getState`,
  heartUrl: `${viewModel.value.binding.apiBaseUrl}/appHeart`
}));

/**
 * 加载监控端配置和状态
 * 页面首次进入时同步拉取配置与状态，并打印关键日志。
 */
async function loadMonitorPage() {
  statusLoading.value = true;
  statusError.value = '';

  try {
    settings.value = await fetchMonitorSettings();
    state.value = await fetchMonitorState(async (path, options) => {
      if (path === '/admin/getSettings') {
        return {
          code: 1,
          msg: '成功',
          data: settings.value
        };
      }

      const { requestJson } = await import('../../services/api-client.js');
      return requestJson(path, options);
    });
    console.info('[TP-16][monitor] 监控端页面加载完成');
  } catch (error) {
    statusError.value = '监控端状态读取失败，请稍后重试';
    console.error('[TP-16][monitor] 监控端页面加载失败', {
      message: error.message
    });
  } finally {
    statusLoading.value = false;
  }
}

/**
 * 刷新监控状态
 * 仅重新读取状态接口，减少重复请求。
 */
async function handleRefresh() {
  statusLoading.value = true;
  statusError.value = '';

  try {
    state.value = await fetchMonitorState(async (path, options) => {
      if (path === '/admin/getSettings') {
        return {
          code: 1,
          msg: '成功',
          data: settings.value
        };
      }

      const { requestJson } = await import('../../services/api-client.js');
      return requestJson(path, options);
    });
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
 * 成功或失败都给出明确反馈，便于人工调试。
 */
async function handleCopyBinding() {
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
```

- [ ] **Step 4: 调整监控页顶部元信息**

在 `apps/web/src/router/routes.js` 中将监控页配置改为：

```js
      {
        path: 'monitor',
        name: 'monitor',
        component: MonitorView,
        meta: {
          access: ROUTE_META.PROTECTED,
          title: '监控端',
          description: '',
          eyebrow: '设备'
        }
      },
```

- [ ] **Step 5: 为新区域补齐页面样式**

```css
.monitor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.monitor-toolbar__heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.monitor-toolbar__heading h2 {
  margin: 0;
  font-size: 28px;
  color: var(--vmq-text);
}

.monitor-toolbar__button {
  padding: 14px 18px;
  border-radius: 16px;
  background: rgba(23, 104, 255, 0.12);
  color: var(--vmq-primary-strong);
  font-weight: 700;
  cursor: pointer;
}

.monitor-inline-error {
  margin: 0;
  color: #b02f2f;
  font-size: 14px;
}

.monitor-binding-grid,
.monitor-config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.monitor-qrcode,
.monitor-binding-panel,
.monitor-download {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.monitor-qrcode {
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 22px;
  border: 1px dashed var(--vmq-border-strong);
  border-radius: var(--vmq-radius-lg);
  background: rgba(248, 251, 255, 0.88);
}

.monitor-qrcode img {
  width: 220px;
  height: 220px;
  object-fit: contain;
}

.monitor-download__link {
  display: inline-flex;
  width: fit-content;
}
```

- [ ] **Step 6: 运行前端校验确保页面可编译**

Run: `npm.cmd run check:web`

Expected: PASS。

### Task 4: 集成脚本与验证

**Files:**
- Modify: `package.json`
- Test: `apps/web/tests/monitor-format.test.js`
- Test: `apps/web/tests/monitor-service.test.js`

- [ ] **Step 1: 扩展前端测试与校验脚本**

将 `package.json` 中相关脚本改为：

```json
{
  "scripts": {
    "check:web": "node --check apps/web/vite.config.js && node --check apps/web/src/main.js && node --check apps/web/src/router/index.js && node --check apps/web/src/router/routes.js && node --check apps/web/src/router/route-meta.js && node --check apps/web/src/router/guards.js && node --check apps/web/src/config/admin-navigation.js && node --check apps/web/src/constants/auth.js && node --check apps/web/src/utils/auth-storage.js && node --check apps/web/src/utils/settings-form.js && node --check apps/web/src/utils/monitor-format.js && node --check apps/web/src/stores/auth.js && node --check apps/web/src/stores/app.js && node --check apps/web/src/services/api-client.js && node --check apps/web/src/services/auth-service.js && node --check apps/web/src/services/settings-service.js && node --check apps/web/src/services/monitor-service.js",
    "test:web": "node --test apps/web/tests/auth-storage.test.js apps/web/tests/router-guards.test.js apps/web/tests/auth-service.test.js apps/web/tests/settings-service.test.js apps/web/tests/settings-form.test.js apps/web/tests/monitor-format.test.js apps/web/tests/monitor-service.test.js"
  }
}
```

- [ ] **Step 2: 运行新增的监控页单测**

Run: `node --test apps/web/tests/monitor-format.test.js apps/web/tests/monitor-service.test.js`

Expected: PASS。

- [ ] **Step 3: 运行完整前端测试**

Run: `npm.cmd run test:web`

Expected: PASS，现有测试与新增监控页测试全部通过。

- [ ] **Step 4: 运行完整前端语法校验**

Run: `npm.cmd run check:web`

Expected: PASS。

- [ ] **Step 5: 运行前端构建**

Run: `npm.cmd run build -w apps/web`

Expected: PASS，Vite 构建成功。

## Self-Review

### Spec coverage

1. 真实状态读取：由 Task 2 和 Task 3 覆盖。
2. 状态映射与时间格式化：由 Task 1 覆盖。
3. 扫码绑定与手动配置：由 Task 2 和 Task 3 覆盖。
4. APK 下载入口：由 Task 3 覆盖。
5. 测试与验证：由 Task 4 覆盖。

无遗漏。

### Placeholder scan

已检查无 `TODO`、`TBD`、`类似 Task N` 一类占位内容。

### Type consistency

1. `formatMonitorStatus`、`formatMonitorTimestamp`、`buildMonitorBindingPayload` 在 Task 1 定义，并在 Task 2 复用。
2. `fetchMonitorSettings`、`fetchMonitorState`、`buildMonitorViewModel`、`buildMonitorQrcodePreviewUrl` 在 Task 2 定义，并在 Task 3 使用。
3. 页面中的 `viewModel`、`bindingText`、`bindingQrcodeUrl`、`manualConfig` 命名保持一致。
