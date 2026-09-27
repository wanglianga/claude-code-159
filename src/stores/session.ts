import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Role, User } from '@/types'
import { SEED_USERS } from '@/data/seed'
import { loadState } from './persist'

interface SessionState {
  currentUserId: string
}

export const useSessionStore = defineStore('session', () => {
  const persisted = loadState<SessionState>('session')
  const users = ref<User[]>(SEED_USERS)
  const currentUserId = ref(persisted?.currentUserId ?? 'u3')

  const currentUser = computed<User>(() => {
    return users.value.find((u) => u.id === currentUserId.value) ?? users.value[0]
  })
  const role = computed<Role>(() => currentUser.value.role)
  const userOptions = computed(() => users.value)

  function userById(id: string): User {
    return users.value.find((u) => u.id === id) ?? { id, name: '未知用户', role: 'resident', building: '', phone: '' }
  }

  function userName(id: string): string {
    return userById(id).name
  }

  function switchUser(id: string): void {
    currentUserId.value = id
  }

  return { users, currentUserId, currentUser, role, userOptions, userById, userName, switchUser }
})
