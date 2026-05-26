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
        description: '',
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
        description: '',
        to: '/settings',
        badge: 'ST'
      },
      {
        name: 'monitor',
        label: '监控端',
        description: '',
        to: '/monitor',
        badge: 'MO'
      },
      {
        name: 'qrcodes',
        label: '二维码管理',
        description: '',
        to: '/qrcodes',
        badge: 'QR'
      },
      {
        name: 'orders',
        label: '订单管理',
        description: '',
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
        description: '',
        to: '/docs',
        badge: 'API'
      }
    ]
  }
];
