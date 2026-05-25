# TP-13 前端后台框架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `apps/web` 搭建具备现代化 SaaS 仪表盘风格的前端后台框架，提供后台布局、受保护路由、登录态守卫、全局状态、请求基础层和占位业务页。

**Architecture:** 在现有 Vue 3 + Pinia + Vue Router 基础上，先把可测试的路由守卫与登录态存储逻辑抽为纯 JavaScript 模块，通过测试驱动锁定行为；随后引入统一后台布局、导航配置、基础 UI 容器组件和占位页，最终通过语法检查与生产构建验证整体框架可运行。

**Tech Stack:** Vue 3、Pinia、Vue Router、Vite、Node.js 内置 `node:test`

---

### Task 1: 计划落地与目录骨架

**Files:**
- Create: `docs/superpowers/plans/2026-05-25-tp-13-admin-framework-implementation-plan.md`
- Modify: `apps/web/src/router/index.js`
- Create: `apps/web/src/router/route-meta.js`
- Create: `apps/web/src/config/admin-navigation.js`

- [ ] **Step 1: 明确后台路由与导航配置文件职责**

新增纯配置文件，避免把路由元信息、导航文案和守卫逻辑全部塞进一个入口文件：

```js
// apps/web/src/router/route-meta.js
export const ROUTE_META = {
  PUBLIC: 'public',
  PROTECTED: 'protected'
};
```

```js
// apps/web/src/config/admin-navigation.js
export const ADMIN_NAVIGATION = [
  {
    title: '总览',
    items: [{ name: 'dashboard', label: 'Dashboard', to: '/dashboard' }]
  }
];
```

- [ ] **Step 2: 保持 `router/index.js` 只做组装**

目标是让最终路由入口只负责导入页面、注册守卫和导出 router：

```js
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { registerAuthGuard } from './guards';

const router = createRouter({
  history: createWebHistory(),
  routes
});

registerAuthGuard(router);

export default router;
```

### Task 2: 为登录态存储与守卫逻辑编写失败测试

**Files:**
- Create: `apps/web/src/constants/auth.js`
- Create: `apps/web/src/utils/auth-storage.js`
- Create: `apps/web/src/router/guards.js`
- Create: `apps/web/tests/auth-storage.test.js`
- Create: `apps/web/tests/router-guards.test.js`

- [ ] **Step 1: 先写登录态存储失败测试**

```js
// apps/web/tests/auth-storage.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearAuthToken,
  getAuthToken,
  isAuthenticated,
  setAuthToken
} from '../src/utils/auth-storage.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    }
  };
}

test('未写入 token 时应视为未登录', () => {
  const storage = createMemoryStorage();

  assert.equal(getAuthToken(storage), '');
  assert.equal(isAuthenticated(storage), false);
});

test('写入 token 后应能读取并视为已登录', () => {
  const storage = createMemoryStorage();

  setAuthToken(storage, 'vmq-token');

  assert.equal(getAuthToken(storage), 'vmq-token');
  assert.equal(isAuthenticated(storage), true);
});

test('清理 token 后应恢复未登录状态', () => {
  const storage = createMemoryStorage();

  setAuthToken(storage, 'vmq-token');
  clearAuthToken(storage);

  assert.equal(getAuthToken(storage), '');
  assert.equal(isAuthenticated(storage), false);
});
```

- [ ] **Step 2: 运行登录态测试并确认失败**

Run: `node --test apps/web/tests/auth-storage.test.js`  
Expected: FAIL，提示 `auth-storage.js` 模块不存在或导出缺失

- [ ] **Step 3: 先写路由守卫失败测试**

```js
// apps/web/tests/router-guards.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRouteAccess } from '../src/router/guards.js';
import { ROUTE_META } from '../src/router/route-meta.js';

test('未登录访问受保护页面时应跳转到登录页', () => {
  const result = evaluateRouteAccess({
    isLoggedIn: false,
    to: { path: '/dashboard', meta: { access: ROUTE_META.PROTECTED } }
  });

  assert.deepEqual(result, {
    allow: false,
    redirectTo: '/login'
  });
});

test('已登录访问登录页时应跳转到 dashboard', () => {
  const result = evaluateRouteAccess({
    isLoggedIn: true,
    to: { path: '/login', meta: { access: ROUTE_META.PUBLIC } }
  });

  assert.deepEqual(result, {
    allow: false,
    redirectTo: '/dashboard'
  });
});

test('已登录访问受保护页面时应允许通过', () => {
  const result = evaluateRouteAccess({
    isLoggedIn: true,
    to: { path: '/orders', meta: { access: ROUTE_META.PROTECTED } }
  });

  assert.deepEqual(result, {
    allow: true,
    redirectTo: ''
  });
});
```

- [ ] **Step 4: 运行守卫测试并确认失败**

Run: `node --test apps/web/tests/router-guards.test.js`  
Expected: FAIL，提示 `guards.js` 模块不存在或导出缺失

### Task 3: 实现登录态工具与守卫逻辑

**Files:**
- Create: `apps/web/src/constants/auth.js`
- Create: `apps/web/src/utils/auth-storage.js`
- Create: `apps/web/src/router/guards.js`
- Modify: `apps/web/src/router/route-meta.js`

- [ ] **Step 1: 实现最小登录态常量与存储工具**

```js
// apps/web/src/constants/auth.js
export const AUTH_TOKEN_KEY = 'node_vmq_admin_token';
```

```js
// apps/web/src/utils/auth-storage.js
import { AUTH_TOKEN_KEY } from '../constants/auth.js';

function resolveStorage(storage) {
  if (storage) {
    return storage;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }

  return null;
}

export function getAuthToken(storage) {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return '';
  }

  return targetStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setAuthToken(storage, token) {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return;
  }

  targetStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(storage) {
  const targetStorage = resolveStorage(storage);

  if (!targetStorage) {
    return;
  }

  targetStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isAuthenticated(storage) {
  return Boolean(getAuthToken(storage));
}
```

- [ ] **Step 2: 运行登录态测试并确认通过**

Run: `node --test apps/web/tests/auth-storage.test.js`  
Expected: PASS，3 个测试全部通过

- [ ] **Step 3: 实现最小守卫判断逻辑**

```js
// apps/web/src/router/guards.js
import { isAuthenticated } from '../utils/auth-storage.js';
import { ROUTE_META } from './route-meta.js';

export function evaluateRouteAccess({ isLoggedIn, to }) {
  const access = to.meta?.access || ROUTE_META.PROTECTED;

  if (!isLoggedIn && access === ROUTE_META.PROTECTED) {
    return { allow: false, redirectTo: '/login' };
  }

  if (isLoggedIn && to.path === '/login') {
    return { allow: false, redirectTo: '/dashboard' };
  }

  return { allow: true, redirectTo: '' };
}

export function registerAuthGuard(router) {
  router.beforeEach((to) => {
    const result = evaluateRouteAccess({
      isLoggedIn: isAuthenticated(),
      to
    });

    if (!result.allow) {
      return result.redirectTo;
    }

    return true;
  });
}
```

- [ ] **Step 4: 运行守卫测试并确认通过**

Run: `node --test apps/web/tests/router-guards.test.js`  
Expected: PASS，3 个测试全部通过

### Task 4: 实现后台状态层与请求层

**Files:**
- Create: `apps/web/src/stores/auth.js`
- Create: `apps/web/src/stores/app.js`
- Create: `apps/web/src/services/api-client.js`
- Modify: `apps/web/src/main.js`

- [ ] **Step 1: 增加 auth store 与 app store**

store 只保留 `TP-13` 必需能力：恢复登录态、清理登录态、侧栏折叠切换。

- [ ] **Step 2: 增加 API 客户端**

统一封装 `requestJson()`，处理 base URL、请求头、JSON 解析和 `401` 预留分支。

- [ ] **Step 3: 在应用入口挂载 Pinia 与初始化登录态**

在 `main.js` 中保持启动顺序清晰，并补中文注释与关键日志。

### Task 5: 实现后台布局、基础组件与占位页

**Files:**
- Create: `apps/web/src/layouts/AdminLayout.vue`
- Create: `apps/web/src/components/admin/AdminSidebar.vue`
- Create: `apps/web/src/components/admin/AdminTopbar.vue`
- Create: `apps/web/src/components/admin/PageShell.vue`
- Create: `apps/web/src/components/admin/PageHeader.vue`
- Create: `apps/web/src/components/admin/InfoCard.vue`
- Create: `apps/web/src/components/admin/PanelCard.vue`
- Create: `apps/web/src/components/admin/EmptyState.vue`
- Create: `apps/web/src/components/admin/TableShell.vue`
- Create: `apps/web/src/components/admin/FormSection.vue`
- Create: `apps/web/src/views/LoginView.vue`
- Create: `apps/web/src/views/admin/DashboardView.vue`
- Create: `apps/web/src/views/admin/SettingsView.vue`
- Create: `apps/web/src/views/admin/MonitorView.vue`
- Create: `apps/web/src/views/admin/QrcodeView.vue`
- Create: `apps/web/src/views/admin/OrdersView.vue`
- Create: `apps/web/src/views/admin/DocsView.vue`
- Modify: `apps/web/src/App.vue`

- [ ] **Step 1: 搭建后台主布局与导航组件**

主布局负责侧栏、顶部栏、内容区；导航基于 `ADMIN_NAVIGATION` 渲染。

- [ ] **Step 2: 搭建页面结构型基础组件**

页面头部、信息卡、面板卡、空状态、表格壳、表单分组都做成可复用组件，供后续页面继续扩展。

- [ ] **Step 3: 实现各后台占位页**

每个页面都提供标题、说明、面板和后续待接入能力列表，不做空白内容。

### Task 6: 重构路由并刷新全局视觉系统

**Files:**
- Create: `apps/web/src/router/routes.js`
- Modify: `apps/web/src/router/index.js`
- Modify: `apps/web/src/styles/global.css`
- Modify: `apps/web/src/config/admin-navigation.js`
- Delete/Replace: `apps/web/src/views/HomeView.vue`

- [ ] **Step 1: 重构完整路由树**

增加 `/login` 公共路由、后台 children 路由、默认重定向和元信息。

- [ ] **Step 2: 刷新全局样式令牌**

在 `global.css` 中加入颜色、圆角、阴影、间距、过渡、响应式规则，并为后台布局和卡片提供统一基线。

- [ ] **Step 3: 替换脚手架首页**

移除旧 `HomeView` 单页引导内容，由 `/dashboard` 页面接管后台入口。

### Task 7: 验证与收尾

**Files:**
- Verify: `apps/web/tests/auth-storage.test.js`
- Verify: `apps/web/tests/router-guards.test.js`
- Verify: `apps/web/src/**/*.js`
- Verify: `apps/web/src/**/*.vue`

- [ ] **Step 1: 运行前端测试**

Run: `node --test apps/web/tests/auth-storage.test.js apps/web/tests/router-guards.test.js`  
Expected: PASS，所有测试通过

- [ ] **Step 2: 运行现有语法检查**

Run: `npm run check:web`  
Expected: PASS，无语法错误

- [ ] **Step 3: 运行生产构建验证**

Run: `npm run build -w apps/web`  
Expected: PASS，Vite 成功产出构建结果

- [ ] **Step 4: 手工核对需求覆盖**

确认：

- 后台布局已就位
- 受保护路由可拦截
- 登录页为占位页
- 各业务页占位内容可通过导航访问
- 整体风格已脱离默认脚手架

## Self-Review

- 规格覆盖：已覆盖设计文档中的布局、路由守卫、状态管理、请求层、基础组件、占位页和现代化视觉基线
- 占位词检查：无 TBD / TODO / implement later 等占位项
- 命名一致性：`auth-storage`、`guards`、`route-meta`、`ADMIN_NAVIGATION`、`AdminLayout` 命名在各任务中保持一致
