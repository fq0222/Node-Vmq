/**
 * 监控页服务文件
 * 负责读取监控状态、整合系统设置并生成页面所需视图模型。
 */
import { getApiBaseUrl, requestJson } from './api-client.js';
import {
  buildMonitorBindingPayload,
  formatMonitorStatus,
  formatMonitorTimestamp
} from '../utils/monitor-format.js';

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

  return {
    state: String(settings.jkstate ?? settings.state ?? '0'),
    lastheart: String(settings.lastheart ?? '0'),
    lastpay: String(settings.lastpay ?? '0')
  };
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
    apiBaseUrl: input.apiBaseUrl || getApiBaseUrl(),
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

  return `${getApiBaseUrl()}/enQrcode?url=${encodeURIComponent(text)}`;
}
