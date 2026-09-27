import type { FeedbackStatus, FeedbackType, ItemStatus, RequestStatus } from '@/types'

type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'teal'

export const ITEM_STATUS_META: Record<ItemStatus, { label: string; tone: Tone }> = {
  pending_review: { label: '待审核', tone: 'amber' },
  rejected: { label: '审核未通过', tone: 'red' },
  published: { label: '可借用', tone: 'green' },
  fully_lent: { label: '已全部借出', tone: 'blue' },
  recalled: { label: '已撤回', tone: 'gray' },
  scrapped: { label: '已报废', tone: 'red' }
}

export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; tone: Tone }> = {
  pending: { label: '待确认', tone: 'amber' },
  approved: { label: '待交接', tone: 'blue' },
  delivering: { label: '配送中', tone: 'blue' },
  handed_over: { label: '已交接·待归还/补充', tone: 'teal' },
  returned: { label: '已归还', tone: 'green' },
  replenished: { label: '已补充新品', tone: 'green' },
  kept: { label: '已使用结案', tone: 'gray' },
  lost: { label: '未借到', tone: 'gray' },
  cancelled: { label: '已取消', tone: 'gray' },
  overdue: { label: '超时关闭', tone: 'red' },
  recalled: { label: '撤回取消', tone: 'gray' }
}

export const FEEDBACK_STATUS_META: Record<FeedbackStatus, { label: string; tone: Tone }> = {
  open: { label: '待处理', tone: 'red' },
  processing: { label: '核实中', tone: 'amber' },
  resolved: { label: '已处理', tone: 'green' },
  escalated: { label: '已升级处理', tone: 'red' }
}

export const FEEDBACK_TYPE_META: Record<FeedbackType, { label: string; tone: Tone }> = {
  package_damaged: { label: '包装破损', tone: 'amber' },
  adverse_reaction: { label: '疑似不适反应', tone: 'red' },
  other: { label: '其他反馈', tone: 'blue' }
}

export const DELIVERY_METHOD_META = {
  pickup: { label: '自取', icon: '🚶' },
  volunteer_delivery: { label: '志愿者代送', icon: '💚' },
  doorstep: { label: '门口无接触交接', icon: '🚪' }
} as const

export const SETTLE_PLAN_META = {
  return: { label: '用完后原物归还', icon: '↩️' },
  replenish: { label: '补充同款新品', icon: '➕' },
  keep: { label: '一次性耗材，无需归还', icon: '✅' }
} as const
