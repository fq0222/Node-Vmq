/**
 * 后台路由配置文件
 * 负责集中定义公开路由、受保护路由和各页面元信息。
 */
import AdminLayout from '../layouts/AdminLayout.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/admin/DashboardView.vue';
import SettingsView from '../views/admin/SettingsView.vue';
import MonitorView from '../views/admin/MonitorView.vue';
import QrcodeView from '../views/admin/QrcodeView.vue';
import OrdersView from '../views/admin/OrdersView.vue';
import DocsView from '../views/admin/DocsView.vue';
import { ROUTE_META } from './route-meta.js';

/**
 * 完整路由表
 * 将公开路由与后台受保护路由集中定义，便于后续持续扩展。
 */
export const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      access: ROUTE_META.PUBLIC,
      title: '后台登录',
      description: ''
    }
  },
  {
    path: '/',
    component: AdminLayout,
    meta: {
      access: ROUTE_META.PROTECTED
    },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          access: ROUTE_META.PROTECTED,
          title: 'Dashboard',
          description: '后台框架总览与后续模块挂载入口。',
          eyebrow: '概览'
        }
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
        meta: {
          access: ROUTE_META.PROTECTED,
          title: '系统设置',
          description: '',
          eyebrow: '后台'
        }
      },
      {
        path: 'monitor',
        name: 'monitor',
        component: MonitorView,
        meta: {
          access: ROUTE_META.PROTECTED,
          title: '监控端',
          description: '',
          eyebrow: '设备'
        }
      },
      {
        path: 'qrcodes',
        name: 'qrcodes',
        component: QrcodeView,
        meta: {
          access: ROUTE_META.PROTECTED,
          title: '二维码管理',
          description: '预留微信和支付宝固定金额二维码的后台能力。',
          eyebrow: '收款'
        }
      },
      {
        path: 'orders',
        name: 'orders',
        component: OrdersView,
        meta: {
          access: ROUTE_META.PROTECTED,
          title: '订单管理',
          description: '预留订单查询、补单、筛选与删除操作入口。',
          eyebrow: '订单'
        }
      },
      {
        path: 'docs',
        name: 'docs',
        component: DocsView,
        meta: {
          access: ROUTE_META.PROTECTED,
          title: 'API 文档',
          description: '预留旧版接口兼容文档的新后台承载页面。',
          eyebrow: '文档'
        }
      }
    ]
  }
];
