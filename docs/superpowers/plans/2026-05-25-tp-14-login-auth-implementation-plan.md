# TP-14 前端登录与鉴权页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `apps/web` 的占位登录页升级为真实后台登录与鉴权页，并基于后端 session 完成前端登录、会话探测、退出登录和路由拦截闭环。

**Architecture:** 保持后端 `express-session` 机制不变，在前端新增认证服务层统一封装 `/login`、`/logout` 和 `/admin/session` 探测；`auth store` 切换为 session 同步模式，应用启动时先完成会话探测，再挂载路由守卫和页面。登录页使用真实表单和表单内联错误提示，顶部栏提供真实退出登录入口。

**Tech Stack:** Vue 3、Pinia、Vue Router、Vite、Node.js 内置 `node:test`

---

### Task 1: 认证服务测试与封装

**Files:**
- Create: `apps/web/src/services/auth-service.js`
- Create: `apps/web/tests/auth-service.test.js`

- [ ] **Step 1: 先写认证服务失败测试**

验证三类行为：

- `loginAdmin` 向 `/login` 发送 `POST`
- `checkAdminSession` 请求 `/admin/session` 并判断 session 是否有效
- `logoutAdmin` 请求 `/logout`

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test apps/web/tests/auth-service.test.js`  
Expected: FAIL，提示 `auth-service.js` 不存在或导出缺失

- [ ] **Step 3: 实现最小认证服务**

服务层只负责接口调用与响应解释，不承担视图逻辑。

- [ ] **Step 4: 重跑测试并确认通过**

Run: `node --test apps/web/tests/auth-service.test.js`  
Expected: PASS

### Task 2: 路由守卫与登录态逻辑测试

**Files:**
- Modify: `apps/web/src/router/guards.js`
- Modify: `apps/web/tests/router-guards.test.js`

- [ ] **Step 1: 扩展守卫测试**

补充以下场景：

- 已登录访问 `/login` 会被跳转
- 未登录访问受保护页面会被拦截
- 已登录访问受保护页面可通过

保留纯逻辑测试，不依赖浏览器环境。

- [ ] **Step 2: 运行守卫测试，必要时先看红灯**

Run: `node --test apps/web/tests/router-guards.test.js`  
Expected: 如果接口签名调整则先失败，再进入实现

- [ ] **Step 3: 调整守卫实现**

守卫不再依赖本地 token 工具，而是改为读取 `auth store` 的真实状态。

- [ ] **Step 4: 重跑守卫测试并确认通过**

Run: `node --test apps/web/tests/router-guards.test.js`  
Expected: PASS

### Task 3: auth store 切换到 session 同步模型

**Files:**
- Modify: `apps/web/src/stores/auth.js`
- Modify: `apps/web/src/main.js`
- Modify: `apps/web/src/services/api-client.js`

- [ ] **Step 1: 改造 auth store 状态结构**

至少包含：

- `loggedIn`
- `loading`
- `errorMessage`
- `bootstrapped`

- [ ] **Step 2: 接入认证服务动作**

至少实现：

- `bootstrap()`
- `syncSession()`
- `login(credentials)`
- `logout()`
- `markLoggedOut(message)`

- [ ] **Step 3: 在 main.js 中先完成会话探测再挂载应用**

应用初始化时先调用 `authStore.bootstrap()`，确保页面首次进入时登录态可信。

- [ ] **Step 4: 为请求层补齐带凭证请求与 401 统一处理**

`requestJson()` 默认带 `credentials: 'include'`，并通过统一处理器回传会话失效。

### Task 4: 实现真实登录页与退出登录入口

**Files:**
- Modify: `apps/web/src/views/LoginView.vue`
- Modify: `apps/web/src/components/admin/AdminTopbar.vue`
- Modify: `apps/web/src/styles/global.css`

- [ ] **Step 1: 替换占位登录页为真实表单**

字段：

- `user`
- `pass`

行为：

- 提交中禁用
- 失败时内联错误提示
- 成功后跳转 `/dashboard`

- [ ] **Step 2: 将顶部栏退出按钮改为真实退出登录**

调用后端 `/logout`，清理前端状态，跳转 `/login`

- [ ] **Step 3: 补齐登录页表单样式**

保持与 `TP-13` 后台视觉一致，避免退回脚手架风格。

### Task 5: 验证与收尾

**Files:**
- Verify: `apps/web/tests/auth-service.test.js`
- Verify: `apps/web/tests/router-guards.test.js`
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

- [ ] **Step 4: 手工核对需求闭环**

确认：

- 正确账号密码可登录
- 错误账号密码有内联提示
- 未登录访问后台页被拦截
- 已登录访问登录页自动回跳
- 退出登录后后台页再次受保护

## Self-Review

- 规格覆盖：已覆盖真实登录、session 探测、退出登录、路由守卫、登录页交互和验证闭环
- 占位词检查：无 TBD / TODO / implement later
- 命名一致性：`loginAdmin`、`logoutAdmin`、`checkAdminSession`、`markLoggedOut`、`syncSession` 保持统一
