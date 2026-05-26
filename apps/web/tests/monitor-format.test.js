/**
 * 监控页格式化工具测试文件
 * 负责验证状态映射、时间格式化和绑定串生成行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMonitorStatus,
  formatMonitorTimestamp,
  buildMonitorBindingPayload
} from '../src/utils/monitor-format.js';

test('监控状态应映射为可读文案和风格类型', () => {
  assert.deepEqual(formatMonitorStatus('1'), {
    label: '在线',
    tone: 'success'
  });
  assert.deepEqual(formatMonitorStatus('0'), {
    label: '离线',
    tone: 'danger'
  });
  assert.deepEqual(formatMonitorStatus('-1'), {
    label: '未绑定',
    tone: 'muted'
  });
});

test('非法状态值应回退为未知状态', () => {
  assert.deepEqual(formatMonitorStatus('999'), {
    label: '未知状态',
    tone: 'muted'
  });
});

test('13 位时间戳应格式化为本地时间字符串', () => {
  const result = formatMonitorTimestamp('1779431415000');

  assert.equal(typeof result, 'string');
  assert.equal(result.includes('暂无记录'), false);
});

test('空时间戳应显示暂无记录', () => {
  assert.equal(formatMonitorTimestamp('0'), '暂无记录');
  assert.equal(formatMonitorTimestamp(''), '暂无记录');
});

test('绑定串应包含服务地址与通讯密钥', () => {
  const result = buildMonitorBindingPayload({
    apiBaseUrl: 'http://localhost:3000',
    key: 'admin-key'
  });

  assert.equal(result.apiBaseUrl, 'http://localhost:3000');
  assert.equal(result.host, 'localhost:3000');
  assert.equal(result.key, 'admin-key');
  assert.equal(result.encoded, 'localhost:3000/admin-key');
});
