<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notifications'
import { useSessionStore } from '@/stores/session'
import { relativeTime } from '@/utils/date'

const notifications = useNotificationStore()
const session = useSessionStore()
const router = useRouter()

const list = computed(() => notifications.forUser(session.currentUserId).value)

const iconMap = { info: '🔔', success: '✅', warning: '⏰', danger: '🚨' } as const

function open(link?: string, id?: string): void {
  if (id) notifications.markRead(id)
  if (link) router.push(link)
}
</script>

<template>
  <div class="page narrow">
    <div class="flex-between mb-12">
      <h1 class="page-title" style="margin:0">消息提醒</h1>
      <button class="btn secondary sm" @click="notifications.markAllRead(session.currentUserId)">全部已读</button>
    </div>
    <p class="page-sub">效期临近、申请进展、交接催办、配送延误、撤回与反馈处理都会在这里通知。</p>

    <div v-if="list.length" class="msg-list">
      <button v-for="n in list" :key="n.id" class="msg-item card" :class="{ unread: !n.read }" @click="open(n.link, n.id)">
        <span class="msg-icon">{{ iconMap[n.kind] }}</span>
        <div class="grow">
          <div class="flex-between">
            <strong>{{ n.title }}</strong>
            <span class="small muted">{{ relativeTime(n.at) }}</span>
          </div>
          <p class="small mt-8">{{ n.body }}</p>
        </div>
        <span v-if="!n.read" class="unread-dot"></span>
      </button>
    </div>
    <div v-else class="empty">
      <span class="empty-icon">🔕</span>
      <p>暂无消息</p>
    </div>
  </div>
</template>

<style scoped>
.narrow { max-width: 760px; }
.msg-list { display: flex; flex-direction: column; gap: 10px; }
.msg-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  border: 1px solid var(--color-border);
  padding: 14px 16px;
  position: relative;
}
.msg-item:hover { border-color: var(--color-primary); }
.msg-item.unread { background: #f5faf8; }
.msg-icon { font-size: 20px; line-height: 1.4; }
.unread-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--color-danger);
  flex-shrink: 0;
  margin-top: 6px;
}
</style>
