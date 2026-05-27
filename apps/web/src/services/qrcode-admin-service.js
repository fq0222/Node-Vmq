/**
 * 二维码管理服务文件
 * 负责封装固定金额二维码列表查询、新增、删除、图片解析与预览地址生成接口。
 */
import { getApiBaseUrl, requestJson } from './api-client.js';

/**
 * 查询固定金额二维码分页列表
 * @param {{page?: string|number, limit?: string|number, type?: string|number}} params - 分页与筛选参数
 * @param {(path: string, options?: Record<string, unknown>) => Promise<any>} request - 请求实现
 * @returns {Promise<{ok: boolean, message: string, count: number, rows: Array<Record<string, unknown>>}>} 列表结果
 */
export async function fetchPayQrcodePage(params = {}, request = requestJson) {
  const query = buildPayQrcodeQuery(params);
  const requestPath = `/admin/getPayQrcodes?${query}`;

  console.info('[TP-17][qrcode-admin-service] 开始查询二维码列表', {
    page: params.page,
    limit: params.limit,
    type: params.type
  });

  const result = await request(requestPath, {
    method: 'GET'
  });

  const rows = Array.isArray(result?.data)
    ? result.data.map((item) => ({
        id: item?.id,
        payUrl: String(item?.pay_url ?? item?.payUrl ?? ''),
        price: item?.price,
        type: item?.type
      }))
    : [];

  console.info('[TP-17][qrcode-admin-service] 二维码列表查询完成', {
    count: Number(result?.count || 0),
    rowCount: rows.length
  });

  return {
    ok: result?.code === 0,
    message: String(result?.msg ?? ''),
    count: Number(result?.count || 0),
    rows
  };
}

/**
 * 新增固定金额二维码
 * @param {{payUrl?: string, price?: string|number, type?: string|number}} payload - 新增参数
 * @param {(path: string, options?: Record<string, unknown>) => Promise<any>} request - 请求实现
 * @returns {Promise<{ok: boolean, message: string}>} 提交结果
 */
export async function createPayQrcode(payload, request = requestJson) {
  console.info('[TP-17][qrcode-admin-service] 开始新增二维码', {
    type: payload?.type,
    price: payload?.price
  });

  const result = await request('/admin/addPayQrcode', {
    method: 'POST',
    body: payload
  });

  return {
    ok: result?.code === 1,
    message: String(result?.msg ?? '')
  };
}

/**
 * 删除固定金额二维码
 * @param {{id?: string|number}} payload - 删除参数
 * @param {(path: string, options?: Record<string, unknown>) => Promise<any>} request - 请求实现
 * @returns {Promise<{ok: boolean, message: string}>} 删除结果
 */
export async function deletePayQrcode(payload, request = requestJson) {
  console.info('[TP-17][qrcode-admin-service] 开始删除二维码', {
    id: payload?.id
  });

  const result = await request('/admin/delPayQrcode', {
    method: 'POST',
    body: payload
  });

  return {
    ok: result?.code === 1,
    message: String(result?.msg ?? '')
  };
}

/**
 * 解析上传的二维码图片文件
 * @param {File|Blob|Record<string, unknown>} file - 待解析文件
 * @param {(path: string, options?: Record<string, unknown>) => Promise<any>} request - 请求实现
 * @returns {Promise<{ok: boolean, message: string, text: string}>} 解析结果
 */
export async function decodePayQrcodeFile(file, request = requestJson) {
  console.info('[TP-17][qrcode-admin-service] 开始解析二维码图片', {
    fileName: file?.name || ''
  });

  const formData = new FormData();
  formData.append('file', file);

  const result = await request('/deQrcode2', {
    method: 'POST',
    body: formData
  });

  return {
    ok: result?.code === 1,
    message: String(result?.msg ?? ''),
    text: String(result?.data ?? '')
  };
}

/**
 * 构建二维码预览地址
 * @param {string} text - 二维码内容文本
 * @returns {string} 预览图片地址
 */
export function buildPayQrcodePreviewUrl(text) {
  if (!text) {
    return '';
  }

  return `${getApiBaseUrl()}/enQrcode?url=${encodeURIComponent(text)}`;
}

/**
 * 构建二维码列表查询字符串
 * @param {{page?: string|number, limit?: string|number, type?: string|number}} params - 查询参数
 * @returns {string} 查询字符串
 */
function buildPayQrcodeQuery(params) {
  const searchParams = new URLSearchParams();
  const page = resolvePageParam(params?.page, 1);
  const limit = resolvePageParam(params?.limit, 20);

  searchParams.set('page', String(page));
  searchParams.set('limit', String(limit));

  if (params?.type !== undefined && params?.type !== null && String(params.type) !== '') {
    searchParams.set('type', String(params.type));
  }

  return searchParams.toString();
}

/**
 * 解析分页参数，避免把空字符串直接发送给后端。
 * @param {string|number|null|undefined} value - 原始分页值
 * @param {number} fallback - 默认值
 * @returns {string|number} 可用于 query string 的分页值
 */
function resolvePageParam(value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return fallback;
  }

  return value;
}
