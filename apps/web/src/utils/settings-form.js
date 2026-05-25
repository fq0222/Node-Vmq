/**
 * 系统设置表单辅助文件
 * 负责生成默认表单、字段映射和最小前端校验。
 */

/**
 * 创建系统设置默认表单
 * 确保页面在加载前拥有完整字段结构。
 */
export function createDefaultSettingsForm() {
  return {
    user: '',
    pass: '',
    notifyUrl: '',
    returnUrl: '',
    key: '',
    close: '',
    payQf: '',
    wxpay: '',
    zfbpay: ''
  };
}

/**
 * 将接口设置对象映射为前端表单
 * 缺失字段统一回退为空字符串，避免模板访问异常。
 */
export function mapSettingsToForm(settings = {}) {
  return {
    ...createDefaultSettingsForm(),
    user: String(settings.user || ''),
    pass: String(settings.pass || ''),
    notifyUrl: String(settings.notifyUrl || ''),
    returnUrl: String(settings.returnUrl || ''),
    key: String(settings.key || ''),
    close: String(settings.close || ''),
    payQf: String(settings.payQf || ''),
    wxpay: String(settings.wxpay || ''),
    zfbpay: String(settings.zfbpay || '')
  };
}

/**
 * 将表单值映射为保存 payload
 * 保存前统一转换为字符串，便于与后端现有协议保持一致。
 */
export function mapFormToSettingsPayload(form) {
  return {
    user: String(form.user || '').trim(),
    pass: String(form.pass || ''),
    notifyUrl: String(form.notifyUrl || '').trim(),
    returnUrl: String(form.returnUrl || '').trim(),
    key: String(form.key || '').trim(),
    close: String(form.close || '').trim(),
    payQf: String(form.payQf || '').trim(),
    wxpay: String(form.wxpay || '').trim(),
    zfbpay: String(form.zfbpay || '').trim()
  };
}

/**
 * 校验系统设置表单
 * 仅保留与后端协议一致的最小前端校验规则。
 */
export function validateSettingsForm(form) {
  const errors = {};
  const urlPattern = /^https?:\/\/.+/i;

  if (!String(form.user || '').trim()) {
    errors.user = '请输入后台账号';
  }

  if (!String(form.pass || '')) {
    errors.pass = '请输入后台密码';
  }

  if (String(form.close || '').trim() && !/^\d+$/.test(String(form.close).trim())) {
    errors.close = '请输入有效的关闭分钟数';
  }

  if (String(form.notifyUrl || '').trim() && !urlPattern.test(String(form.notifyUrl).trim())) {
    errors.notifyUrl = '请输入有效的异步通知地址';
  }

  if (String(form.returnUrl || '').trim() && !urlPattern.test(String(form.returnUrl).trim())) {
    errors.returnUrl = '请输入有效的同步返回地址';
  }

  return errors;
}
