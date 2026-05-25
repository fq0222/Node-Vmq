/**
 * 金额规则模块
 * 集中处理金额格式化、步进计算和占位键构造
 */

/**
 * 将金额输入转成分
 * 使用整数运算，避免 JavaScript 浮点误差
 * @param {string | number} amount - 金额
 * @returns {number} 金额对应的分
 */
function amountToCents(amount) {
  const normalized = String(amount).trim();

  if (!/^[-+]?\d+(\.\d+)?$/.test(normalized)) {
    throw new Error(`非法金额：${amount}`);
  }

  const negative = normalized.startsWith('-');
  const pureValue = negative ? normalized.slice(1) : normalized;
  const [integerPart, decimalPart = ''] = pureValue.split('.');
  const paddedDecimal = `${decimalPart}000`;
  const twoDigitsDecimal = paddedDecimal.slice(0, 2);
  const roundingDigit = Number(paddedDecimal[2]);
  let cents = Number(integerPart) * 100 + Number(twoDigitsDecimal);

  // 第三位小数大于等于 5 时执行四舍五入，保证金额格式化符合常规金融展示习惯
  if (roundingDigit >= 5) {
    cents += 1;
  }

  return negative ? cents * -1 : cents;
}

/**
 * 将分转成标准两位小数字符串
 * @param {number} cents - 分
 * @returns {string} 标准化金额字符串
 */
function centsToAmount(cents) {
  const negative = cents < 0;
  const absoluteCents = Math.abs(cents);
  const integerPart = Math.floor(absoluteCents / 100);
  const decimalPart = String(absoluteCents % 100).padStart(2, '0');

  return `${negative ? '-' : ''}${integerPart}.${decimalPart}`;
}

/**
 * 统一格式化金额
 * @param {string | number} amount - 原始金额
 * @returns {string} 两位小数字符串
 */
function formatAmount(amount) {
  return centsToAmount(amountToCents(amount));
}

/**
 * 按 0.01 递增金额
 * @param {string | number} amount - 原始金额
 * @returns {string} 递增后的标准金额
 */
function addAmountStep(amount) {
  return centsToAmount(amountToCents(amount) + 1);
}

/**
 * 按 0.01 递减金额
 * @param {string | number} amount - 原始金额
 * @returns {string} 递减后的标准金额
 */
function subtractAmountStep(amount) {
  return centsToAmount(amountToCents(amount) - 1);
}

/**
 * 构建金额占位键
 * 规则：type-reallyPrice
 * @param {number} type - 支付方式
 * @param {string | number} reallyPrice - 实际支付金额
 * @returns {string} 占位键
 */
function buildPriceKey(type, reallyPrice) {
  return `${type}-${formatAmount(reallyPrice)}`;
}

module.exports = {
  amountToCents,
  centsToAmount,
  formatAmount,
  addAmountStep,
  subtractAmountStep,
  buildPriceKey
};
