/**
 * 数据库迁移模块
 * 负责执行 TP-02 阶段的基础建表脚本
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../utils/logger');

const logger = createLogger('api:db:migrator');

/**
 * 读取 SQL 文件内容
 * @param {string} filePath - SQL 文件绝对路径
 * @returns {string} SQL 内容
 */
function readSqlFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 获取迁移文件列表
 * @returns {string[]} 迁移文件绝对路径数组
 */
function getMigrationFiles() {
  /**
   * 当前文件位于 apps/api/src/database
   * 需要回退到仓库根目录，再进入 database/migrations
   */
  const migrationsDir = path.resolve(__dirname, '../../../../database/migrations');

  return fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort()
    .map((fileName) => path.join(migrationsDir, fileName));
}

/**
 * 执行数据库迁移
 * 这里采用顺序执行，保证结构初始化过程稳定可追踪
 * @param {import('pg').Pool} pool - 数据库连接池
 * @returns {Promise<void>}
 */
async function runMigrations(pool) {
  const migrationFiles = getMigrationFiles();

  if (migrationFiles.length === 0) {
    logger.warn('未发现迁移文件，跳过数据库迁移');
    return;
  }

  for (const filePath of migrationFiles) {
    const sql = readSqlFile(filePath);
    const fileName = path.basename(filePath);

    // 每个迁移文件执行前后都打印日志，便于定位具体失败位置
    logger.info(`开始执行迁移文件：${fileName}`);
    await pool.query(sql);
    logger.info(`迁移文件执行完成：${fileName}`);
  }
}

module.exports = {
  runMigrations
};
