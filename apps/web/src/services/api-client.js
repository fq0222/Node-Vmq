/**
 * API 基础地址
 * 允许通过环境变量覆盖，便于后续联调不同环境。
 */
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:3000';

let unauthorizedHandler = null;

/**
 * 注册未授权处理器
 * 后续真实登录接入后可在这里挂接统一退出逻辑。
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

/**
 * 统一发起 JSON 请求
 * 当前阶段重点是建立模式、日志和错误处理边界。
 */
export async function requestJson(path, options = {}) {
  const requestUrl = `${API_BASE_URL}${path}`;
  const hasBody = Object.prototype.hasOwnProperty.call(options, 'body');
  const isFormData =
    typeof FormData !== 'undefined' && hasBody && options.body instanceof FormData;
  const requestBody = hasBody && typeof options.body !== 'string'
    ? isFormData
      ? options.body
      : JSON.stringify(options.body)
    : options.body;

  console.info('[TP-14][api] 发起请求', {
    url: requestUrl,
    method: options.method || 'GET'
  });

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  const response = await fetch(requestUrl, {
    ...options,
    credentials: options.credentials || 'include',
    body: requestBody,
    headers
  });

  if (response.status === 401 && typeof unauthorizedHandler === 'function') {
    console.warn('[TP-14][api] 检测到未授权响应，准备执行统一处理');
    unauthorizedHandler();
  }

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    console.warn('[TP-14][api] 响应不是标准 JSON，将返回空数据', {
      message: error.message
    });
  }

  if (!response.ok) {
    const message = data?.message || `请求失败，状态码 ${response.status}`;
    console.error('[TP-14][api] 请求失败', {
      url: requestUrl,
      status: response.status,
      message
    });
    throw new Error(message);
  }

  return data;
}
