/**
 * 监控页服务测试文件
 * 负责验证状态请求、配置读取和二维码地址生成行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchMonitorState,
  buildMonitorViewModel,
  buildMonitorQrcodePreviewUrl
} from '../src/services/monitor-service.js';

test('监控状态请求应直接读取后台设置中的监控状态字段', async () => {
  const calls = [];
  const request = async (path, options) => {
    calls.push({ path, options });

    if (path === '/admin/getSettings') {
      return {
        code: 1,
        msg: '成功',
        data: {
          key: 'admin-key',
          state: '1',
          lastheart: '1779431415000',
          lastpay: '1779431420000'
        }
      };
    }

    throw new Error(`unexpected path: ${path}`);
  };

  const result = await fetchMonitorState(request);

  assert.equal(calls[0].path, '/admin/getSettings');
  assert.equal(calls.length, 1);
  assert.equal(result.state, '1');
});

test('监控页面视图模型应合并状态与绑定配置', () => {
  const result = buildMonitorViewModel({
    state: {
      state: '0',
      lastheart: '0',
      lastpay: '1779431420000'
    },
    settings: {
      key: 'admin-key'
    },
    apiBaseUrl: 'http://localhost:3000'
  });

  assert.equal(result.status.label, '离线');
  assert.equal(result.binding.key, 'admin-key');
  assert.equal(result.binding.encoded, 'localhost:3000/admin-key');
  assert.equal(result.lastHeartText, '暂无记录');
});

test('二维码预览地址应拼接 enQrcode 接口', () => {
  const result = buildMonitorQrcodePreviewUrl('localhost:3000/admin-key');

  assert.equal(
    result,
    'http://localhost:3000/enQrcode?url=localhost%3A3000%2Fadmin-key'
  );
});
