/**
 * 系统设置服务文件
 * 负责封装系统设置读取、保存、二维码解析和预览地址生成逻辑。
 */
import { requestJson } from './api-client.js';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:3000';

/**
 * 读取系统设置
 * 调用后台受保护接口并返回设置对象。
 */
export async function fetchSettings(request = requestJson) {
  const result = await request('/admin/getSettings', {
    method: 'GET'
  });

  return result?.data || {};
}

/**
 * 保存系统设置
 * 将前端整理后的 payload 提交到后台保存接口。
 */
export async function saveSettings(payload, request = requestJson) {
  const result = await request('/admin/saveSetting', {
    method: 'POST',
    body: payload
  });

  return {
    ok: result?.code === 1,
    message: result?.msg || '保存成功'
  };
}

/**
 * 解析上传的二维码图片
 * 通过 multipart 请求调用后端二维码解析接口。
 */
export async function decodeQrcodeFromFile(file, request = requestJson) {
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

/**
 * 构建二维码预览地址
 * 文本存在时通过后端二维码生成接口输出图片地址。
 */
export function buildQrcodePreviewUrl(text) {
  if (!text) {
    return '';
  }

  return `${API_BASE_URL}/enQrcode?url=${encodeURIComponent(text)}`;
}
