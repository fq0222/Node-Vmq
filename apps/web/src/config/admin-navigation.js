/**
 * 后台导航配置
 * 所有后台导航入口统一从这里维护，避免布局组件内写死菜单。
 */
export const ADMIN_NAVIGATION = [
  {
    title: '总览',
    items: [
      {
        name: 'dashboard',
        label: 'Dashboard',
        description: '查看后台框架整体状态与后续模块接入方向。',
        to: '/dashboard',
        badge: 'DB'
      }
    ]
  },
  {
    title: '运营与配置',
    items: [
      {
        name: 'settings',
        label: '系统设置',
        description: '承接 TP-15 的系统参数与二维码配置页面。',
        to: '/settings',
        badge: 'ST'
      },
      {
        name: 'monitor',
        label: '监控端',
        description: '承接 TP-16 的监控状态、绑定串与二维码能力。',
        to: '/monitor',
        badge: 'MO'
      },
      {
        name: 'qrcodes',
        label: '二维码管理',
        description: '承接 TP-17 的固定金额二维码管理能力。',
        to: '/qrcodes',
        badge: 'QR'
      },
      {
        name: 'orders',
        label: '订单管理',
        description: '承接 TP-18 的订单查询、筛选和处理能力。',
        to: '/orders',
        badge: 'OR'
      }
    ]
  },
  {
    title: '资源',
    items: [
      {
        name: 'docs',
        label: 'API 文档',
        description: '承接 TP-19 的接口说明与兼容规范展示。',
        to: '/docs',
        badge: 'API'
      }
    ]
  }
];
