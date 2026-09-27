import type { PiniaPluginContext } from 'pinia'

const PREFIX = 'medkit:'

export function loadState<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function saveState(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // 存储超限（如照片过多）时静默失败，页面功能不受影响
  }
}

export function clearPersisted(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach((k) => localStorage.removeItem(k))
}

/** Pinia 插件：任意 store 变更后自动持久化到 localStorage */
export function persistPlugin({ store }: PiniaPluginContext): void {
  store.$subscribe((_mutation, state) => {
    saveState(store.$id, state)
  })
}
