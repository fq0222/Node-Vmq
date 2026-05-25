/**
 * 应用壳子状态仓库文件
 * 负责维护侧边栏状态和当前页面的展示元信息。
 */
import { defineStore } from 'pinia';

/**
 * 应用壳子状态仓库
 * 用于维护侧边栏折叠状态与当前页面元信息。
 */
export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    pageMeta: {
      title: 'Dashboard',
      description: '后台框架总览与后续模块挂载入口。',
      eyebrow: 'TP-13'
    }
  }),
  actions: {
    setSidebarCollapsed(collapsed) {
      this.sidebarCollapsed = collapsed;
      console.info('[TP-13][app] 侧边栏状态已更新', {
        collapsed
      });
    },
    toggleSidebar() {
      this.setSidebarCollapsed(!this.sidebarCollapsed);
    },
    setPageMeta(meta = {}) {
      this.pageMeta = {
        title: meta.title || 'Dashboard',
        description: meta.description || '后台页面占位内容。',
        eyebrow: meta.eyebrow || 'TP-13'
      };
    }
  }
});
