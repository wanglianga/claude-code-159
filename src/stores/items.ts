import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  BorrowRequest,
  Item,
  ItemDraft,
  RequestStatus,
  SettlePlan,
  TimelineEvent,
  TimelineLevel
} from '@/types'
import { SEED_ITEMS, SEED_REQUESTS } from '@/data/seed'
import { loadState } from './persist'
import { uid } from '@/utils/id'
import { daysUntil } from '@/utils/date'
import { useNotificationStore } from './notifications'
import { useSessionStore } from './session'

interface PersistShape {
  items: Item[]
  requests: BorrowRequest[]
}

/** 申请是否仍占用库存 */
const LOCKING_STATUSES: RequestStatus[] = ['approved', 'delivering', 'handed_over']

export const useItemsStore = defineStore('items', () => {
  const persisted = loadState<PersistShape>('items')
  const items = ref<Item[]>(persisted?.items ?? SEED_ITEMS)
  const requests = ref<BorrowRequest[]>(persisted?.requests ?? SEED_REQUESTS)

  // ---------- 基础查询 ----------
  const itemById = (id: string) => computed(() => items.value.find((i) => i.id === id))
  const requestById = (id: string) => computed(() => requests.value.find((r) => r.id === id))

  function getItem(id: string): Item | undefined {
    return items.value.find((i) => i.id === id)
  }
  function getRequest(id: string): BorrowRequest | undefined {
    return requests.value.find((r) => r.id === id)
  }
  function requestsOfItem(itemId: string): BorrowRequest[] {
    return requests.value
      .filter((r) => r.itemId === itemId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }
  function activeRequestOfUser(itemId: string, userId: string): BorrowRequest | undefined {
    return requests.value.find(
      (r) =>
        r.itemId === itemId &&
        r.borrowerId === userId &&
        ['pending', 'approved', 'delivering', 'handed_over'].includes(r.status)
    )
  }
  const itemsBySharer = (userId: string) =>
    computed(() => items.value.filter((i) => i.sharerId === userId).sort((a, b) => b.createdAt - a.createdAt))
  const requestsByBorrower = (userId: string) =>
    computed(() =>
      requests.value.filter((r) => r.borrowerId === userId).sort((a, b) => b.createdAt - a.createdAt)
    )

  /** 大厅可见：已发布且未过期 */
  const publishedItems = computed(() =>
    items.value
      .filter((i) => i.status === 'published' || i.status === 'fully_lent')
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
  )

  const pendingReviewItems = computed(() =>
    items.value.filter((i) => i.status === 'pending_review').sort((a, b) => a.createdAt - b.createdAt)
  )

  const deliveryTasks = computed(() =>
    requests.value.filter((r) => r.status === 'approved' || r.status === 'delivering')
  )

  // ---------- 时间线 ----------
  function itemEvent(item: Item, level: TimelineLevel, actorName: string, text: string): void {
    const e: TimelineEvent = { id: uid('e'), at: Date.now(), level, actorName, text }
    item.events.push(e)
  }
  function requestEvent(req: BorrowRequest, level: TimelineLevel, actorName: string, text: string): void {
    const e: TimelineEvent = { id: uid('e'), at: Date.now(), level, actorName, text }
    req.events.push(e)
  }

  function notify(userId: string, kind: TimelineLevel, title: string, body: string, link?: string): void {
    const notifications = useNotificationStore()
    notifications.push({ userId, kind: kind === 'info' ? 'info' : kind, title, body, link })
  }
  function notifyVolunteers(kind: TimelineLevel, title: string, body: string, link?: string): void {
    const session = useSessionStore()
    session.users.filter((u) => u.role === 'volunteer' || u.role === 'staff').forEach((u) => {
      notify(u.id, kind, title, body, link)
    })
  }
  function actorName(): string {
    return useSessionStore().currentUser.name
  }

  // ---------- 登记 ----------
  function registerItem(draft: ItemDraft, sharerId: string): Item {
    const item: Item = {
      id: uid('it'),
      ...draft,
      availableQty: draft.quantity,
      sharerId,
      status: 'pending_review',
      createdAt: Date.now(),
      events: []
    }
    const name = useSessionStore().userById(sharerId).name
    itemEvent(item, 'info', name, `登记物品：${draft.name} ${draft.quantity} 件，等待志愿者审核`)
    items.value.unshift(item)
    notifyVolunteers(
      'info',
      '新物品待审核',
      `${name} 登记了“${draft.name}”，请核对效期、包装状态与共享准入要求。`,
      '/volunteer'
    )
    return item
  }

  // ---------- 审核 ----------
  function reviewItem(itemId: string, approved: boolean, reason?: string): void {
    const item = getItem(itemId)
    if (!item || item.status !== 'pending_review') return
    const session = useSessionStore()
    const reviewer = session.currentUser
    item.reviewerId = reviewer.id
    if (approved) {
      item.status = 'published'
      item.publishedAt = Date.now()
      itemEvent(item, 'success', `${reviewer.name}（${reviewer.role === 'staff' ? '社区工作人员' : '志愿者'}）`, '审核通过：信息齐全、包装完好，已发布到互助大厅')
      notify(item.sharerId, 'success', '物品审核通过', `您登记的“${item.name}”已通过审核并发布，邻居可以申请了。`, '/my-shares')
    } else {
      item.status = 'rejected'
      item.rejectReason = reason || '不符合共享准入要求'
      itemEvent(item, 'danger', `${reviewer.name}（志愿者）`, `审核未通过：${item.rejectReason}`)
      notify(item.sharerId, 'danger', '物品审核未通过', `您登记的“${item.name}”未通过审核：${item.rejectReason}`, '/my-shares')
    }
  }

  // ---------- 申请 ----------
  function applyForRequest(input: {
    itemId: string
    borrowerId: string
    qty: number
    scenario: BorrowRequest['scenario']
    method: BorrowRequest['method']
  }): BorrowRequest | null {
    const item = getItem(input.itemId)
    if (!item || item.status !== 'published' || item.availableQty <= 0) return null
    if (daysUntil(item.expiryDate) < 0) return null
    if (activeRequestOfUser(item.id, input.borrowerId)) return null

    const req: BorrowRequest = {
      id: uid('r'),
      itemId: item.id,
      borrowerId: input.borrowerId,
      qty: input.qty,
      scenario: input.scenario,
      method: input.method,
      status: 'pending',
      createdAt: Date.now(),
      handoverPhotos: [],
      events: []
    }
    const borrowerName = useSessionStore().userById(input.borrowerId).name
    const methodText = input.method === 'pickup' ? '自取' : input.method === 'volunteer_delivery' ? '志愿者代送' : '邻居门口无接触交接'
    requestEvent(req, 'info', borrowerName, `提交申请：${item.name} × ${input.qty}，选择${methodText}`)
    requests.value.unshift(req)
    notify(
      item.sharerId,
      'info',
      '收到新的借用申请',
      `${borrowerName} 申请“${item.name}”× ${input.qty}，请在“我共享的”中及时确认。先确认的申请锁定库存。`,
      '/my-shares'
    )
    return req
  }

  /** 共享人/志愿者确认申请：锁定库存 */
  function approveRequest(requestId: string, promisedBefore?: number): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || req.status !== 'pending') return
    if (req.qty > item.availableQty) {
      // 库存已被先确认的申请锁定：该申请无法满足
      req.status = 'lost'
      req.closeReason = '库存不足：可借数量已被先确认的申请锁定'
      req.decidedAt = Date.now()
      requestEvent(req, 'warning', actorName(), '申请未能确认：可借数量已被其他先确认的申请锁定')
      notify(req.borrowerId, 'warning', '申请未成功', `您申请的“${item.name}”可借数量已被先确认的邻居锁定，请关注后续归还补充。`, '/my-borrows')
      return
    }
    req.status = 'approved'
    req.decidedAt = Date.now()
    req.promisedBefore = promisedBefore
    item.availableQty -= req.qty
    requestEvent(req, 'success', actorName(), `申请已确认，锁定库存 ${req.qty} 件，等待交接`)
    itemEvent(item, 'success', actorName(), `确认借用申请，锁定 ${req.qty} 件，剩余可借 ${Math.max(item.availableQty, 0)} 件`)
    const session = useSessionStore()
    const borrower = session.userById(req.borrowerId)
    notify(req.borrowerId, 'success', '申请已确认', `您申请的“${item.name}”已确认，请按约定方式完成交接。交接时请核对包装与效期。`, '/my-borrows')
    if (req.method === 'volunteer_delivery') {
      notifyVolunteers('info', '新的代送任务', `${borrower.name}申请的“${item.name}”需要志愿者代送，请前往志愿者中心接单。`, '/volunteer')
    }
    if (item.availableQty === 0 && item.status === 'published') {
      item.status = 'fully_lent'
    }
  }

  /** 共享人婉拒申请 */
  function declineRequest(requestId: string, reason: string): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || req.status !== 'pending') return
    req.status = 'cancelled'
    req.closeReason = reason || '共享人暂无法提供'
    req.decidedAt = Date.now()
    requestEvent(req, 'warning', actorName(), `共享人婉拒：${req.closeReason}`)
    notify(req.borrowerId, 'info', '申请未被确认', `您申请的“${item.name}”暂无法提供：${req.closeReason}`, '/my-borrows')
  }

  /** 借用人取消（仅待确认） */
  function cancelRequest(requestId: string): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || req.status !== 'pending') return
    req.status = 'cancelled'
    req.closeReason = '借用人主动取消'
    requestEvent(req, 'info', actorName(), '借用人取消申请')
    notify(item.sharerId, 'info', '借用申请已取消', `${useSessionStore().userById(req.borrowerId).name} 取消了“${item.name}”的申请。`, '/my-shares')
  }

  // ---------- 配送 ----------
  function acceptDelivery(requestId: string, promisedBefore?: number): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || req.method !== 'volunteer_delivery' || req.status !== 'approved') return
    const volunteer = useSessionStore().currentUser
    req.volunteerId = volunteer.id
    req.status = 'delivering'
    if (promisedBefore) req.promisedBefore = promisedBefore
    requestEvent(req, 'info', `${volunteer.name}（志愿者）`, '志愿者接单，开始配送')
    notify(req.borrowerId, 'info', '志愿者已接单', `志愿者${volunteer.name} 将为您配送“${item.name}”，请留意联系。`, '/my-borrows')
  }

  /** 催办（配送延误 / 迟迟未取） */
  function urge(requestId: string): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item) return
    if (req.status === 'delivering' && req.volunteerId) {
      notify(req.volunteerId, 'danger', '配送延误催办', `“${item.name}”已超过约定送达时间，请尽快送达或联系借用人改期。`, '/volunteer')
      requestEvent(req, 'warning', '系统', '已自动催办：配送超过约定时间')
    } else if (req.status === 'approved') {
      notify(req.borrowerId, 'warning', '请尽快取走物品', `您申请的“${item.name}”已超过约定时间，请尽快完成交接，否则申请将被关闭并释放库存。`, '/my-borrows')
      requestEvent(req, 'warning', '系统', '已自动催办：借用人超过约定时间未取')
    }
  }

  /** 逾期未取：关闭申请并释放库存 */
  function closeOverdue(requestId: string): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item) return
    if (req.status === 'delivering' && req.volunteerId) {
      notify(req.volunteerId, 'warning', '配送任务已关闭', `“${item.name}”配送任务超时关闭，请与社区联系后续安排。`, '/volunteer')
    }
    if (LOCKING_STATUSES.includes(req.status) && req.status !== 'handed_over') {
      item.availableQty += req.qty
    }
    req.status = 'overdue'
    req.closeReason = '超过约定交接时间，经提醒仍未完成，申请关闭并释放库存'
    requestEvent(req, 'danger', actorName(), '超过约定交接时间，关闭申请并释放库存')
    itemEvent(item, 'warning', actorName(), `一笔借用申请超时未完成，释放 ${req.qty} 件库存`)
    if (item.status === 'fully_lent') item.status = 'published'
    notify(req.borrowerId, 'danger', '借用申请已超时关闭', `您申请的“${item.name}”超过约定时间未完成交接，申请已关闭。如仍需要请重新申请。`, '/my-borrows')
  }

  // ---------- 交接 ----------
  function handover(input: {
    requestId: string
    photos: string[]
    note?: string
    settlePlan: SettlePlan
  }): void {
    const req = getRequest(input.requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || !['approved', 'delivering'].includes(req.status)) return
    req.status = 'handed_over'
    req.handoverAt = Date.now()
    req.handoverPhotos = input.photos
    req.handoverNote = input.note
    req.settlePlan = input.settlePlan
    const planText = input.settlePlan === 'return' ? '用完后原物归还' : input.settlePlan === 'replenish' ? '补充同款新品' : '耗材赠送，无需归还'
    requestEvent(req, 'success', actorName(), `交接完成并拍照确认；双方约定：${planText}${input.note ? `。${input.note}` : ''}`)
    itemEvent(item, 'success', actorName(), `交接完成 ${req.qty} 件（拍照确认），约定：${planText}`)
    notify(req.borrowerId, 'success', '交接完成', `“${item.name}”已完成交接，请按约定归还或补充；使用前请再次核对效期与包装。`, '/my-borrows')
    notify(item.sharerId, 'success', '物品已交接', `您共享的“${item.name}”已完成 ${req.qty} 件交接。`, '/my-shares')
  }

  // ---------- 归还 / 补充 / 赠送结案 ----------
  function settleReturn(requestId: string, note: string): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || req.status !== 'handed_over') return
    req.status = 'returned'
    req.settleNote = note
    item.availableQty += req.qty
    requestEvent(req, 'success', actorName(), `物品已归还：${note}。经核对包装完好后重新入库`)
    itemEvent(item, 'success', actorName(), `归还 ${req.qty} 件，核对包装完好后重新上架，当前可借 ${item.availableQty} 件`)
    if (item.status === 'fully_lent') item.status = 'published'
    notify(item.sharerId, 'success', '物品已归还', `借出的“${item.name}”已归还 ${req.qty} 件并重新上架。`, '/my-shares')
  }

  function settleReplenish(requestId: string, addQty: number, note: string): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || req.status !== 'handed_over') return
    req.status = 'replenished'
    req.settleNote = `补充同款新品 ${addQty} 件。${note}`
    item.quantity += addQty
    item.availableQty += addQty
    requestEvent(req, 'success', actorName(), `已按约定补充同款新品 ${addQty} 件：${note}`)
    itemEvent(item, 'success', actorName(), `借用人补充同款新品 ${addQty} 件入库，登记总量更新为 ${item.quantity} 件`)
    if (item.status === 'fully_lent') item.status = 'published'
    notify(item.sharerId, 'success', '物品已补充', `借用人已为“${item.name}”补充 ${addQty} 件同款新品。`, '/my-shares')
  }

  function settleKept(requestId: string, note: string): void {
    const req = getRequest(requestId)
    const item = req ? getItem(req.itemId) : undefined
    if (!req || !item || req.status !== 'handed_over') return
    req.status = 'kept'
    req.settleNote = note
    requestEvent(req, 'info', actorName(), `一次性耗材使用完毕 / 赠送结案：${note}`)
    itemEvent(item, 'info', actorName(), `${req.qty} 件一次性耗材已使用，不归还`)
  }

  // ---------- 撤回 / 报废 ----------
  function recallItem(itemId: string, reason: string): void {
    const item = getItem(itemId)
    if (!item) return
    item.status = 'recalled'
    itemEvent(item, 'warning', actorName(), `共享人撤回：${reason}`)
    requests.value
      .filter((r) => r.itemId === itemId && ['pending', 'approved'].includes(r.status))
      .forEach((r) => {
        if (r.status === 'approved') item.availableQty += r.qty
        r.status = 'recalled'
        r.closeReason = `共享人撤回物品：${reason}`
        requestEvent(r, 'danger', actorName(), '共享人撤回物品，申请自动取消并通知借用人')
        notify(r.borrowerId, 'warning', '物品已被撤回', `您申请的“${item.name}”被共享人撤回（${reason}），申请已取消。`, '/my-borrows')
      })
    requests.value
      .filter((r) => r.itemId === itemId && r.status === 'delivering')
      .forEach((r) => {
        requestEvent(r, 'danger', actorName(), `共享人撤回物品（${reason}），配送中的物品请与社区联系停止交接`)
        if (r.volunteerId) {
          notify(r.volunteerId, 'danger', '物品撤回：请停止交接', `您正在配送的“${item.name}”被共享人撤回，请停止送达并联系社区。`, '/volunteer')
        }
        notify(r.borrowerId, 'warning', '物品已被撤回', `您申请的“${item.name}”被共享人撤回，志愿者将与您联系。`, '/my-borrows')
      })
  }

  function scrapItem(itemId: string, reason: string): void {
    const item = getItem(itemId)
    if (!item) return
    item.status = 'scrapped'
    item.scrapReason = reason
    item.availableQty = 0
    itemEvent(item, 'danger', actorName(), `社区报废处理：${reason}`)
    requests.value
      .filter((r) => r.itemId === itemId && ['pending', 'approved', 'delivering'].includes(r.status))
      .forEach((r) => {
        const wasLocking = r.status === 'approved' || r.status === 'delivering'
        r.status = 'cancelled'
        r.closeReason = `物品已被社区报废：${reason}`
        requestEvent(r, 'danger', actorName(), '物品已被社区报废，申请取消，停止一切交接与使用')
        notify(r.borrowerId, 'danger', '物品已报废，申请取消', `您申请的“${item.name}”已被社区报废（${reason}），请勿使用。`, '/my-borrows')
        if (wasLocking && r.volunteerId) {
          notify(r.volunteerId, 'danger', '物品已报废：停止交接', `您配送中的“${item.name}”已报废，请停止送达并交回社区。`, '/volunteer')
        }
      })
    notify(item.sharerId, 'warning', '物品已报废', `您共享的“${item.name}”已由社区报废：${reason}`, '/my-shares')
  }

  /** 志愿者审核物品时直接修正物品状态用（预留扩展点） */
  function releaseAllLocksForItem(itemId: string): void {
    const item = getItem(itemId)
    if (!item) return
    requests.value
      .filter((r) => r.itemId === itemId && (r.status === 'approved' || r.status === 'delivering'))
      .forEach((r) => {
        item.availableQty += r.qty
      })
  }

  return {
    items,
    requests,
    // queries
    itemById,
    requestById,
    getItem,
    getRequest,
    requestsOfItem,
    activeRequestOfUser,
    itemsBySharer,
    requestsByBorrower,
    publishedItems,
    pendingReviewItems,
    deliveryTasks,
    // timeline helpers
    itemEvent,
    requestEvent,
    // actions
    registerItem,
    reviewItem,
    applyForRequest,
    approveRequest,
    declineRequest,
    cancelRequest,
    acceptDelivery,
    urge,
    closeOverdue,
    handover,
    settleReturn,
    settleReplenish,
    settleKept,
    recallItem,
    scrapItem,
    releaseAllLocksForItem
  }
})

/** 判断申请是否超过约定交接时间 */
export function isOverduePromise(req: BorrowRequest): boolean {
  return (
    !!req.promisedBefore &&
    Date.now() > req.promisedBefore &&
    (req.status === 'approved' || req.status === 'delivering')
  )
}
