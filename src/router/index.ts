import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/stores/session'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/hall' },
  { path: '/hall', name: 'hall', component: () => import('@/pages/HallPage.vue'), meta: { title: '互助药箱大厅' } },
  { path: '/register', name: 'register', component: () => import('@/pages/RegisterItemPage.vue'), meta: { title: '登记共享物品' } },
  { path: '/items/:id', name: 'item-detail', component: () => import('@/pages/ItemDetailPage.vue'), props: true, meta: { title: '物品详情' } },
  { path: '/my-shares', name: 'my-shares', component: () => import('@/pages/MySharesPage.vue'), meta: { title: '我共享的' } },
  { path: '/my-borrows', name: 'my-borrows', component: () => import('@/pages/MyBorrowsPage.vue'), meta: { title: '我的借用' } },
  { path: '/messages', name: 'messages', component: () => import('@/pages/MessagesPage.vue'), meta: { title: '消息提醒' } },
  { path: '/volunteer', name: 'volunteer', component: () => import('@/pages/VolunteerPage.vue'), meta: { title: '志愿者中心', roles: ['volunteer', 'staff'] } },
  { path: '/staff', name: 'staff', component: () => import('@/pages/StaffPage.vue'), meta: { title: '社区工作台', roles: ['staff'] } },
  { path: '/:pathMatch(.*)*', redirect: '/hall' }
]

export function createAppRouter() {
  const router = createRouter({ history: createWebHashHistory(), routes })

  router.beforeEach((to) => {
    const roles = to.meta.roles as string[] | undefined
    if (roles && roles.length) {
      const session = useSessionStore()
      if (!roles.includes(session.role)) {
        return { name: 'hall' }
      }
    }
    return true
  })

  router.afterEach((to) => {
    if (typeof document !== 'undefined') {
      document.title = `${(to.meta.title as string) ?? ''} · 邻里药箱`
    }
  })

  return router
}
