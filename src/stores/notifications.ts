import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppNotification } from '@/types'
import { SEED_NOTIFICATIONS } from '@/data/seed'
import { loadState } from './persist'
import { uid } from '@/utils/id'
import { useSessionStore } from './session'

export const useNotificationStore = defineStore('notifications', () => {
  const persisted = loadState<{ notifications: AppNotification[] }>('notifications')
  const notifications = ref<AppNotification[]>(persisted?.notifications ?? SEED_NOTIFICATIONS)

  function push(n: Omit<AppNotification, 'id' | 'at' | 'read'>): void {
    notifications.value.unshift({
      id: uid('n'),
      at: Date.now(),
      read: false,
      ...n
    })
  }

  function forUser(userId: string) {
    return computed(() =>
      notifications.value
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.at - a.at)
    )
  }

  function markRead(id: string): void {
    const n = notifications.value.find((x) => x.id === id)
    if (n) n.read = true
  }

  function markAllRead(userId: string): void {
    notifications.value.forEach((n) => {
      if (n.userId === userId) n.read = true
    })
  }

  const unreadCount = computed(() => {
    const session = useSessionStore()
    return notifications.value.filter((n) => n.userId === session.currentUserId && !n.read).length
  })

  return { notifications, push, forUser, markRead, markAllRead, unreadCount }
})
