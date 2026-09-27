<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/stores/session'
import { useNotificationStore } from '@/stores/notifications'
import ToastHost from '@/components/ToastHost.vue'

const session = useSessionStore()
const notifications = useNotificationStore()
const route = useRoute()

const users = session.userOptions

const navs = computed(() => {
  const list = [
    { to: '/hall', label: '互助大厅', roles: ['resident', 'volunteer', 'staff'] },
    { to: '/register', label: '登记物品', roles: ['resident'] },
    { to: '/my-shares', label: '我共享的', roles: ['resident'] },
    { to: '/my-borrows', label: '我的借用', roles: ['resident'] },
    { to: '/messages', label: '消息', roles: ['resident', 'volunteer', 'staff'] },
    { to: '/volunteer', label: '志愿者中心', roles: ['volunteer', 'staff'] },
    { to: '/staff', label: '社区工作台', roles: ['staff'] }
  ]
  return list.filter((n) => n.roles.includes(session.role))
})

const unread = computed(() => notifications.unreadCount)
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <router-link to="/hall" class="brand">
          <span class="brand-logo">🧰</span>
          <span>
            <strong>邻里药箱</strong>
            <small>社区常备用品共享互助</small>
          </span>
        </router-link>
        <nav class="main-nav">
          <router-link v-for="n in navs" :key="n.to" :to="n.to" class="nav-link"
            :class="{ active: route.path.startsWith(n.to) }">
            {{ n.label }}
            <span v-if="n.to === '/messages' && unread > 0" class="nav-dot">{{ unread }}</span>
          </router-link>
        </nav>
        <div class="role-switch" title="演示用：切换身份查看不同视角">
          <span class="role-icon">{{ session.role === 'resident' ? '🏠' : session.role === 'volunteer' ? '💚' : '🏛️' }}</span>
          <select :value="session.currentUserId" @change="session.switchUser(($event.target as HTMLSelectElement).value)">
            <option v-for="u in users" :key="u.id" :value="u.id">
              {{ u.name }}（{{ u.role === 'resident' ? '居民' : u.role === 'volunteer' ? '志愿者' : '社区工作人员' }}）
            </option>
          </select>
        </div>
      </div>
    </header>
    <main>
      <router-view v-slot="{ Component }">
        <component :is="Component" :key="route.fullPath" />
      </router-view>
    </main>
    <footer class="app-footer">
      <p>邻里药箱仅提供物品流转与风险提醒，<strong>不提供诊断建议，不替代就医</strong>。不适症状请及时前往正规医疗机构就诊。</p>
    </footer>
    <ToastHost />
  </div>
</template>

<style scoped>
.app-shell { min-height: 100%; display: flex; flex-direction: column; }
.app-header {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 50;
}
.header-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.brand { display: flex; align-items: center; gap: 10px; color: var(--color-text) !important; }
.brand-logo {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--color-primary-soft);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px;
}
.brand strong { display: block; font-size: 15.5px; line-height: 1.2; }
.brand small { display: block; font-size: 11px; color: var(--color-text-3); }
.main-nav { display: flex; gap: 2px; flex: 1; overflow-x: auto; }
.nav-link {
  position: relative;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 13.5px;
  color: var(--color-text-2);
  white-space: nowrap;
}
.nav-link:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.nav-link.active { color: var(--color-primary); font-weight: 600; background: var(--color-primary-soft); }
.nav-dot {
  display: inline-block;
  margin-left: 3px;
  background: var(--color-danger);
  color: #fff;
  font-size: 10px;
  border-radius: 999px;
  padding: 0 5px;
  line-height: 15px;
  vertical-align: top;
}
.role-switch { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.role-switch select { width: auto; padding: 6px 8px; font-size: 12.5px; }
.role-icon { font-size: 18px; }
.app-footer {
  margin-top: auto;
  background: #fff;
  border-top: 1px solid var(--color-border);
  padding: 14px 20px;
  text-align: center;
}
.app-footer p { font-size: 12px; color: var(--color-text-3); max-width: 760px; margin: 0 auto; }
@media (max-width: 860px) {
  .brand small { display: none; }
  .header-inner { gap: 10px; }
}
</style>
