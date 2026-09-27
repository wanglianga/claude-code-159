import { reactive } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

let seq = 0
export const toasts = reactive<Toast[]>([])

export function toast(message: string, type: Toast['type'] = 'info', duration = 2600): void {
  const id = ++seq
  toasts.push({ id, message, type })
  window.setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx >= 0) toasts.splice(idx, 1)
  }, duration)
}
