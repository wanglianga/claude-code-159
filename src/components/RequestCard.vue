<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BorrowRequest, SettlePlan } from '@/types'
import { DELIVERY_METHOD_META, REQUEST_STATUS_META, SETTLE_PLAN_META } from '@/data/labels'
import { SCENARIOS, scenarioName } from '@/data/catalog'
import { fmtDateTime } from '@/utils/date'
import { useItemsStore, isOverduePromise } from '@/stores/items'
import { useSessionStore } from '@/stores/session'
import { useFeedbackStore } from '@/stores/feedback'
import { toast } from '@/composables/useToast'
import StatusBadge from '@/components/StatusBadge.vue'
import PhotoThumb from '@/components/PhotoThumb.vue'
import TimelineList from '@/components/TimelineList.vue'
import Modal from '@/components/Modal.vue'
import HandoverModal from '@/components/HandoverModal.vue'
import FeedbackModal from '@/components/FeedbackModal.vue'

const props = defineProps<{ request: BorrowRequest }>()
const itemsStore = useItemsStore()
const session = useSessionStore()
const feedbackStore = useFeedbackStore()

const item = computed(() => itemsStore.getItem(props.request.itemId))
const meta = computed(() => REQUEST_STATUS_META[props.request.status])
const methodMeta = computed(() => DELIVERY_METHOD_META[props.request.method])
const overdue = computed(() => isOverduePromise(props.request))

const me = session.currentUser
const isBorrower = computed(() => props.request.borrowerId === me.id)
const isSharer = computed(() => item.value?.sharerId === me.id)
const isAssignedVolunteer = computed(() => props.request.volunteerId === me.id)
const isStaff = computed(() => me.role === 'staff')
const isVolunteer = computed(() => me.role === 'volunteer' || me.role === 'staff')

const canApprove = computed(() => props.request.status === 'pending' && (isSharer.value || isStaff.value))
const canCancel = computed(() => props.request.status === 'pending' && isBorrower.value)
const canAcceptDelivery = computed(
  () => props.request.status === 'approved' && props.request.method === 'volunteer_delivery' && isVolunteer.value
)
const canHandover = computed(() => {
  if (!['approved', 'delivering'].includes(props.request.status)) return false
  if (props.request.method === 'volunteer_delivery') {
    return props.request.status === 'delivering' && (isAssignedVolunteer.value || isStaff.value)
  }
  return isBorrower.value || isSharer.value || isStaff.value
})
const canSettle = computed(() => props.request.status === 'handed_over' && (isSharer.value || isStaff.value))
const canUrge = computed(() => overdue.value && (isSharer.value || isStaff.value || isVolunteer.value))
const canCloseOverdue = computed(() => overdue.value && (isSharer.value || isStaff.value))
const canFeedback = computed(
  () => isBorrower.value && ['handed_over', 'returned', 'replenished', 'kept'].includes(props.request.status)
)

// 确认申请：约定交接时限
const approveOpen = ref(false)
const promiseDate = ref(defaultPromise())
function defaultPromise(): string {
  const d = new Date(Date.now() + 24 * 3600 * 1000)
  d.setMinutes(0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function doApprove(): void {
  const ts = new Date(promiseDate.value).getTime()
  itemsStore.approveRequest(props.request.id, ts)
  approveOpen.value = false
  toast('已确认申请并锁定库存', 'success')
}

// 婉拒
const declineOpen = ref(false)
const declineReason = ref('')
function doDecline(): void {
  itemsStore.declineRequest(props.request.id, declineReason.value.trim() || '暂时无法提供')
  declineOpen.value = false
  declineReason.value = ''
  toast('已婉拒该申请', 'info')
}

// 志愿者接单
function acceptDelivery(): void {
  const ts = new Date(defaultPromise()).getTime()
  itemsStore.acceptDelivery(props.request.id, ts)
  toast('已接单，请按时送达', 'success')
}

// 交接
const handoverOpen = ref(false)
function onHandover(payload: { requestId: string; photos: string[]; note: string; settlePlan: SettlePlan }): void {
  itemsStore.handover(payload)
  handoverOpen.value = false
  toast('交接完成，凭证已留存', 'success')
}

// 结案
const settleOpen = ref(false)
const settleMode = ref<'return' | 'replenish'>('return')
const settleNote = ref('')
const replenishQty = ref(1)
function openSettle(mode: 'return' | 'replenish'): void {
  settleMode.value = mode
  settleNote.value = ''
  replenishQty.value = props.request.qty
  settleOpen.value = true
}
function doSettle(): void {
  if (!settleNote.value.trim()) {
    toast('请填写核对说明', 'error')
    return
  }
  if (settleMode.value === 'return') {
    itemsStore.settleReturn(props.request.id, settleNote.value.trim())
    toast('归还完成，物品已重新入库', 'success')
  } else {
    itemsStore.settleReplenish(props.request.id, replenishQty.value, settleNote.value.trim())
    toast('补充新品已登记入库', 'success')
  }
  settleOpen.value = false
}
function doKeep(): void {
  itemsStore.settleKept(props.request.id, '一次性耗材使用完毕 / 双方约定赠送，无需归还')
  toast('已结案', 'success')
}

function doUrge(): void {
  itemsStore.urge(props.request.id)
  toast('已发送催办提醒', 'warning')
}
function doCloseOverdue(): void {
  itemsStore.closeOverdue(props.request.id)
  toast('已超时关闭并释放库存', 'error')
}
function doCancel(): void {
  itemsStore.cancelRequest(props.request.id)
  toast('申请已取消', 'info')
}

// 反馈
const feedbackOpen = ref(false)
function onFeedback(payload: { type: 'package_damaged' | 'adverse_reaction' | 'other'; description: string; photos: string[] }): void {
  feedbackStore.create({
    itemId: props.request.itemId,
    requestId: props.request.id,
    reporterId: me.id,
    type: payload.type,
    description: payload.description,
    photos: payload.photos
  })
  feedbackOpen.value = false
  toast('反馈已提交，社区会尽快核实处理', 'success')
}

const borrower = computed(() => session.userById(props.request.borrowerId))
const volunteer = computed(() => (props.request.volunteerId ? session.userById(props.request.volunteerId) : null))
const scenario = computed(() => SCENARIOS.find((s) => s.id === props.request.scenario))
</script>

<template>
  <div class="req-card card" :class="{ overdue: overdue }">
    <div class="flex-between mb-12">
      <div class="flex-center wrap">
        <StatusBadge :tone="meta.tone" :label="meta.label" />
        <span class="tag">{{ methodMeta.icon }} {{ methodMeta.label }}</span>
        <span class="tag">{{ scenario?.icon }} {{ scenarioName(request.scenario) }}</span>
        <span v-if="overdue" class="badge red">⏱ 已超过约定时间</span>
      </div>
      <span class="small muted">{{ fmtDateTime(request.createdAt) }} 申请</span>
    </div>

    <div class="req-grid small">
      <div><span class="muted">借用人</span><b>{{ borrower.name }}（{{ borrower.building }}）</b></div>
      <div><span class="muted">数量</span><b>{{ request.qty }} 件</b></div>
      <div v-if="volunteer" class="full"><span class="muted">配送志愿者</span><b>{{ volunteer.name }} {{ volunteer.phone }}</b></div>
      <div v-if="request.promisedBefore" class="full">
        <span class="muted">约定交接时限</span>
        <b :class="overdue ? 'text-danger' : ''">{{ fmtDateTime(request.promisedBefore) }}{{ overdue ? '（已超时）' : '' }}</b>
      </div>
      <div v-if="request.settlePlan" class="full">
        <span class="muted">归还/补充约定</span>
        <b>{{ SETTLE_PLAN_META[request.settlePlan].icon }} {{ SETTLE_PLAN_META[request.settlePlan].label }}</b>
      </div>
    </div>

    <div v-if="request.handoverPhotos.length" class="mt-12">
      <p class="small muted mb-12">交接照片凭证：</p>
      <div class="flex gap-8 wrap">
        <PhotoThumb v-for="(p, i) in request.handoverPhotos" :key="i" :src="p" />
      </div>
      <p v-if="request.handoverNote" class="small mt-8">{{ request.handoverNote }}</p>
    </div>
    <p v-if="request.closeReason" class="small text-danger mt-8">关闭原因：{{ request.closeReason }}</p>
    <p v-if="request.settleNote" class="small text-success mt-8">结案说明：{{ request.settleNote }}</p>

    <div v-if="canApprove || canCancel || canAcceptDelivery || canHandover || canSettle || canUrge || canCloseOverdue || canFeedback"
      class="actions mt-12 wrap flex">
      <template v-if="canApprove">
        <button class="btn sm" @click="approveOpen = true">✅ 确认申请并锁定库存</button>
        <button class="btn sm secondary" @click="declineOpen = true">婉拒</button>
      </template>
      <button v-if="canCancel" class="btn sm secondary" @click="doCancel">取消申请</button>
      <button v-if="canAcceptDelivery" class="btn sm" @click="acceptDelivery">💚 接单配送</button>
      <button v-if="canHandover" class="btn sm" @click="handoverOpen = true">📷 完成交接（拍照）</button>
      <template v-if="canSettle">
        <button class="btn sm secondary" @click="openSettle('return')">↩️ 确认归还入库</button>
        <button class="btn sm secondary" @click="openSettle('replenish')">➕ 登记补充新品</button>
        <button class="btn sm ghost" @click="doKeep">耗材使用完毕，结案</button>
      </template>
      <button v-if="canUrge" class="btn sm warning" @click="doUrge">⏰ 催办</button>
      <button v-if="canCloseOverdue" class="btn sm danger" @click="doCloseOverdue">超时关闭并释放库存</button>
      <button v-if="canFeedback" class="btn sm danger" @click="feedbackOpen = true">🚨 包装破损 / 不适反应反馈</button>
    </div>

    <details class="timeline-wrap">
      <summary class="small">流转记录（{{ request.events.length }}）</summary>
      <div class="mt-12"><TimelineList :events="request.events" /></div>
    </details>

    <!-- 确认申请弹窗 -->
    <Modal :visible="approveOpen" title="确认借用申请" @close="approveOpen = false">
      <p class="mb-12">确认后将锁定 <strong>{{ request.qty }}</strong> 件库存，其他申请在库存不足时会收到提示。</p>
      <div class="field">
        <label>约定完成交接时限<span class="req">*</span></label>
        <input v-model="promiseDate" type="datetime-local" />
        <p class="hint">自取/门口交接请约定取走时间；超时未取将自动提醒，仍未完成可关闭并释放库存。</p>
      </div>
      <template #footer>
        <button class="btn secondary" @click="approveOpen = false">再想想</button>
        <button class="btn" @click="doApprove">确认并通知借用人</button>
      </template>
    </Modal>

    <!-- 婉拒弹窗 -->
    <Modal :visible="declineOpen" title="婉拒申请" @close="declineOpen = false">
      <div class="field">
        <label>原因说明</label>
        <textarea v-model="declineReason" placeholder="如：物品已答应给其他邻居 / 暂时不方便交接"></textarea>
      </div>
      <template #footer>
        <button class="btn secondary" @click="declineOpen = false">取消</button>
        <button class="btn warning" @click="doDecline">确认婉拒</button>
      </template>
    </Modal>

    <!-- 交接弹窗 -->
    <HandoverModal :visible="handoverOpen" :request="request" @close="handoverOpen = false" @confirmed="onHandover" />

    <!-- 归还/补充弹窗 -->
    <Modal :visible="settleOpen" :title="settleMode === 'return' ? '确认归还并重新入库' : '登记补充新品'"
      @close="settleOpen = false">
      <div v-if="settleMode === 'replenish'" class="field">
        <label>补充新品数量</label>
        <input v-model.number="replenishQty" type="number" min="1" max="99" />
      </div>
      <div class="field">
        <label>{{ settleMode === 'return' ? '归还核对说明' : '补充核对说明' }}<span class="req">*</span></label>
        <textarea v-model="settleNote" :placeholder="settleMode === 'return'
          ? '请确认包装完好、效期正常，如：原物归还，外包装完好未使用'
          : '请记录新品效期与包装状态，如：补充同款创可贴 10 片，有效期至 2028-05'"></textarea>
      </div>
      <div v-if="settleMode === 'return'" class="alert info">
        <span class="alert-icon">ℹ️</span>
        <div>归还时请再次核对：包装是否完好、物品是否被使用或调换；核对通过后库存将自动恢复上架。</div>
      </div>
      <template #footer>
        <button class="btn secondary" @click="settleOpen = false">取消</button>
        <button class="btn" @click="doSettle">确认入库</button>
      </template>
    </Modal>

    <!-- 反馈弹窗 -->
    <FeedbackModal
      :visible="feedbackOpen"
      :item-name="item?.name"
      @close="feedbackOpen = false"
      @submitted="onFeedback"
    />
  </div>
</template>

<style scoped>
.req-card { padding: 14px 16px; }
.req-card.overdue { border: 1px solid #f0c9c3; background: #fff9f8; }
.req-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 16px; }
.req-grid div { display: flex; gap: 8px; }
.req-grid .full { grid-column: 1 / -1; }
.req-grid span { min-width: 92px; }
.req-grid b { font-weight: 500; }
.actions { gap: 8px; }
.timeline-wrap { margin-top: 10px; }
.timeline-wrap summary { cursor: pointer; color: var(--color-text-3); user-select: none; }
.timeline-wrap summary:hover { color: var(--color-primary); }
</style>
