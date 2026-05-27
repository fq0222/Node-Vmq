/**
 * 二维码管理工具文件
 * 负责封装支付类型映射、草稿构建更新、金额校验、二维码摘要与批量保存汇总等纯函数逻辑。
 */

/**
 * 支付类型映射表。
 * `type` 字段直接对齐后端保存接口所需的渠道值。
 */
export const PAYMENT_TYPE_MAP = {
  wechat: {
    key: 'wechat',
    label: '微信',
    type: '1'
  },
  alipay: {
    key: 'alipay',
    label: '支付宝',
    type: '2'
  }
};

/**
 * 创建二维码草稿记录。
 * @param {PartialDraft} [overrides={}] - 需要覆盖的默认字段。
 * @returns {DraftRecord} 标准化草稿对象。
 */
export function createDraftRecord(overrides = {}) {
  const resolvedType = resolveDraftType(
    overrides.type ?? overrides.paymentType ?? '1'
  );
  const draft = {
    draftId: String(overrides.draftId ?? overrides.id ?? ''),
    fileName: String(overrides.fileName ?? ''),
    type: resolvedType,
    price: String(overrides.price ?? overrides.amount ?? ''),
    payUrl: String(overrides.payUrl ?? overrides.qrcodeText ?? ''),
    previewUrl: String(overrides.previewUrl ?? ''),
    qrcodeSummary: '',
    status: String(overrides.status ?? overrides.parseStatus ?? 'idle'),
    errorMessage: String(overrides.errorMessage ?? overrides.parseError ?? '')
  };

  return {
    ...draft,
    qrcodeSummary: summarizeQrcodeText(draft.payUrl, 23)
  };
}

/**
 * 更新二维码草稿记录。
 * @param {DraftRecord} draft - 旧草稿。
 * @param {PartialDraft} patch - 需要更新的字段。
 * @returns {DraftRecord} 更新后的草稿对象。
 */
export function updateDraftRecord(draft, patch) {
  return createDraftRecord({
    ...draft,
    ...patch
  });
}

/**
 * 校验金额输入是否合法。
 * @param {string | number | null | undefined} value - 用户输入金额。
 * @returns {string} 错误信息，空字符串表示合法。
 */
export function getAmountError(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return '请输入金额';
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return '金额格式不正确';
  }

  if (Number(normalized) <= 0) {
    return '金额必须大于0';
  }

  return '';
}

/**
 * 从二维码图片文件名中提取金额。
 * 优先识别带小数的金额，其次识别纯整数金额；若未命中则返回空字符串。
 * @param {string | null | undefined} fileName - 原始文件名
 * @returns {string} 可直接回填到金额输入框的金额字符串
 */
export function extractAmountFromFileName(fileName) {
  const normalized = String(fileName ?? '').trim();

  if (!normalized) {
    return '';
  }

  const decimalMatch = normalized.match(/(\d+\.\d{1,2})/);
  if (decimalMatch?.[1] && !getAmountError(decimalMatch[1])) {
    return decimalMatch[1];
  }

  const integerMatch = normalized.match(/(\d+)/);
  if (integerMatch?.[1] && !getAmountError(integerMatch[1])) {
    return integerMatch[1];
  }

  return '';
}

/**
 * 生成二维码文本摘要。
 * @param {string | null | undefined} text - 原始二维码文本。
 * @param {number} [maxLength=24] - 摘要最大长度。
 * @returns {string} 可直接展示的摘要文本。
 */
export function summarizeQrcodeText(text, maxLength = 24) {
  const normalized = String(text ?? '').trim();

  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(maxLength - 3, 0))}...`;
}

/**
 * 根据二维码内容推断支付类型。
 * 优先识别微信与支付宝常见协议头，无法识别时返回空字符串交由页面手工选择。
 * @param {string | null | undefined} text - 二维码解析出的原始内容
 * @returns {string} 推断出的支付类型，`1` 为微信，`2` 为支付宝，空字符串表示未知
 */
export function inferPaymentTypeFromText(text) {
  const normalized = String(text ?? '').trim().toLowerCase();

  if (!normalized) {
    return '';
  }

  if (
    normalized.startsWith('wxp://') ||
    normalized.startsWith('weixin://') ||
    normalized.includes('wxpay') ||
    normalized.includes('weixin')
  ) {
    return PAYMENT_TYPE_MAP.wechat.type;
  }

  if (
    normalized.startsWith('alipays://') ||
    normalized.includes('qr.alipay.com') ||
    normalized.includes('alipay')
  ) {
    return PAYMENT_TYPE_MAP.alipay.type;
  }

  return '';
}

/**
 * 收集允许保存的草稿。
 * 仅保留解析成功、金额合法且二维码文本非空的草稿。
 * @param {DraftRecord[]} drafts - 待筛选草稿列表。
 * @returns {SavableDraft[]} 可直接进入保存流程的草稿。
 */
export function collectSavableDrafts(drafts) {
  const source = Array.isArray(drafts) ? drafts : [];

  return source.reduce((result, draft) => {
    const amountError = getAmountError(draft.price);

    if (draft.status !== 'success') {
      return result;
    }

    if (amountError) {
      return result;
    }

    if (!String(draft.payUrl || '').trim()) {
      return result;
    }

    if (!isSupportedPaymentType(draft.type)) {
      return result;
    }

    result.push({
      draftId: String(draft.draftId ?? '').trim(),
      type: resolveDraftType(draft.type),
      price: String(draft.price ?? '').trim(),
      payUrl: String(draft.payUrl ?? '').trim()
    });

    return result;
  }, []);
}

/**
 * 解析草稿支付类型。
 * 同时兼容旧的 wechat/alipay 命名与新的 1/2 后端值；未知值原样保留给上层判断。
 * @param {string | number | null | undefined} value - 原始支付类型。
 * @returns {string} 解析后的支付类型。
 */
function resolveDraftType(value) {
  const normalized = String(value ?? '').trim();

  if (normalized === PAYMENT_TYPE_MAP.wechat.key || normalized === PAYMENT_TYPE_MAP.wechat.type) {
    return PAYMENT_TYPE_MAP.wechat.type;
  }

  if (normalized === PAYMENT_TYPE_MAP.alipay.key || normalized === PAYMENT_TYPE_MAP.alipay.type) {
    return PAYMENT_TYPE_MAP.alipay.type;
  }

  return normalized;
}

/**
 * 判断支付类型是否受支持。
 * @param {string | number | null | undefined} value - 待判断的支付类型。
 * @returns {boolean} 是否为当前支持的支付类型。
 */
function isSupportedPaymentType(value) {
  return value === PAYMENT_TYPE_MAP.wechat.type || value === PAYMENT_TYPE_MAP.alipay.type;
}

/**
 * 汇总批量保存结果。
 * @param {{status: string}[]} results - 每条草稿的保存结果。
 * @returns {{
 *   totalCount: number,
 *   successCount: number,
 *   failedCount: number,
 *   skippedCount: number,
 *   isAllSuccess: boolean,
 *   message: string
 * }} 汇总结果。
 */
export function buildBatchSaveSummary(results) {
  const source = Array.isArray(results) ? results : [];
  const summary = {
    totalCount: source.length,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0
  };

  for (const item of source) {
    if (item?.status === 'success') {
      summary.successCount += 1;
      continue;
    }

    if (item?.status === 'skipped') {
      summary.skippedCount += 1;
      continue;
    }

    summary.failedCount += 1;
  }

  const result = {
    ...summary,
    isAllSuccess: summary.totalCount > 0 && summary.failedCount === 0 && summary.skippedCount === 0,
    message: `共 ${summary.totalCount} 条，成功 ${summary.successCount} 条，失败 ${summary.failedCount} 条，跳过 ${summary.skippedCount} 条`
  };

  return result;
}

/**
 * @typedef {Object} DraftRecord
 * @property {string} draftId - 草稿标识。
 * @property {string} fileName - 原始文件名。
 * @property {string} type - 支付类型。
 * @property {string} price - 金额字符串。
 * @property {string} payUrl - 解析后的二维码文本。
 * @property {string} previewUrl - 页面预览地址。
 * @property {string} qrcodeSummary - 用于页面展示的摘要文本。
 * @property {string} status - 解析状态。
 * @property {string} errorMessage - 解析失败原因。
 */

/**
 * @typedef {Partial<DraftRecord>} PartialDraft
 */

/**
 * @typedef {Object} SavableDraft
 * @property {string} draftId - 草稿标识。
 * @property {string} type - 支付类型。
 * @property {string} price - 合法金额。
 * @property {string} payUrl - 可保存的二维码文本。
 */
