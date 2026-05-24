/**
 * shared 包统一导出入口
 * 方便后续按统一方式引用共享模块
 */

const { WORKSPACE_NAME, CURRENT_STAGE } = require('./constants/system');

module.exports = {
  WORKSPACE_NAME,
  CURRENT_STAGE
};
