/**
 * 系统设置表单辅助测试文件
 * 负责验证默认值、字段映射和基础校验逻辑。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDefaultSettingsForm,
  mapFormToSettingsPayload,
  mapSettingsToForm,
  validateSettingsForm
} from '../src/utils/settings-form.js';

test('应生成完整的默认表单结构', () => {
  const form = createDefaultSettingsForm();

  assert.deepEqual(form, {
    user: '',
    pass: '',
    notifyUrl: '',
    returnUrl: '',
    key: '',
    close: '',
    payQf: '',
    wxpay: '',
    zfbpay: ''
  });
});

test('应将接口设置映射为前端表单结构', () => {
  const form = mapSettingsToForm({
    user: 'admin',
    notifyUrl: 'https://notify.example.com',
    wxpay: 'wxp://wechat'
  });

  assert.equal(form.user, 'admin');
  assert.equal(form.notifyUrl, 'https://notify.example.com');
  assert.equal(form.wxpay, 'wxp://wechat');
  assert.equal(form.zfbpay, '');
});

test('应将表单映射为保存 payload', () => {
  const payload = mapFormToSettingsPayload({
    user: 'admin',
    pass: '123456',
    close: '15',
    payQf: '1',
    wxpay: 'wxp://wechat',
    zfbpay: 'alipay://code'
  });

  assert.deepEqual(payload, {
    user: 'admin',
    pass: '123456',
    notifyUrl: '',
    returnUrl: '',
    key: '',
    close: '15',
    payQf: '1',
    wxpay: 'wxp://wechat',
    zfbpay: 'alipay://code'
  });
});

test('金额区分模式应保留递增和递减两种取值', () => {
  const increasePayload = mapFormToSettingsPayload({
    ...createDefaultSettingsForm(),
    payQf: '1'
  });
  const decreasePayload = mapFormToSettingsPayload({
    ...createDefaultSettingsForm(),
    payQf: '2'
  });

  assert.equal(increasePayload.payQf, '1');
  assert.equal(decreasePayload.payQf, '2');
});

test('缺少后台账号时应返回校验错误', () => {
  const errors = validateSettingsForm({
    ...createDefaultSettingsForm(),
    pass: '123456'
  });

  assert.equal(errors.user, '请输入后台账号');
});

test('close 不是数字时应返回校验错误', () => {
  const errors = validateSettingsForm({
    ...createDefaultSettingsForm(),
    user: 'admin',
    pass: '123456',
    close: 'abc'
  });

  assert.equal(errors.close, '请输入有效的关闭分钟数');
});

test('notifyUrl 不是有效地址时应返回校验错误', () => {
  const errors = validateSettingsForm({
    ...createDefaultSettingsForm(),
    user: 'admin',
    pass: '123456',
    notifyUrl: 'not-a-url'
  });

  assert.equal(errors.notifyUrl, '请输入有效的异步通知地址');
});
