<template>
  <PageShell>
    <PageHeader
      eyebrow="收款码管理"
      title="固定金额二维码"
      description="分别维护微信和支付宝固定金额二维码，支持按分区上传解析、金额补录、批量保存、删除和分页查看。"
    >
      <template #actions>
        <div class="qrcode-header-stats">
          <div class="qrcode-header-stats__item">
            <strong>{{ totalSavedCount }}</strong>
            <span>已保存总数</span>
          </div>
          <div class="qrcode-header-stats__item">
            <strong>{{ totalSavableDraftCount }}</strong>
            <span>待保存草稿</span>
          </div>
        </div>
      </template>
    </PageHeader>

    <section class="qrcode-section-stack">
      <PanelCard
        v-for="section in sectionList"
        :key="section.key"
        :title="`${section.label}固定金额二维码`"
        :description="section.description"
      >
        <template #actions>
          <div class="qrcode-section-chip">
            <span>{{ section.label }}</span>
            <strong>{{ section.type }}</strong>
          </div>
        </template>

        <div class="qrcode-section-layout">
          <section class="qrcode-section-block">
            <div class="qrcode-section-block__header">
              <div>
                <h3>已保存列表</h3>
                <p>仅展示当前分区的已保存二维码，支持删除和分页刷新。</p>
              </div>
              <button
                class="qrcode-action-button qrcode-action-button--secondary"
                :disabled="section.loadingSavedList || section.deletingId !== ''"
                @click="handleRefreshList(section.key)"
              >
                {{ section.loadingSavedList ? '正在刷新...' : '刷新列表' }}
              </button>
            </div>

            <div v-if="section.listError" class="settings-alert settings-alert--error">
              {{ section.listError }}
            </div>
            <div v-else-if="section.listNotice" class="settings-alert settings-alert--success">
              {{ section.listNotice }}
            </div>

            <div class="qrcode-panel-meta">
              <span>共 {{ section.totalCount }} 条记录</span>
              <span>第 {{ section.currentPage }} / {{ getTotalPages(section) }} 页</span>
            </div>

            <div v-if="section.savedRows.length > 0" class="qrcode-table-wrap">
              <table class="qrcode-table">
                <thead>
                  <tr>
                    <th>二维码预览</th>
                    <th>金额</th>
                    <th>内容摘要</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in section.savedRows" :key="item.id">
                    <td>
                      <div class="qrcode-preview-cell">
                        <img
                          class="qrcode-preview-cell__image"
                          :src="item.previewUrl"
                          :alt="`${section.label}已保存二维码预览`"
                        />
                      </div>
                    </td>
                    <td class="qrcode-table__amount">￥{{ item.price }}</td>
                    <td>
                      <div class="qrcode-summary-cell">
                        <strong>{{ item.summary }}</strong>
                        <span>{{ item.payUrl }}</span>
                      </div>
                    </td>
                    <td>
                      <button
                        class="qrcode-action-button qrcode-action-button--danger"
                        :disabled="section.deletingId === String(item.id)"
                        @click="handleDelete(section.key, item)"
                      >
                        {{ section.deletingId === String(item.id) ? '删除中...' : '删除' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="qrcode-empty-block">
              <p>当前还没有已保存的{{ section.label }}固定金额二维码。</p>
            </div>

            <div class="qrcode-pagination">
              <button
                class="qrcode-action-button qrcode-action-button--secondary"
                :disabled="section.loadingSavedList || section.currentPage <= 1"
                @click="handlePageChange(section.key, section.currentPage - 1)"
              >
                上一页
              </button>
              <button
                class="qrcode-action-button qrcode-action-button--secondary"
                :disabled="section.loadingSavedList || section.currentPage >= getTotalPages(section)"
                @click="handlePageChange(section.key, section.currentPage + 1)"
              >
                下一页
              </button>
            </div>
          </section>

          <section class="qrcode-section-block">
            <div class="qrcode-section-block__header">
              <div>
                <h3>上传草稿</h3>
                <p>{{ section.uploadDescription }}</p>
              </div>
              <div class="qrcode-draft-actions">
                <input
                  :ref="(element) => setFileInputRef(section.key, element)"
                  class="qrcode-hidden-input"
                  type="file"
                  accept="image/*"
                  multiple
                  :disabled="section.parsingDrafts || section.savingDrafts"
                  @change="handleFileSelect(section.key, $event)"
                />
                <button
                  class="qrcode-action-button qrcode-action-button--secondary"
                  :disabled="section.parsingDrafts || section.savingDrafts"
                  @click="openFilePicker(section.key)"
                >
                  {{ section.parsingDrafts ? '解析中...' : '上传图片' }}
                </button>
                <button
                  class="qrcode-action-button"
                  :disabled="section.savingDrafts || section.parsingDrafts || getSavableDraftCount(section) === 0"
                  @click="handleBatchSave(section.key)"
                >
                  {{
                    section.savingDrafts
                      ? '正在保存...'
                      : `批量保存 ${getSavableDraftCount(section)} 条`
                  }}
                </button>
              </div>
            </div>

            <div v-if="section.draftError" class="settings-alert settings-alert--error">
              {{ section.draftError }}
            </div>
            <div v-else-if="section.draftNotice" class="settings-alert settings-alert--success">
              {{ section.draftNotice }}
            </div>

            <div class="qrcode-panel-meta">
              <span>草稿 {{ section.drafts.length }} 条</span>
              <span>可保存 {{ getSavableDraftCount(section) }} 条</span>
            </div>

            <div v-if="section.drafts.length > 0" class="qrcode-draft-list">
              <article
                v-for="draft in section.drafts"
                :key="draft.draftId"
                class="qrcode-draft-card"
              >
                <div class="qrcode-draft-card__preview">
                  <img :src="draft.previewUrl" :alt="`${section.label}上传二维码预览`" />
                </div>

                <div class="qrcode-draft-card__content">
                  <div class="qrcode-draft-card__top">
                    <div>
                      <h3>{{ draft.fileName }}</h3>
                      <p>{{ draft.qrcodeSummary || '等待二维码解析结果' }}</p>
                    </div>
                    <button
                      class="qrcode-action-button qrcode-action-button--ghost"
                      :disabled="section.savingDrafts"
                      @click="handleRemoveDraft(section.key, draft.draftId)"
                    >
                      移除
                    </button>
                  </div>

                  <div class="qrcode-draft-grid">
                    <label class="settings-field">
                      <span>支付类型</span>
                      <select
                        :value="draft.type"
                        :disabled="section.savingDrafts"
                        @change="handleDraftTypeChange(section.key, draft.draftId, $event.target.value)"
                      >
                        <option value="">请选择</option>
                        <option :value="section.type">{{ section.label }}</option>
                        <option :value="getAlternateType(section.type)">
                          {{ getPaymentTypeLabel(getAlternateType(section.type)) }}
                        </option>
                      </select>
                    </label>

                    <label class="settings-field">
                      <span>金额</span>
                      <input
                        :value="draft.price"
                        type="text"
                        inputmode="decimal"
                        placeholder="例如 18.80"
                        :disabled="section.savingDrafts"
                        @input="handleDraftPriceChange(section.key, draft.draftId, $event.target.value)"
                      />
                    </label>
                  </div>

                  <div class="qrcode-draft-card__footer">
                    <span class="qrcode-status-badge" :class="getDraftStatusClass(draft)">
                      {{ getDraftStatusText(draft) }}
                    </span>
                    <p class="qrcode-draft-card__message">{{ getDraftMessage(section, draft) }}</p>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="qrcode-empty-block">
              <p>请上传{{ section.label }}固定金额二维码图片，系统会在当前分区内逐张解析。</p>
            </div>
          </section>
        </div>
      </PanelCard>
    </section>
  </PageShell>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import PageHeader from '../../components/admin/PageHeader.vue';
import PageShell from '../../components/admin/PageShell.vue';
import PanelCard from '../../components/admin/PanelCard.vue';
import {
  buildPayQrcodePreviewUrl,
  createPayQrcode,
  decodePayQrcodeFile,
  deletePayQrcode,
  fetchPayQrcodePage
} from '../../services/qrcode-admin-service.js';
import {
  PAYMENT_TYPE_MAP,
  buildBatchSaveSummary,
  collectSavableDrafts,
  createDraftRecord,
  extractAmountFromFileName,
  getAmountError,
  inferPaymentTypeFromText,
  summarizeQrcodeText,
  updateDraftRecord
} from '../../utils/qrcode-admin.js';

/**
 * 二维码管理页。
 * 按微信和支付宝拆分为两套独立状态，分别管理列表、草稿、保存、删除与分页。
 */
const PAGE_SIZE = 10;
const fileInputRefs = reactive({});

/**
 * 创建分区状态。
 * 每个分区独立维护自己的列表、草稿、分页、提示文案和处理中状态。
 * @param {{key: string, label: string, type: string, description: string, uploadDescription: string}} config - 分区配置
 * @returns {object} 分区状态对象
 */
function createSectionState(config) {
  return reactive({
    ...config,
    loadingSavedList: false,
    savingDrafts: false,
    parsingDrafts: false,
    deletingId: '',
    currentPage: 1,
    totalCount: 0,
    listError: '',
    listNotice: '',
    draftError: '',
    draftNotice: '',
    savedRows: [],
    drafts: []
  });
}

const sections = {
  wechat: createSectionState({
    key: 'wechat',
    label: PAYMENT_TYPE_MAP.wechat.label,
    type: PAYMENT_TYPE_MAP.wechat.type,
    description: '独立展示微信固定金额二维码列表、删除操作与分页状态。',
    uploadDescription: '上传微信二维码图片后会优先保留当前分区类型，也可手工改成支付宝。'
  }),
  alipay: createSectionState({
    key: 'alipay',
    label: PAYMENT_TYPE_MAP.alipay.label,
    type: PAYMENT_TYPE_MAP.alipay.type,
    description: '独立展示支付宝固定金额二维码列表、删除操作与分页状态。',
    uploadDescription: '上传支付宝二维码图片后会优先保留当前分区类型，也可手工改成微信。'
  })
};

const sectionList = [sections.wechat, sections.alipay];

const totalSavedCount = computed(() =>
  sectionList.reduce((sum, section) => sum + Number(section.totalCount || 0), 0)
);
const totalSavableDraftCount = computed(() =>
  sectionList.reduce((sum, section) => sum + getSavableDraftCount(section), 0)
);

/**
 * 获取指定分区。
 * 统一收敛 key 到状态对象的映射，避免多处直接访问。
 * @param {string} sectionKey - 分区键
 * @returns {object} 分区状态
 */
function getSection(sectionKey) {
  return sections[sectionKey];
}

/**
 * 计算分区总页数。
 * 保底返回 1，避免空列表时分页显示异常。
 * @param {object} section - 分区状态
 * @returns {number} 总页数
 */
function getTotalPages(section) {
  return Math.max(1, Math.ceil(section.totalCount / PAGE_SIZE));
}

/**
 * 计算分区中可保存草稿数量。
 * 只统计当前分区中满足保存条件的草稿。
 * @param {object} section - 分区状态
 * @returns {number} 可保存数量
 */
function getSavableDraftCount(section) {
  return collectSavableDrafts(section.drafts).length;
}

/**
 * 设置文件输入框引用。
 * 分区各自保留独立输入框，按钮点击时只触发当前分区。
 * @param {string} sectionKey - 分区键
 * @param {HTMLInputElement | null} element - 输入框节点
 */
function setFileInputRef(sectionKey, element) {
  if (element) {
    fileInputRefs[sectionKey] = element;
    return;
  }

  delete fileInputRefs[sectionKey];
}

/**
 * 打开当前分区的文件选择器。
 * 分区上传互不影响，避免把图片加入错误的草稿区。
 * @param {string} sectionKey - 分区键
 */
function openFilePicker(sectionKey) {
  fileInputRefs[sectionKey]?.click();
}

/**
 * 获取另一种支付类型。
 * 便于在分区内手工切换到另一支付渠道。
 * @param {string} type - 当前支付类型
 * @returns {string} 另一支付类型
 */
function getAlternateType(type) {
  if (String(type) === PAYMENT_TYPE_MAP.wechat.type) {
    return PAYMENT_TYPE_MAP.alipay.type;
  }

  return PAYMENT_TYPE_MAP.wechat.type;
}

/**
 * 读取当前分区的已保存列表。
 * 查询时固定带上分区 type，确保微信和支付宝分页状态互相独立。
 * @param {string} sectionKey - 分区键
 * @param {number} [targetPage] - 目标页码
 */
async function loadSavedList(sectionKey, targetPage = getSection(sectionKey).currentPage) {
  const section = getSection(sectionKey);
  section.loadingSavedList = true;
  section.listError = '';

  console.info('[TP-17][qrcode-view] 开始加载分区二维码列表', {
    section: section.key,
    type: section.type,
    page: targetPage,
    limit: PAGE_SIZE
  });

  try {
    const result = await fetchPayQrcodePage({
      page: targetPage,
      limit: PAGE_SIZE,
      type: section.type
    });

    if (!result.ok) {
      section.savedRows = [];
      section.totalCount = 0;
      section.listError = result.message || `${section.label}二维码列表加载失败，请稍后重试`;
      console.warn('[TP-17][qrcode-view] 分区二维码列表加载失败', {
        section: section.key,
        page: targetPage,
        message: result.message
      });
      return;
    }

    if (result.count > 0 && result.rows.length === 0 && targetPage > 1) {
      const fallbackPage = Math.max(1, Math.ceil(result.count / PAGE_SIZE));
      console.info('[TP-17][qrcode-view] 分区列表页码自动回退', {
        section: section.key,
        requestPage: targetPage,
        fallbackPage
      });
      await loadSavedList(sectionKey, fallbackPage);
      return;
    }

    section.currentPage = targetPage;
    section.totalCount = result.count;
    section.savedRows = result.rows.map((item) => ({
      ...item,
      previewUrl: buildPayQrcodePreviewUrl(item.payUrl),
      summary: summarizeQrcodeText(item.payUrl, 30)
    }));

    console.info('[TP-17][qrcode-view] 分区二维码列表加载成功', {
      section: section.key,
      page: targetPage,
      totalCount: result.count,
      rowCount: result.rows.length
    });
  } catch (error) {
    section.savedRows = [];
    section.totalCount = 0;
    section.listError = `${section.label}二维码列表加载失败，请刷新页面后重试`;
    console.error('[TP-17][qrcode-view] 分区二维码列表加载异常', {
      section: section.key,
      page: targetPage,
      message: error.message
    });
  } finally {
    section.loadingSavedList = false;
  }
}

/**
 * 创建上传草稿。
 * 先按分区上下文设置默认支付类型，再为当前图片生成本地预览。
 * @param {object} section - 分区状态
 * @param {File} file - 上传文件
 * @returns {object} 页面态草稿
 */
function createUploadDraft(section, file) {
  return {
    ...createDraftRecord({
      draftId: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      fileName: file.name,
      price: extractAmountFromFileName(file.name),
      previewUrl: URL.createObjectURL(file),
      type: section.type,
      status: 'queued'
    }),
    hintMessage: '',
    sourceFile: file
  };
}

/**
 * 更新当前分区的指定草稿。
 * 保留页面附加字段，避免纯函数工具更新时丢失本地状态。
 * @param {string} sectionKey - 分区键
 * @param {string} draftId - 草稿标识
 * @param {Record<string, unknown>} patch - 更新字段
 */
function patchDraft(sectionKey, draftId, patch) {
  const section = getSection(sectionKey);

  section.drafts = section.drafts.map((draft) => {
    if (draft.draftId !== draftId) {
      return draft;
    }

    const next = updateDraftRecord(draft, patch);
    return {
      ...next,
      hintMessage: String(patch.hintMessage ?? draft.hintMessage ?? ''),
      sourceFile: draft.sourceFile
    };
  });
}

/**
 * 释放草稿预览资源。
 * 分区移除草稿或页面卸载时都统一回收本地 blob 预览地址。
 * @param {object} draft - 草稿对象
 */
function revokeDraftPreview(draft) {
  if (draft?.previewUrl && String(draft.previewUrl).startsWith('blob:')) {
    URL.revokeObjectURL(draft.previewUrl);
  }
}

/**
 * 按分区顺序逐张解析上传图片。
 * 自动识别类型仅用于提示，默认仍以当前分区类型作为草稿初始类型。
 * @param {string} sectionKey - 分区键
 * @param {object[]} batchDrafts - 待解析草稿
 */
async function parseDraftBatch(sectionKey, batchDrafts) {
  const section = getSection(sectionKey);
  let successCount = 0;
  let failedCount = 0;

  section.parsingDrafts = true;
  section.draftError = '';
  section.draftNotice = '';

  console.info('[TP-17][qrcode-view] 开始解析分区上传草稿', {
    section: section.key,
    type: section.type,
    count: batchDrafts.length
  });

  try {
    for (const draft of batchDrafts) {
      patchDraft(sectionKey, draft.draftId, {
        status: 'parsing',
        errorMessage: '',
        hintMessage: ''
      });

      try {
        const result = await decodePayQrcodeFile(draft.sourceFile);

        if (result.ok && result.text) {
          const inferredType = inferPaymentTypeFromText(result.text);
          const hintMessage =
            inferredType && inferredType !== section.type
              ? `系统识别结果更像${getPaymentTypeLabel(inferredType)}二维码，如有需要可手工切换支付类型`
              : '';

          patchDraft(sectionKey, draft.draftId, {
            type: section.type,
            payUrl: result.text,
            status: 'success',
            errorMessage: '',
            hintMessage
          });
          successCount += 1;
          console.info('[TP-17][qrcode-view] 分区草稿二维码解析成功', {
            section: section.key,
            draftId: draft.draftId,
            fileName: draft.fileName,
            inferredType
          });
          continue;
        }

        patchDraft(sectionKey, draft.draftId, {
          status: 'failed',
          errorMessage: result.message || '未识别到二维码内容，请更换图片后重试',
          hintMessage: ''
        });
        failedCount += 1;
        console.warn('[TP-17][qrcode-view] 分区草稿二维码解析失败', {
          section: section.key,
          draftId: draft.draftId,
          fileName: draft.fileName,
          message: result.message
        });
      } catch (error) {
        patchDraft(sectionKey, draft.draftId, {
          status: 'failed',
          errorMessage: '二维码解析失败，请更换图片后重试',
          hintMessage: ''
        });
        failedCount += 1;
        console.error('[TP-17][qrcode-view] 分区草稿二维码解析异常', {
          section: section.key,
          draftId: draft.draftId,
          fileName: draft.fileName,
          message: error.message
        });
      }
    }

    section.draftNotice = `已完成 ${batchDrafts.length} 张图片解析，成功 ${successCount} 张，失败 ${failedCount} 张`;
    console.info('[TP-17][qrcode-view] 分区草稿解析结束', {
      section: section.key,
      totalCount: batchDrafts.length,
      successCount,
      failedCount
    });
  } finally {
    section.parsingDrafts = false;
  }
}

/**
 * 处理当前分区的多图上传。
 * 所有新草稿都只挂在当前分区下，不会再进入公共草稿池。
 * @param {string} sectionKey - 分区键
 * @param {Event} event - 文件选择事件
 */
async function handleFileSelect(sectionKey, event) {
  const section = getSection(sectionKey);
  const files = Array.from(event.target.files || []);
  event.target.value = '';

  if (files.length === 0) {
    return;
  }

  const batchDrafts = files.map((file) => createUploadDraft(section, file));
  section.drafts = [...section.drafts, ...batchDrafts];

  console.info('[TP-17][qrcode-view] 收到分区图片上传请求', {
    section: section.key,
    count: files.length
  });

  await parseDraftBatch(sectionKey, batchDrafts);
}

/**
 * 录入当前分区草稿金额。
 * 修改金额时清理旧提示，便于用户连续修正后再次保存。
 * @param {string} sectionKey - 分区键
 * @param {string} draftId - 草稿标识
 * @param {string} value - 输入值
 */
function handleDraftPriceChange(sectionKey, draftId, value) {
  patchDraft(sectionKey, draftId, {
    price: String(value ?? '').trim(),
    errorMessage: ''
  });
}

/**
 * 调整当前分区草稿支付类型。
 * 即使解析结果和分区上下文不一致，也允许用户手工改正。
 * @param {string} sectionKey - 分区键
 * @param {string} draftId - 草稿标识
 * @param {string} value - 选中的支付类型
 */
function handleDraftTypeChange(sectionKey, draftId, value) {
  patchDraft(sectionKey, draftId, {
    type: String(value ?? '').trim(),
    errorMessage: '',
    hintMessage: ''
  });
}

/**
 * 移除当前分区草稿。
 * 草稿删除仅影响当前分区，不会误删另一分区的上传结果。
 * @param {string} sectionKey - 分区键
 * @param {string} draftId - 草稿标识
 */
function handleRemoveDraft(sectionKey, draftId) {
  const section = getSection(sectionKey);
  const target = section.drafts.find((draft) => draft.draftId === draftId);

  if (!target) {
    return;
  }

  revokeDraftPreview(target);
  section.drafts = section.drafts.filter((draft) => draft.draftId !== draftId);
}

/**
 * 批量保存当前分区草稿。
 * 只会保存当前分区的可用草稿，成功后刷新当前分区列表并移除对应草稿。
 * @param {string} sectionKey - 分区键
 */
async function handleBatchSave(sectionKey) {
  const section = getSection(sectionKey);
  const savableDrafts = collectSavableDrafts(section.drafts);

  section.draftError = '';
  section.draftNotice = '';

  if (savableDrafts.length === 0) {
    section.draftError = `当前没有可保存的${section.label}草稿，请先完成二维码解析、金额录入和支付类型选择`;
    console.warn('[TP-17][qrcode-view] 分区批量保存被拦截，没有可保存草稿', {
      section: section.key
    });
    return;
  }

  section.savingDrafts = true;

  console.info('[TP-17][qrcode-view] 开始批量保存分区草稿', {
    section: section.key,
    draftCount: section.drafts.length,
    savableCount: savableDrafts.length
  });

  const results = [];
  const successIds = new Set();

  try {
    for (const draft of section.drafts) {
      const current = savableDrafts.find((item) => item.draftId === draft.draftId);

      if (!current) {
        results.push({
          draftId: draft.draftId,
          status: 'skipped'
        });
        continue;
      }

      try {
        const result = await createPayQrcode({
          payUrl: current.payUrl,
          price: current.price,
          type: current.type
        });

        if (result.ok) {
          successIds.add(draft.draftId);
          results.push({
            draftId: draft.draftId,
            status: 'success'
          });
          console.info('[TP-17][qrcode-view] 分区草稿保存成功', {
            section: section.key,
            draftId: draft.draftId,
            fileName: draft.fileName
          });
          continue;
        }

        patchDraft(sectionKey, draft.draftId, {
          status: 'success',
          errorMessage: result.message || '保存失败，请稍后重试'
        });
        results.push({
          draftId: draft.draftId,
          status: 'failed'
        });
        console.warn('[TP-17][qrcode-view] 分区草稿保存失败', {
          section: section.key,
          draftId: draft.draftId,
          fileName: draft.fileName,
          message: result.message
        });
      } catch (error) {
        patchDraft(sectionKey, draft.draftId, {
          status: 'success',
          errorMessage: '保存失败，请稍后重试'
        });
        results.push({
          draftId: draft.draftId,
          status: 'failed'
        });
        console.error('[TP-17][qrcode-view] 分区草稿保存异常', {
          section: section.key,
          draftId: draft.draftId,
          fileName: draft.fileName,
          message: error.message
        });
      }
    }

    const summary = buildBatchSaveSummary(results);
    section.draftNotice = summary.message;

    if (successIds.size > 0) {
      section.drafts = section.drafts.filter((draft) => {
        if (!successIds.has(draft.draftId)) {
          return true;
        }

        revokeDraftPreview(draft);
        return false;
      });
      await loadSavedList(sectionKey, section.currentPage);
    }

    console.info('[TP-17][qrcode-view] 分区批量保存完成', {
      section: section.key,
      ...summary
    });
  } finally {
    section.savingDrafts = false;
  }
}

/**
 * 删除当前分区的已保存二维码。
 * 删除确认、删除状态和列表刷新都局限在对应分区内。
 * @param {string} sectionKey - 分区键
 * @param {object} item - 列表项
 */
async function handleDelete(sectionKey, item) {
  const section = getSection(sectionKey);
  const confirmed = window.confirm(`确认删除金额为 ￥${item.price} 的${section.label}二维码吗？`);

  if (!confirmed) {
    return;
  }

  section.deletingId = String(item.id);
  section.listError = '';
  section.listNotice = '';

  console.info('[TP-17][qrcode-view] 开始删除分区已保存二维码', {
    section: section.key,
    id: item.id,
    price: item.price
  });

  try {
    const result = await deletePayQrcode({
      id: item.id
    });

    if (!result.ok) {
      section.listError = result.message || `${section.label}二维码删除失败，请稍后重试`;
      console.warn('[TP-17][qrcode-view] 删除分区二维码失败', {
        section: section.key,
        id: item.id,
        message: result.message
      });
      return;
    }

    section.listNotice = `${section.label}二维码删除成功`;
    console.info('[TP-17][qrcode-view] 删除分区二维码成功', {
      section: section.key,
      id: item.id
    });
    await loadSavedList(sectionKey, section.currentPage);
  } catch (error) {
    section.listError = `${section.label}二维码删除失败，请稍后重试`;
    console.error('[TP-17][qrcode-view] 删除分区二维码异常', {
      section: section.key,
      id: item.id,
      message: error.message
    });
  } finally {
    section.deletingId = '';
  }
}

/**
 * 切换当前分区分页。
 * 微信和支付宝的页码独立维护，互不覆盖。
 * @param {string} sectionKey - 分区键
 * @param {number} page - 目标页码
 */
async function handlePageChange(sectionKey, page) {
  const section = getSection(sectionKey);

  if (page < 1 || page > getTotalPages(section) || page === section.currentPage) {
    return;
  }

  await loadSavedList(sectionKey, page);
}

/**
 * 手工刷新当前分区列表。
 * 只重查当前分区，不影响另一分区的分页与提示状态。
 * @param {string} sectionKey - 分区键
 */
async function handleRefreshList(sectionKey) {
  const section = getSection(sectionKey);
  section.listNotice = '';
  await loadSavedList(sectionKey, section.currentPage);
}

/**
 * 获取支付类型展示文案。
 * 统一处理类型到中文文案的映射。
 * @param {string} type - 支付类型
 * @returns {string} 支付类型中文名
 */
function getPaymentTypeLabel(type) {
  if (String(type) === PAYMENT_TYPE_MAP.wechat.type) {
    return PAYMENT_TYPE_MAP.wechat.label;
  }

  if (String(type) === PAYMENT_TYPE_MAP.alipay.type) {
    return PAYMENT_TYPE_MAP.alipay.label;
  }

  return '未识别类型';
}

/**
 * 生成草稿状态文案。
 * 解析成功后继续判断类型和金额是否已补全。
 * @param {object} draft - 草稿对象
 * @returns {string} 状态文案
 */
function getDraftStatusText(draft) {
  if (draft.status === 'parsing') {
    return '解析中';
  }

  if (draft.status === 'failed') {
    return '解析失败';
  }

  if (draft.status === 'queued' || draft.status === 'idle') {
    return '待解析';
  }

  if (!draft.type) {
    return '待选择类型';
  }

  if (getAmountError(draft.price)) {
    return '待录入金额';
  }

  return '可保存';
}

/**
 * 生成草稿状态样式类。
 * 用颜色辅助区分草稿的处理阶段和可保存程度。
 * @param {object} draft - 草稿对象
 * @returns {string} 样式类名
 */
function getDraftStatusClass(draft) {
  const statusText = getDraftStatusText(draft);

  if (statusText === '可保存') {
    return 'qrcode-status-badge--success';
  }

  if (statusText === '解析失败') {
    return 'qrcode-status-badge--danger';
  }

  if (statusText === '解析中') {
    return 'qrcode-status-badge--warning';
  }

  return 'qrcode-status-badge--muted';
}

/**
 * 生成草稿辅助提示文案。
 * 优先展示错误，再展示跨分区识别提示和金额缺失提示。
 * @param {object} section - 分区状态
 * @param {object} draft - 草稿对象
 * @returns {string} 提示文案
 */
function getDraftMessage(section, draft) {
  if (draft.errorMessage) {
    return draft.errorMessage;
  }

  if (draft.status === 'failed') {
    return '二维码解析失败，请重新上传更清晰的图片';
  }

  if (draft.status === 'parsing') {
    return `系统正在解析${section.label}二维码内容，请稍候`;
  }

  if (draft.status === 'queued' || draft.status === 'idle') {
    return '图片已加入草稿，等待开始解析';
  }

  if (draft.hintMessage) {
    return draft.hintMessage;
  }

  if (!draft.type) {
    return '已解析出二维码内容，请手工选择支付类型';
  }

  const amountError = getAmountError(draft.price);
  if (amountError) {
    return amountError;
  }

  return `二维码内容：${draft.payUrl}`;
}

onMounted(async () => {
  await Promise.all(sectionList.map((section) => loadSavedList(section.key, 1)));
});

onBeforeUnmount(() => {
  for (const section of sectionList) {
    for (const draft of section.drafts) {
      revokeDraftPreview(draft);
    }
  }
});
</script>
