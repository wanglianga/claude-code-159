/** 日期与效期工具 */

export const DAY_MS = 24 * 60 * 60 * 1000

export function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** 距今天的天数（今天=0，未来为正，已过为负），按自然日计算 */
export function daysUntil(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`).getTime()
  return Math.round((target - startOfToday()) / DAY_MS)
}

export type ExpiryLevel = 'expired' | 'urgent' | 'near' | 'watch' | 'ok'

export function expiryLevel(dateStr: string): ExpiryLevel {
  const d = daysUntil(dateStr)
  if (d < 0) return 'expired'
  if (d <= 7) return 'urgent'
  if (d <= 30) return 'near'
  if (d <= 90) return 'watch'
  return 'ok'
}

export function expiryText(dateStr: string): string {
  const d = daysUntil(dateStr)
  if (d < 0) return `已过期 ${-d} 天`
  if (d === 0) return '今天到期'
  if (d <= 30) return `还有 ${d} 天到期`
  if (d <= 90) return `还有 ${d} 天到期`
  return `有效期至 ${dateStr}`
}

export function isoDate(offsetDays: number): string {
  const d = new Date(startOfToday() + offsetDays * DAY_MS)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fmtDateTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return fmtDateTime(ts)
}
