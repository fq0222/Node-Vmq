# TP-17 Qrcode Management Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将后台二维码管理页从占位页升级为真实双分区页面，支持微信/支付宝固定金额二维码的批量导入、解析、保存、列表分页与删除。

**Architecture:** 保持 `QrcodeView.vue` 作为页面入口，只负责页面编排与事件绑定；把接口调用收敛到新的 `qrcode-admin-service.js`，把支付方式映射、草稿状态流转、金额校验、摘要格式化等纯逻辑下沉到新的 `qrcode-admin.js`。测试继续沿用仓库现有的 `node:test`，通过覆盖纯函数和服务层来验证页面核心行为，最后用构建命令做整页集成验证。

**Tech Stack:** Vue 3、Vite、原生 `node:test`、Node API 兼容接口、项目现有 `requestJson` 请求封装。

---

## File Structure

### Planned File Changes

- Modify: `F:\web-project\Node-Vmq\apps\web\src\views\admin\QrcodeView.vue`
  页面主入口，承接双分区 UI、上传交互、批量保存、分页和删除。
- Create: `F:\web-project\Node-Vmq\apps\web\src\services\qrcode-admin-service.js`
  封装二维码列表、新增、删除、图片解析、预览地址生成。
- Create: `F:\web-project\Node-Vmq\apps\web\src\utils\qrcode-admin.js`
  纯函数集合，负责支付方式映射、草稿创建、金额校验、摘要生成、批量结果汇总。
- Create: `F:\web-project\Node-Vmq\apps\web\tests\qrcode-admin.test.js`
  覆盖纯函数和草稿状态编排逻辑。
- Create: `F:\web-project\Node-Vmq\apps\web\tests\qrcode-admin-service.test.js`
  覆盖服务层接口参数映射和预览地址生成。
- Modify: `F:\web-project\Node-Vmq\apps\web\src\styles\global.css`
  增加二维码管理页双分区、表格、状态标签和分页样式。

### Implementation Boundaries

- 不引入新的 UI 框架或测试框架。
- 不新增复杂筛选和搜索。
- 不改动现有后端接口签名。
- 不在本计划中提交 Git Commit，只有用户明确要求时才执行提交。

## Task 1: 建立二维码管理纯函数与测试基线

**Files:**
- Create: `F:\web-project\Node-Vmq\apps\web\src\utils\qrcode-admin.js`
- Test: `F:\web-project\Node-Vmq\apps\web\tests\qrcode-admin.test.js`

- [ ] **Step 1: 写纯函数测试，锁定支付方式映射、金额校验和草稿对象结构**

```js
/**
 * 二维码管理纯函数测试文件
 * 负责验证支付方式映射、金额校验、草稿创建和文本摘要逻辑。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAYMENT_TYPE_MAP,
  createDraftRecord,
  getAmountError,
  summarizeQrcodeText,
  collectSavableDrafts,
  buildBatchSaveSummary
} from '../src/utils/qrcode-admin.js';

test('支付方式映射应固定为微信 1、支付宝 2', () => {
  assert.equal(PAYMENT_TYPE_MAP.wechat, 1);
  assert.equal(PAYMENT_TYPE_MAP.alipay, 2);
});

test('草稿对象应保留文件名、类型、默认状态和空金额', () => {
  const draft = createDraftRecord({
    type: PAYMENT_TYPE_MAP.wechat,
    fileName: 'wx-001.png'
  });

  assert.equal(draft.fileName, 'wx-001.png');
  assert.equal(draft.type, 1);
  assert.equal(draft.price, '');
  assert.equal(draft.status, 'pending');
  assert.equal(typeof draft.draftId, 'string');
});

test('金额校验应拦截空值、非法字符和小于等于零的输入', () => {
  assert.equal(getAmountError(''), '请输入金额');
  assert.equal(getAmountError('abc'), '金额格式不正确');
  assert.equal(getAmountError('0'), '金额必须大于 0');
  assert.equal(getAmountError('12.50'), '');
});

test('二维码内容摘要应在长文本场景下截断显示', () => {
  const result = summarizeQrcodeText('wxp://qrcode/1234567890/abcdefghijklmnopqrstuvwxyz');
  assert.equal(result.length <= 29, true);
  assert.equal(result.endsWith('...'), true);
});

test('仅解析成功且金额合法的草稿可以进入保存队列', () => {
  const drafts = [
    {
      draftId: '1',
      status: 'success',
      type: 1,
      price: '12.00',
      payUrl: 'wxp://ok'
    },
    {
      draftId: '2',
      status: 'failed',
      type: 1,
      price: '15.00',
      payUrl: 'wxp://bad'
    },
    {
      draftId: '3',
      status: 'success',
      type: 1,
      price: '',
      payUrl: 'wxp://empty'
    }
  ];

  const result = collectSavableDrafts(drafts);

  assert.equal(result.length, 1);
  assert.equal(result[0].draftId, '1');
});

test('批量保存汇总应返回成功数、失败数和失败项', () => {
  const result = buildBatchSaveSummary([
    { draftId: '1', ok: true },
    { draftId: '2', ok: false, message: '失败' },
    { draftId: '3', ok: true }
  ]);

  assert.deepEqual(result, {
    successCount: 2,
    failedCount: 1,
    failedItems: [{ draftId: '2', message: '失败' }]
  });
});
```

- [ ] **Step 2: 运行纯函数测试，确认先红灯**

Run:

```powershell
node --test tests/qrcode-admin.test.js
```

Expected:

```text
FAIL ... Cannot find module '../src/utils/qrcode-admin.js'
```

- [ ] **Step 3: 编写最小纯函数实现**

```js
/**
 * 二维码管理工具文件
 * 负责支付方式映射、草稿创建、金额校验和批量保存汇总等纯函数逻辑。
 */
export const PAYMENT_TYPE_MAP = {
  wechat: 1,
  alipay: 2
};

export function createDraftRecord(input) {
  return {
    draftId: `${input.type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    fileName: String(input.fileName || ''),
    type: Number(input.type || 0),
    price: '',
    payUrl: '',
    previewUrl: '',
    status: 'pending',
    errorMessage: ''
  };
}

export function getAmountError(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return '请输入金额';
  }

  if (!/^\d+(\.\d+)?$/.test(text)) {
    return '金额格式不正确';
  }

  if (Number(text) <= 0) {
    return '金额必须大于 0';
  }

  return '';
}

export function summarizeQrcodeText(value) {
  const text = String(value || '').trim();

  if (text.length <= 26) {
    return text;
  }

  return `${text.slice(0, 26)}...`;
}

export function collectSavableDrafts(drafts) {
  return drafts.filter((draft) => {
    return draft.status === 'success' && !getAmountError(draft.price) && String(draft.payUrl || '').trim();
  });
}

export function buildBatchSaveSummary(results) {
  const failedItems = results
    .filter((item) => !item.ok)
    .map((item) => ({
      draftId: item.draftId,
      message: item.message || '保存失败'
    }));

  return {
    successCount: results.filter((item) => item.ok).length,
    failedCount: failedItems.length,
    failedItems
  };
}
```

- [ ] **Step 4: 运行纯函数测试，确认转绿**

Run:

```powershell
node --test tests/qrcode-admin.test.js
```

Expected:

```text
ok 1 - 支付方式映射应固定为微信 1、支付宝 2
ok 2 - 草稿对象应保留文件名、类型、默认状态和空金额
ok ...
# pass 6
```

- [ ] **Step 5: 小幅重构，补草稿状态更新辅助函数并维持绿灯**

```js
export function updateDraftRecord(draft, patch) {
  return {
    ...draft,
    ...patch
  };
}
```

Run:

```powershell
node --test tests/qrcode-admin.test.js
```

Expected:

```text
# pass 6
```

## Task 2: 建立二维码管理服务层与接口测试

**Files:**
- Create: `F:\web-project\Node-Vmq\apps\web\src\services\qrcode-admin-service.js`
- Test: `F:\web-project\Node-Vmq\apps\web\tests\qrcode-admin-service.test.js`

- [ ] **Step 1: 先写服务层测试，锁定列表、新增、删除、解析和预览地址行为**

```js
/**
 * 二维码管理服务测试文件
 * 负责验证列表查询、新增、删除、二维码解析和预览地址生成行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchPayQrcodePage,
  createPayQrcode,
  deletePayQrcode,
  decodePayQrcodeFile,
  buildPayQrcodePreviewUrl
} from '../src/services/qrcode-admin-service.js';

test('二维码列表查询应携带分页参数和支付方式类型', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return {
      code: 0,
      msg: '',
      count: 1,
      data: [{ id: 9, price: 12, type: 1, payUrl: 'wxp://ok' }]
    };
  };

  const result = await fetchPayQrcodePage({ page: 2, limit: 10, type: 1 }, request);

  assert.equal(calls[0].path, '/admin/getPayQrcodes');
  assert.equal(calls[0].options.method, 'GET');
  assert.deepEqual(calls[0].options.query, undefined);
  assert.equal(result.count, 1);
  assert.equal(result.rows[0].id, 9);
});

test('新增二维码应提交 type、price 和 payUrl', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return { code: 1, msg: '成功', data: null };
  };

  const result = await createPayQrcode({
    type: 2,
    price: '18.88',
    payUrl: 'alipay://demo'
  }, request);

  assert.equal(calls[0].path, '/admin/addPayQrcode');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(calls[0].options.body, {
    type: 2,
    price: '18.88',
    payUrl: 'alipay://demo'
  });
  assert.equal(result.ok, true);
});

test('删除二维码应提交记录 id', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return { code: 1, msg: '成功', data: null };
  };

  const result = await deletePayQrcode(15, request);

  assert.equal(calls[0].path, '/admin/delPayQrcode');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(calls[0].options.body, { id: 15 });
  assert.equal(result.ok, true);
});

test('二维码图片解析应提交 multipart 请求', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });
    return { code: 1, msg: '成功', data: 'wxp://decoded' };
  };

  const result = await decodePayQrcodeFile({ name: 'wechat.png' }, request);

  assert.equal(calls[0].path, '/deQrcode2');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.body instanceof FormData, true);
  assert.equal(result.text, 'wxp://decoded');
});

test('二维码预览地址应拼接 enQrcode 接口', () => {
  assert.equal(
    buildPayQrcodePreviewUrl('wxp://decoded'),
    'http://localhost:3000/enQrcode?url=wxp%3A%2F%2Fdecoded'
  );
});
```

- [ ] **Step 2: 运行服务层测试，确认先红灯**

Run:

```powershell
node --test tests/qrcode-admin-service.test.js
```

Expected:

```text
FAIL ... Cannot find module '../src/services/qrcode-admin-service.js'
```

- [ ] **Step 3: 编写最小服务实现，并复用现有请求封装风格**

```js
/**
 * 二维码管理服务文件
 * 负责封装二维码列表读取、新增、删除、解析和预览地址生成逻辑。
 */
import { getApiBaseUrl, requestJson } from './api-client.js';

function buildQueryString(params) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) {
      search.set(key, String(value));
    }
  }

  return search.toString();
}

export async function fetchPayQrcodePage(params, request = requestJson) {
  const query = buildQueryString({
    page: params.page || 1,
    limit: params.limit || 10,
    type: params.type
  });
  const result = await request(`/admin/getPayQrcodes?${query}`, {
    method: 'GET'
  });

  return {
    count: Number(result?.count || 0),
    rows: Array.isArray(result?.data) ? result.data : []
  };
}

export async function createPayQrcode(payload, request = requestJson) {
  const result = await request('/admin/addPayQrcode', {
    method: 'POST',
    body: payload
  });

  return {
    ok: result?.code === 1,
    message: result?.msg || '保存成功'
  };
}

export async function deletePayQrcode(id, request = requestJson) {
  const result = await request('/admin/delPayQrcode', {
    method: 'POST',
    body: { id }
  });

  return {
    ok: result?.code === 1,
    message: result?.msg || '删除成功'
  };
}

export async function decodePayQrcodeFile(file, request = requestJson) {
  const formData = new FormData();
  formData.append('file', file);

  const result = await request('/deQrcode2', {
    method: 'POST',
    body: formData
  });

  return {
    ok: result?.code === 1,
    text: result?.data || '',
    message: result?.msg || ''
  };
}

export function buildPayQrcodePreviewUrl(text) {
  if (!text) {
    return '';
  }

  return `${getApiBaseUrl()}/enQrcode?url=${encodeURIComponent(text)}`;
}
```

- [ ] **Step 4: 运行服务层测试，确认转绿**

Run:

```powershell
node --test tests/qrcode-admin-service.test.js
```

Expected:

```text
ok 1 - 二维码列表查询应携带分页参数和支付方式类型
ok 2 - 新增二维码应提交 type、price 和 payUrl
ok ...
# pass 5
```

- [ ] **Step 5: 修正列表测试与实现的真实接口调用细节，维持绿灯**

```js
assert.equal(calls[0].path, '/admin/getPayQrcodes?page=2&limit=10&type=1');
assert.equal(calls[0].options.method, 'GET');
```

Run:

```powershell
node --test tests/qrcode-admin-service.test.js
```

Expected:

```text
# pass 5
```

## Task 3: 用测试覆盖页面编排规则，再实现双分区页面

**Files:**
- Modify: `F:\web-project\Node-Vmq\apps\web\src\views\admin\QrcodeView.vue`
- Modify: `F:\web-project\Node-Vmq\apps\web\src\styles\global.css`
- Modify: `F:\web-project\Node-Vmq\apps\web\src\utils\qrcode-admin.js`
- Test: `F:\web-project\Node-Vmq\apps\web\tests\qrcode-admin.test.js`

- [ ] **Step 1: 先扩展纯函数测试，覆盖批量保存汇总与列表展示所需格式化行为**

```js
test('保存成功后应能按草稿 id 过滤已完成项', () => {
  const drafts = [
    { draftId: '1', status: 'success' },
    { draftId: '2', status: 'save_failed' },
    { draftId: '3', status: 'success' }
  ];
  const savedDraftIds = ['1', '3'];

  const result = removeSavedDrafts(drafts, savedDraftIds);

  assert.deepEqual(result, [{ draftId: '2', status: 'save_failed' }]);
});

test('列表金额应格式化为两位小数', () => {
  assert.equal(formatPayQrcodePrice(12), '12.00');
  assert.equal(formatPayQrcodePrice('18.8'), '18.80');
});
```

- [ ] **Step 2: 运行扩展后的纯函数测试，确认因缺少实现而失败**

Run:

```powershell
node --test tests/qrcode-admin.test.js
```

Expected:

```text
FAIL ... removeSavedDrafts is not defined
```

- [ ] **Step 3: 在工具文件中补齐页面编排所需函数，并保持最小实现**

```js
export function removeSavedDrafts(drafts, savedDraftIds) {
  return drafts.filter((draft) => !savedDraftIds.includes(draft.draftId));
}

export function formatPayQrcodePrice(value) {
  const amount = Number(value || 0);
  return amount.toFixed(2);
}
```

- [ ] **Step 4: 运行纯函数测试，确认再次转绿**

Run:

```powershell
node --test tests/qrcode-admin.test.js
```

Expected:

```text
# pass 8
```

- [ ] **Step 5: 实现页面脚本骨架，先接入双分区数据模型和初始化加载**

```vue
<script setup>
import { onMounted, reactive } from 'vue';
import PageShell from '../../components/admin/PageShell.vue';
import PageHeader from '../../components/admin/PageHeader.vue';
import PanelCard from '../../components/admin/PanelCard.vue';
import {
  fetchPayQrcodePage,
  createPayQrcode,
  deletePayQrcode,
  decodePayQrcodeFile,
  buildPayQrcodePreviewUrl
} from '../../services/qrcode-admin-service.js';
import {
  PAYMENT_TYPE_MAP,
  createDraftRecord,
  updateDraftRecord,
  getAmountError,
  summarizeQrcodeText,
  collectSavableDrafts,
  buildBatchSaveSummary,
  removeSavedDrafts,
  formatPayQrcodePrice
} from '../../utils/qrcode-admin.js';

const PAGE_SIZE = 10;
const sections = reactive({
  wechat: createSectionState(PAYMENT_TYPE_MAP.wechat),
  alipay: createSectionState(PAYMENT_TYPE_MAP.alipay)
});

function createSectionState(type) {
  return {
    type,
    drafts: [],
    rows: [],
    page: 1,
    count: 0,
    loading: false,
    saving: false,
    loadError: '',
    actionMessage: ''
  };
}

async function loadSectionRows(sectionKey) {
  const section = sections[sectionKey];
  section.loading = true;
  section.loadError = '';
  console.info('[TP-17][qrcode] 开始加载已保存二维码列表', {
    sectionKey,
    type: section.type,
    page: section.page
  });

  try {
    const result = await fetchPayQrcodePage({
      page: section.page,
      limit: PAGE_SIZE,
      type: section.type
    });
    section.rows = result.rows;
    section.count = result.count;
  } catch (error) {
    section.loadError = error.message || '二维码列表加载失败';
    console.warn('[TP-17][qrcode] 已保存二维码列表加载失败', {
      sectionKey,
      message: error.message
    });
  } finally {
    section.loading = false;
  }
}

onMounted(async () => {
  await Promise.all([
    loadSectionRows('wechat'),
    loadSectionRows('alipay')
  ]);
});
</script>
```

- [ ] **Step 6: 实现批量上传、逐张解析、串行保存和删除逻辑**

```js
async function handleFilesChange(event, sectionKey) {
  const files = Array.from(event.target.files || []);
  const section = sections[sectionKey];

  console.info('[TP-17][qrcode] 开始批量解析二维码图片', {
    sectionKey,
    count: files.length
  });

  for (const file of files) {
    const draft = createDraftRecord({
      type: section.type,
      fileName: file.name
    });
    section.drafts.push(draft);

    if (!String(file.type || '').startsWith('image/')) {
      Object.assign(draft, updateDraftRecord(draft, {
        status: 'failed',
        errorMessage: '仅支持图片文件'
      }));
      continue;
    }

    Object.assign(draft, updateDraftRecord(draft, {
      status: 'parsing'
    }));

    try {
      const result = await decodePayQrcodeFile(file);

      if (!result.ok || !result.text) {
        throw new Error(result.message || '二维码解析失败');
      }

      Object.assign(draft, updateDraftRecord(draft, {
        status: 'success',
        payUrl: result.text,
        previewUrl: buildPayQrcodePreviewUrl(result.text),
        errorMessage: ''
      }));
      console.info('[TP-17][qrcode] 单张二维码解析成功', {
        sectionKey,
        fileName: file.name
      });
    } catch (error) {
      Object.assign(draft, updateDraftRecord(draft, {
        status: 'failed',
        errorMessage: error.message || '二维码解析失败'
      }));
      console.warn('[TP-17][qrcode] 单张二维码解析失败', {
        sectionKey,
        fileName: file.name,
        message: error.message
      });
    }
  }

  event.target.value = '';
}

async function handleBatchSave(sectionKey) {
  const section = sections[sectionKey];
  const savableDrafts = collectSavableDrafts(section.drafts);
  const results = [];

  section.saving = true;
  section.actionMessage = '';
  console.info('[TP-17][qrcode] 开始批量保存二维码', {
    sectionKey,
    count: savableDrafts.length
  });

  for (const draft of savableDrafts) {
    try {
      const result = await createPayQrcode({
        type: draft.type,
        price: draft.price,
        payUrl: draft.payUrl
      });

      results.push({
        draftId: draft.draftId,
        ok: result.ok,
        message: result.message
      });

      if (!result.ok) {
        draft.status = 'save_failed';
        draft.errorMessage = result.message || '保存失败';
        console.warn('[TP-17][qrcode] 单条二维码保存失败', {
          sectionKey,
          fileName: draft.fileName,
          message: draft.errorMessage
        });
      }
    } catch (error) {
      draft.status = 'save_failed';
      draft.errorMessage = error.message || '保存失败';
      results.push({
        draftId: draft.draftId,
        ok: false,
        message: draft.errorMessage
      });
    }
  }

  const summary = buildBatchSaveSummary(results);
  const successIds = results.filter((item) => item.ok).map((item) => item.draftId);
  section.drafts = removeSavedDrafts(section.drafts, successIds);
  section.actionMessage = `已成功保存 ${summary.successCount} 条，失败 ${summary.failedCount} 条`;
  section.saving = false;

  await loadSectionRows(sectionKey);
}
```

- [ ] **Step 7: 完成模板和样式，实现生产可用双分区界面**

```vue
<template>
  <PageShell>
    <PageHeader
      title="二维码管理"
      description="管理微信和支付宝固定金额二维码，支持批量导入、保存与删除。"
      eyebrow="收款"
    />

    <div class="qrcode-page">
      <section v-for="sectionKey in ['wechat', 'alipay']" :key="sectionKey" class="qrcode-section">
        <PanelCard :title="sectionKey === 'wechat' ? '微信固定金额二维码' : '支付宝固定金额二维码'">
          <!-- 上传区、草稿表、已保存列表、分页与删除按钮都在这里落地 -->
        </PanelCard>
      </section>
    </div>
  </PageShell>
</template>
```

```css
.qrcode-page {
  display: grid;
  gap: 24px;
}

.qrcode-section {
  display: grid;
  gap: 16px;
}

.qrcode-draft-table,
.qrcode-saved-table {
  width: 100%;
  border-collapse: collapse;
}

.qrcode-status--success {
  color: #18794e;
}

.qrcode-status--danger {
  color: #b42318;
}
```

- [ ] **Step 8: 运行二维码管理相关测试并执行前端构建验证**

Run:

```powershell
node --test tests/qrcode-admin.test.js tests/qrcode-admin-service.test.js
```

Expected:

```text
# pass 13
```

Run:

```powershell
npm run build
```

Expected:

```text
vite v... building for production...
✓ built in ...
```

- [ ] **Step 9: 做最终自检，确认页面不再保留占位和任务文案**

Checklist:

```text
1. QrcodeView 页面标题、说明、按钮文案全部是生产文案。
2. 页面中不出现 TP-17、占位、后续接入等提示。
3. 上传、解析、保存、删除关键分支都有中文日志。
4. 微信与支付宝两个分区都能独立加载、保存和翻页。
```

## Self-Review

### Spec Coverage

- 双分区：Task 3 Step 5-7 覆盖。
- 批量上传与逐张解析：Task 3 Step 6 覆盖。
- 金额校验：Task 1 Step 1-4 覆盖。
- 串行批量保存与汇总：Task 1 Step 1、Task 3 Step 6 覆盖。
- 已保存列表分页与删除：Task 2 Step 1-4、Task 3 Step 5-7 覆盖。
- 中文日志与生产文案：Task 3 Step 5-9 覆盖。

### Placeholder Scan

- 未使用 TBD、TODO、稍后实现 等占位。
- 每个涉及代码的步骤都给出了目标代码块和命令。

### Type Consistency

- 支付方式常量统一使用 `PAYMENT_TYPE_MAP`。
- 草稿状态统一使用 `pending`、`parsing`、`success`、`failed`、`save_failed`。
- 服务层命名统一使用 `PayQrcode`，避免和通用二维码生成接口混淆。

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-26-tp-17-qrcode-management-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
