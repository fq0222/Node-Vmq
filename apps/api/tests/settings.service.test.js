/**
 * TP-05 系统设置服务测试
 * 先定义系统设置读写与菜单兼容行为，再补最小实现
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getSettings,
  saveEditableSettings,
  buildAdminMenu
} = require('../src/services/settings.service');

test('读取系统设置时应返回 settings 表中的全部键值', async () => {
  const result = await getSettings({
    getAllSettings: async () => ([
      { key: 'user', value: 'admin' },
      { key: 'pass', value: 'admin' },
      { key: 'lastheart', value: '1779431409000' }
    ])
  });

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: {
      user: 'admin',
      pass: 'admin',
      lastheart: '1779431409000'
    }
  });
});

test('保存系统设置时应只写入白名单字段', async () => {
  const savedEntries = [];

  const result = await saveEditableSettings({
    user: 'admin2',
    pass: 'pass2',
    notifyUrl: 'https://merchant.example.com/notify',
    returnUrl: 'https://merchant.example.com/return',
    key: 'secret-key',
    wxpay: 'wxp://123',
    zfbpay: 'https://qr.example.com/a',
    close: '10',
    payQf: '1',
    lastheart: 'should-not-save'
  }, {
    saveSettingValue: async (key, value) => {
      savedEntries.push({ key, value });
    }
  });

  assert.deepEqual(savedEntries, [
    { key: 'user', value: 'admin2' },
    { key: 'pass', value: 'pass2' },
    { key: 'notifyUrl', value: 'https://merchant.example.com/notify' },
    { key: 'returnUrl', value: 'https://merchant.example.com/return' },
    { key: 'key', value: 'secret-key' },
    { key: 'wxpay', value: 'wxp://123' },
    { key: 'zfbpay', value: 'https://qr.example.com/a' },
    { key: 'close', value: '10' },
    { key: 'payQf', value: '1' }
  ]);

  assert.deepEqual(result, {
    code: 1,
    msg: '成功',
    data: null
  });
});

test('获取后台菜单时应返回旧版兼容结构', () => {
  const result = buildAdminMenu(1779431415000);

  assert.equal(Array.isArray(result), true);
  assert.deepEqual(result[0], {
    name: '系统设置',
    type: 'url',
    url: 'admin/setting.html?t=1779431415000'
  });
  assert.equal(result[1].name, '监控端设置');
  assert.equal(result[2].name, '微信二维码');
  assert.equal(result[3].name, '支付宝二维码');
});
