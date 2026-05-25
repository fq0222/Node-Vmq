/**
 * 前端认证服务文件
 * 负责封装登录、退出登录和后台 session 探测请求。
 */
import { requestJson } from './api-client.js';

/**
 * 管理员登录
 * 统一向后端登录接口提交账号密码并解释业务响应。
 */
export async function loginAdmin(credentials, request = requestJson) {
  const result = await request('/login', {
    method: 'POST',
    body: {
      user: String(credentials.user || '').trim(),
      pass: String(credentials.pass || '').trim()
    }
  });

  return {
    ok: result?.code === 1,
    message: result?.msg || '登录失败，请重试'
  };
}

/**
 * 检查当前后台 session 是否有效
 * 通过受保护接口 /admin/session 作为轻量探测入口。
 */
export async function checkAdminSession(request = requestJson) {
  try {
    const result = await request('/admin/session', {
      method: 'GET'
    });

    return {
      loggedIn: result?.code === 1 && result?.data?.login === '1',
      message: ''
    };
  } catch (error) {
    return {
      loggedIn: false,
      message: '当前未登录'
    };
  }
}

/**
 * 退出管理员登录
 * 统一走后端退出接口，便于回收服务端 session。
 */
export async function logoutAdmin(request = requestJson) {
  const result = await request('/logout', {
    method: 'POST'
  });

  return {
    ok: result?.code === 1,
    message: result?.msg || '退出成功'
  };
}
