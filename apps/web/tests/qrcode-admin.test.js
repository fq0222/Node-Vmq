/**
 * 二维码管理工具测试文件
 * 负责验证支付类型映射、草稿构建更新、金额校验、二维码摘要与批量保存汇总等纯函数行为。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inferPaymentTypeFromText,
  PAYMENT_TYPE_MAP,
  buildBatchSaveSummary,
  collectSavableDrafts,
  createDraftRecord,
  extractAmountFromFileName,
  getAmountError,
  summarizeQrcodeText,
  updateDraftRecord
} from '../src/utils/qrcode-admin.js';

test('支付类型映射应包含微信与支付宝配置', () => {
  assert.equal(PAYMENT_TYPE_MAP.wechat.label, '微信');
  assert.equal(PAYMENT_TYPE_MAP.wechat.type, '1');
  assert.equal(PAYMENT_TYPE_MAP.alipay.label, '支付宝');
  assert.equal(PAYMENT_TYPE_MAP.alipay.type, '2');
});

test('创建草稿对象应返回稳定默认值', () => {
  const draft = createDraftRecord();

  assert.equal(draft.draftId, '');
  assert.equal(draft.fileName, '');
  assert.equal(draft.type, '1');
  assert.equal(draft.price, '');
  assert.equal(draft.payUrl, '');
  assert.equal(draft.previewUrl, '');
  assert.equal(draft.qrcodeSummary, '');
  assert.equal(draft.status, 'idle');
  assert.equal(draft.errorMessage, '');
});

test('未知支付类型不应被静默归一化为微信', () => {
  const draft = createDraftRecord({
    type: '99'
  });

  assert.equal(draft.type, '99');
});

test('更新草稿对象应保留原值并刷新二维码摘要', () => {
  const draft = createDraftRecord({
    draftId: 'draft-1',
    price: '10'
  });

  const result = updateDraftRecord(draft, {
    payUrl: 'https://example.com/pay/1234567890',
    previewUrl: '/enQrcode?url=encoded-value',
    status: 'success'
  });

  assert.equal(result.draftId, 'draft-1');
  assert.equal(result.price, '10');
  assert.equal(result.status, 'success');
  assert.equal(result.previewUrl, '/enQrcode?url=encoded-value');
  assert.equal(result.qrcodeSummary, 'https://example.com/...');
});

test('更新草稿对象不应修改输入对象', () => {
  const draft = createDraftRecord({
    draftId: 'draft-1',
    type: '2',
    payUrl: 'ali://before',
    status: 'idle'
  });

  const result = updateDraftRecord(draft, {
    payUrl: 'ali://after',
    status: 'success'
  });

  assert.notEqual(result, draft);
  assert.equal(draft.payUrl, 'ali://before');
  assert.equal(draft.status, 'idle');
  assert.equal(result.payUrl, 'ali://after');
  assert.equal(result.status, 'success');
});

test('金额校验应覆盖空值非法字符零值与正常值', () => {
  assert.equal(getAmountError(''), '请输入金额');
  assert.equal(getAmountError('12a'), '金额格式不正确');
  assert.equal(getAmountError('0'), '金额必须大于0');
  assert.equal(getAmountError('10.50'), '');
});

test('应优先从二维码文件名中提取金额', () => {
  assert.equal(extractAmountFromFileName('微信68.01元码.png'), '68.01');
  assert.equal(extractAmountFromFileName('支付宝3.01元码.jpg'), '3.01');
  assert.equal(extractAmountFromFileName('wechat_100.png'), '100');
  assert.equal(extractAmountFromFileName('未命名收款码.png'), '');
});

test('长文本摘要应按最大长度截断', () => {
  const result = summarizeQrcodeText(
    'https://example.com/payment/qrcode/abcdefghijklmnopqrstuvwxyz',
    18
  );

  assert.equal(result, 'https://example...');
});

test('二维码内容应优先自动推断微信与支付宝类型', () => {
  assert.equal(inferPaymentTypeFromText('wxp://f2f0-demo'), '1');
  assert.equal(inferPaymentTypeFromText('https://qr.alipay.com/fkx-demo'), '2');
  assert.equal(inferPaymentTypeFromText('unknown://payment-demo'), '');
});

test('仅解析成功且金额合法的草稿可纳入保存列表', () => {
  const drafts = [
    createDraftRecord({
      draftId: 'draft-1',
      fileName: 'wechat-18.80.png',
      type: '1',
      price: '18.80',
      payUrl: 'wx://pay/ok',
      previewUrl: '/enQrcode?url=wx-pay-ok',
      status: 'success'
    }),
    createDraftRecord({
      draftId: 'draft-2',
      fileName: 'alipay-zero.png',
      type: '2',
      price: '0',
      payUrl: 'ali://pay/zero',
      previewUrl: '/enQrcode?url=ali-pay-zero',
      status: 'success'
    }),
    createDraftRecord({
      draftId: 'draft-3',
      fileName: 'wechat-pending.png',
      type: '1',
      price: '9.90',
      payUrl: 'wx://pay/pending',
      previewUrl: '/enQrcode?url=wx-pay-pending',
      status: 'parsing'
    }),
    createDraftRecord({
      draftId: 'draft-4',
      fileName: 'alipay-empty.png',
      type: '2',
      price: '20',
      payUrl: '',
      previewUrl: '',
      status: 'success'
    }),
    createDraftRecord({
      draftId: 'draft-5',
      fileName: 'unknown-type.png',
      type: '99',
      price: '20',
      payUrl: 'other://pay/unknown',
      previewUrl: '/enQrcode?url=unknown',
      status: 'success'
    })
  ];

  const result = collectSavableDrafts(drafts);

  assert.deepEqual(result, [
    {
      draftId: 'draft-1',
      type: '1',
      price: '18.80',
      payUrl: 'wx://pay/ok'
    }
  ]);
  assert.equal(drafts[4].type, '99');
});

test('筛选可保存草稿不应修改输入数组', () => {
  const drafts = [
    createDraftRecord({
      draftId: 'draft-1',
      type: '1',
      price: '18.80',
      payUrl: 'wx://pay/ok',
      status: 'success'
    })
  ];

  const result = collectSavableDrafts(drafts);

  assert.notEqual(result, drafts);
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].payUrl, 'wx://pay/ok');
});

test('批量保存结果汇总应统计成功失败与跳过数量', () => {
  const result = buildBatchSaveSummary([
    { status: 'success' },
    { status: 'success' },
    { status: 'failed' },
    { status: 'skipped' }
  ]);

  assert.deepEqual(result, {
    totalCount: 4,
    successCount: 2,
    failedCount: 1,
    skippedCount: 1,
    isAllSuccess: false,
    message: '共 4 条，成功 2 条，失败 1 条，跳过 1 条'
  });
});
