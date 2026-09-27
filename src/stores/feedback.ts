import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Feedback, FeedbackType, TimelineEvent } from '@/types'
import { SEED_FEEDBACKS } from '@/data/seed'
import { loadState } from './persist'
import { uid } from '@/utils/id'
import { useSessionStore } from './session'
import { useItemsStore } from './items'
import { useNotificationStore } from './notifications'

interface PersistShape {
  feedbacks: Feedback[]
}

export const useFeedbackStore = defineStore('feedback', () => {
  const persisted = loadState<PersistShape>('feedback')
  const feedbacks = ref<Feedback[]>(persisted?.feedbacks ?? SEED_FEEDBACKS)

  const openFeedbacks = computed(() =>
    feedbacks.value
      .filter((f) => f.status === 'open' || f.status === 'processing')
      .sort((a, b) => b.createdAt - a.createdAt)
  )
  const allFeedbacks = computed(() => [...feedbacks.value].sort((a, b) => b.createdAt - a.createdAt))
  const feedbacksOfItem = (itemId: string) => computed(() => feedbacks.value.filter((f) => f.itemId === itemId))

  function pushEvent(f: Feedback, level: TimelineEvent['level'], actorName: string, text: string): void {
    f.events.push({ id: uid('e'), at: Date.now(), level, actorName, text })
  }

  function create(input: {
    itemId?: string
    requestId?: string
    reporterId: string
    type: FeedbackType
    description: string
    photos: string[]
  }): Feedback {
    const session = useSessionStore()
    const items = useItemsStore()
    const reporter = session.userById(input.reporterId)
    const f: Feedback = {
      id: uid('f'),
      itemId: input.itemId,
      requestId: input.requestId,
      reporterId: input.reporterId,
      type: input.type,
      description: input.description,
      photos: input.photos,
      status: 'open',
      createdAt: Date.now(),
      events: []
    }
    const typeText = input.type === 'package_damaged' ? '包装破损' : input.type === 'adverse_reaction' ? '疑似不适反应' : '其他反馈'
    pushEvent(f, input.type === 'other' ? 'info' : 'danger', reporter.name, `提交${typeText}反馈，等待社区核实`)
    feedbacks.value.unshift(f)

    const item = input.itemId ? items.getItem(input.itemId) : undefined
    const level: TimelineEvent['level'] = input.type === 'other' ? 'info' : 'danger'
    if (item) {
      items.itemEvent(item, level, reporter.name, `用户反馈${typeText}：${input.description}`)
    }
    // 通知社区工作人员与志愿者
    const notifications = useNotificationStore()
    session.users
      .filter((u) => u.role === 'staff' || u.role === 'volunteer')
      .forEach((u) => {
        notifications.push({
          userId: u.id,
          kind: input.type === 'other' ? 'info' : 'danger',
          title: input.type === 'other' ? '收到新的反馈建议' : `收到${typeText}反馈`,
          body: `${reporter.name} 反馈“${item?.name ?? '共享物品'}”：${input.description.slice(0, 40)}`,
          link: u.role === 'staff' ? '/staff' : '/volunteer'
        })
      })
    return f
  }

  /** 志愿者初核：标记处理中 */
  function startHandle(id: string): void {
    const f = feedbacks.value.find((x) => x.id === id)
    if (!f) return
    f.status = 'processing'
    const name = useSessionStore().currentUser.name
    pushEvent(f, 'warning', `${name}（志愿者）`, '志愿者开始核实处理')
  }

  /**
   * 社区工作人员结案
   * - 不适反应：默认升级处理并可联动下架报废
   */
  function resolve(input: { id: string; note: string; scrapItem?: boolean; scrapReason?: string }): void {
    const f = feedbacks.value.find((x) => x.id === input.id)
    if (!f) return
    const session = useSessionStore()
    const staff = session.currentUser
    f.handledBy = staff.id
    f.handleNote = input.note
    f.status = f.type === 'adverse_reaction' ? 'escalated' : 'resolved'
    pushEvent(
      f,
      f.type === 'adverse_reaction' ? 'danger' : 'success',
      `${staff.name}（社区工作人员）`,
      f.type === 'adverse_reaction'
        ? `社区升级处理并回访：${input.note}`
        : `处理完成：${input.note}`
    )
    const items = useItemsStore()
    if (input.scrapItem && f.itemId) {
      items.scrapItem(f.itemId, input.scrapReason || '根据用户反馈，社区核实后下架报废')
    }
    // 通知反馈人
    const notifications = useNotificationStore()
    const item = f.itemId ? items.getItem(f.itemId) : undefined
    notifications.push({
      userId: f.reporterId,
      kind: f.type === 'adverse_reaction' ? 'warning' : 'success',
      title: '您的反馈已有处理结果',
      body: `关于“${item?.name ?? '共享物品'}”的反馈：${input.note}`,
      link: '/messages'
    })
  }

  return { feedbacks, openFeedbacks, allFeedbacks, feedbacksOfItem, create, startHandle, resolve }
})
