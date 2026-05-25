# TP-15 前端系统设置页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将系统设置页从占位页升级为真实业务页，完成设置读取、编辑保存、二维码文本预览和图片解析回填闭环。

**Architecture:** 在前端新增设置服务层和表单辅助模块，分别承担接口调用与字段映射/校验职责；页面层复用已有后台结构组件，只负责状态编排和用户交互。二维码文本预览通过生成 `/enQrcode` 地址完成，图片上传解析通过 `/deQrcode2` 完成，并将结果回写表单。

**Tech Stack:** Vue 3、Pinia、Vue Router、Vite、Node.js 内置 `node:test`

---

### Task 1: 设置服务与表单辅助测试

**Files:**
- Create: `apps/web/tests/settings-service.test.js`
- Create: `apps/web/tests/settings-form.test.js`
- Create: `apps/web/src/services/settings-service.js`
- Create: `apps/web/src/utils/settings-form.js`

- [ ] **Step 1: 先写设置服务失败测试**

覆盖：

- 读取设置接口路径
- 保存设置接口路径与方法
- 二维码图片解析请求形态
- 二维码预览地址拼接

- [ ] **Step 2: 先写表单辅助失败测试**

覆盖：

- 默认表单值生成
- 接口数据到表单值映射
- 表单值到保存 payload 映射
- 基础校验逻辑

- [ ] **Step 3: 运行测试并确认失败**

Run: `node --test apps/web/tests/settings-service.test.js apps/web/tests/settings-form.test.js`  
Expected: FAIL，提示新模块不存在或导出缺失

- [ ] **Step 4: 实现最小服务与表单辅助模块**

仅实现测试覆盖所需最小能力，不提前堆功能。

- [ ] **Step 5: 重跑测试并确认通过**

Run: `node --test apps/web/tests/settings-service.test.js apps/web/tests/settings-form.test.js`  
Expected: PASS

### Task 2: 接入系统设置服务与页面数据流

**Files:**
- Modify: `apps/web/src/views/admin/SettingsView.vue`
- Modify: `apps/web/src/services/api-client.js`

- [ ] **Step 1: 在页面初始化时读取设置**

进入页面即加载设置，成功后回填表单并生成二维码预览。

- [ ] **Step 2: 接入保存逻辑**

点击保存时调用后端保存接口，保存中禁用主按钮并展示反馈。

- [ ] **Step 3: 接入二维码文本预览逻辑**

文本存在时即时生成预览地址，文本清空时同步清空预览。

### Task 3: 接入二维码图片解析与回填

**Files:**
- Modify: `apps/web/src/views/admin/SettingsView.vue`
- Modify: `apps/web/src/services/settings-service.js`

- [ ] **Step 1: 实现微信二维码图片上传解析**

上传成功后回填微信二维码文本并刷新预览。

- [ ] **Step 2: 实现支付宝二维码图片上传解析**

上传成功后回填支付宝二维码文本并刷新预览。

- [ ] **Step 3: 区分当前区块的错误与成功反馈**

每个二维码区块单独提示，避免相互污染。

### Task 4: 页面结构与样式收口

**Files:**
- Modify: `apps/web/src/views/admin/SettingsView.vue`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: 将页面结构替换为真实表单布局**

页面分为基础配置区、二维码配置区、预览与保存区。

- [ ] **Step 2: 补齐输入、上传、预览和反馈样式**

保持与当前后台风格一致，去掉所有开发指导性文案。

### Task 5: 验证与收尾

**Files:**
- Verify: `apps/web/tests/settings-service.test.js`
- Verify: `apps/web/tests/settings-form.test.js`
- Verify: `apps/web/src/**/*.js`
- Verify: `apps/web/src/**/*.vue`

- [ ] **Step 1: 运行前端测试**

Run: `npm.cmd run test:web`  
Expected: PASS

- [ ] **Step 2: 运行前端语法检查**

Run: `npm.cmd run check:web`  
Expected: PASS

- [ ] **Step 3: 运行前端生产构建**

Run: `npm.cmd run build -w apps/web`  
Expected: PASS

- [ ] **Step 4: 手工核对验收点**

确认：

- 设置可读取
- 设置可保存
- 二维码可预览
- 图片可解析并回填
- 页面不含开发指导性文案

## Self-Review

- 规格覆盖：已覆盖读取、保存、二维码文本预览、图片解析、样式收口和验证闭环
- 占位词检查：无 TBD / TODO / implement later
- 命名一致性：`fetchSettings`、`saveSettings`、`decodeQrcodeFromFile`、`buildQrcodePreviewUrl`、`mapSettingsToForm` 命名保持统一
