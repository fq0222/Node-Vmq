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
 * @returns {{apiBaseUrl: string, host: string, key: string, encoded: string}} 绑定串结果
 */
export function buildMonitorBindingPayload(input) {
  const apiBaseUrl = String(input.apiBaseUrl || '').trim();
  const key = String(input.key || '').trim();
  const host = apiBaseUrl
    ? new URL(apiBaseUrl).host
    : '';
  const payload = {
    apiBaseUrl,
    host,
    key
  };

  return {
    ...payload,
    encoded: payload.host && payload.key
      ? `${payload.host}/${payload.key}`
      : ''
  };
}
