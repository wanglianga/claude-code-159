// 全局领域模型：物品登记 → 审核 → 借出 → 交接 → 归还/补充 → 报废/反馈 全链路

export type Role = 'resident' | 'volunteer' | 'staff'

export interface User {
  id: string
  name: string
  role: Role
  building: string
  phone: string
}

/** 允许进入共享的常备用品类别（仅限未拆封非处方外用/耗材） */
export type CategoryId =
  | 'cooling_patch'
  | 'iodophor'
  | 'gauze'
  | 'band_aid'
  | 'mask'
  | 'thermometer_battery'
  | 'cotton_swab'
  | 'medical_tape'
  | 'saline'
  | 'gloves'
  | 'other'

/** 症状场景 */
export type ScenarioId =
  | 'fever_night' // 孩子夜间发烧
  | 'wound_elderly' // 老人小伤口处理
  | 'mask_emergency' // 临时缺口罩
  | 'home_care' // 居家护理缺耗材

/** 存放条件 */
export type StorageId =
  | 'room_dry' // 常温干燥
  | 'cool_dry' // 阴凉干燥
  | 'refrigerated' // 冷藏（冷链物品禁入共享）

export type ItemStatus =
  | 'pending_review' // 待志愿者审核
  | 'rejected' // 审核未通过
  | 'published' // 已发布，可借用
  | 'fully_lent' // 已全部借出
  | 'recalled' // 共享人撤回
  | 'scrapped' // 已报废（过期/破损/不适反应下架）

export type RequestStatus =
  | 'pending' // 已申请，待确认（允许多人同时申请）
  | 'approved' // 已确认，待取货/待接单
  | 'delivering' // 志愿者配送中
  | 'handed_over' // 已交接，待归还或补充
  | 'returned' // 已归还，重新入库
  | 'replenished' // 已补充新品
  | 'kept' // 耗材已使用 / 赠送给借用人
  | 'lost' // 未被选中（库存被先确认的申请锁定）
  | 'cancelled' // 借用人取消
  | 'overdue' // 超过约定时间未取
  | 'recalled' // 共享人撤回导致取消

export type DeliveryMethod = 'pickup' | 'volunteer_delivery' | 'doorstep'

/** 交接时约定的归还/补充方式 */
export type SettlePlan = 'return' | 'replenish' | 'keep'

export type TimelineLevel = 'info' | 'success' | 'warning' | 'danger'

export interface TimelineEvent {
  id: string
  at: number
  level: TimelineLevel
  actorName: string
  text: string
}

export interface Item {
  id: string
  name: string
  category: CategoryId
  spec: string // 规格
  expiryDate: string // YYYY-MM-DD
  storage: StorageId
  sealedNew: boolean // 是否整盒未开封
  quantity: number // 登记可借数量
  availableQty: number // 当前可借数量（已确认的申请会锁定库存）
  pickupLocation: string // 取用地点
  sharerId: string
  status: ItemStatus
  scenarios: ScenarioId[]
  restrictions: string // 适用限制
  remarks: string
  createdAt: number
  publishedAt?: number
  reviewerId?: string
  rejectReason?: string
  scrapReason?: string
  events: TimelineEvent[]
}

export interface BorrowRequest {
  id: string
  itemId: string
  borrowerId: string
  qty: number
  scenario: ScenarioId
  method: DeliveryMethod
  status: RequestStatus
  createdAt: number
  decidedAt?: number
  volunteerId?: string
  /** 约定取走 / 送达截止时间戳 */
  promisedBefore?: number
  /** 交接时约定的归还/补充方式 */
  settlePlan?: SettlePlan
  handoverAt?: number
  handoverPhotos: string[]
  handoverNote?: string
  settleNote?: string
  /** 未被选中 / 逾期 / 撤回等原因 */
  closeReason?: string
  events: TimelineEvent[]
}

export type FeedbackType = 'package_damaged' | 'adverse_reaction' | 'other'
export type FeedbackStatus = 'open' | 'processing' | 'resolved' | 'escalated'

export interface Feedback {
  id: string
  itemId?: string
  requestId?: string
  reporterId: string
  type: FeedbackType
  description: string
  photos: string[]
  status: FeedbackStatus
  createdAt: number
  handledBy?: string
  handleNote?: string
  events: TimelineEvent[]
}

export interface AppNotification {
  id: string
  userId: string
  kind: 'info' | 'success' | 'warning' | 'danger'
  title: string
  body: string
  at: number
  read: boolean
  link?: string
}

export interface ItemDraft {
  name: string
  category: CategoryId
  spec: string
  expiryDate: string
  storage: StorageId
  sealedNew: boolean
  quantity: number
  pickupLocation: string
  scenarios: ScenarioId[]
  restrictions: string
  remarks: string
}
