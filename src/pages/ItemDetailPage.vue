<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { DeliveryMethod, ScenarioId } from '@/types'
import { categoryIcon, categoryName, scenarioName, storageName, DISCLAIMER_FULL } from '@/data/catalog'
import { ITEM_STATUS_META } from '@/data/labels'
import { daysUntil } from '@/utils/date'
import { useItemsStore } from '@/stores/items'
import { useSessionStore } from '@/stores/session'
import { useFeedbackStore } from '@/stores/feedback'
import { toast } from '@/composables/useToast'
import StatusBadge from '@/components/StatusBadge.vue'
import ExpiryBadge from '@/components/ExpiryBadge.vue'
import SafetyBanner from '@/components/SafetyBanner.vue'
import TimelineList from '@/components/TimelineList.vue'
import RequestCard from '@/components/RequestCard.vue'
import ApplyModal from '@/components/ApplyModal.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const itemsStore = useItemsStore()
const session = useSessionStore()
const feedbackStore = useFeedbackStore()

const item = computed(() => itemsStore.getItem(props.id))
const requests = computed(() => (item.value ? itemsStore.requestsOfItem(item.value.id) : []))
const ACTIVE_STATUSES = ['pending', 'approved', 'delivering', 'handed_over'] as const
const activeRequests = computed(() =>
  requests.value.filter((r) => ACTIVE_STATUSES.includes(r.status as (typeof ACTIVE_STATUSES)[number]))
)
/** 普通借用人只能看到自己的进行中申请；共享人 / 志愿者 / 社工可见全部 */
const visibleActiveRequests = computed(() =>
  activeRequests.value.filter((r) => isSharer.value || isVolunteer.value || r.borrowerId === me.id)
)
const otherPendingCount = computed(
  () => activeRequests.value.filter((r) => r.status === 'pending' && r.borrowerId !== me.id).length
)
const historyRequests = computed(() =>
  requests.value.filter((r) => !ACTIVE_STATUSES.includes(r.status as (typeof ACTIVE_STATUSES)[number]))
)
const feedbacks = computed(() => (item.value ? feedbackStore.feedbacksOfItem(item.value.id).value : []))

const me = session.currentUser
const isSharer = computed(() => item.value?.sharerId === me.id)
const isVolunteer = computed(() => me.role === 'volunteer' || me.role === 'staff')
const expired = computed(() => (item.value ? daysUntil(item.value.expiryDate) < 0 : false))

const sharer = computed(() => (item.value ? session.userById(item.value.sharerId) : null))
const reviewer = computed(() => (item.value?.reviewerId ? session.userById(item.value.reviewerId) : null))
const myActive = computed(() =>
  item.value ? itemsStore.activeRequestOfUser(item.value.id, me.id) : undefined
)

const canApply = computed(
  () =>
    !!item.value &&
    item.value.status === 'published' &&
    item.value.availableQty > 0 &&
    !expired.value &&
    me.role === 'resident' &&
    !isSharer.value &&
    !myActive.value
)

const applyOpen = ref(false)
const recallOpen = ref(false)
const recallReason = ref('')

function onApply(payload: { qty: number; scenario: ScenarioId; method: DeliveryMethod }): void {
  if (!item.value) return
  const req = itemsStore.applyForRequest({
    itemId: item.value.id,
    borrowerId: me.id,
    qty: payload.qty,
    scenario: payload.scenario,
    method: payload.method
  })
  applyOpen.value = false
  if (req) toast('申请已提交，等待共享人确认', 'success')
  else toast('暂时无法提交申请（库存不足或已有进行中申请）', 'error')
}

function doRecall(): void {
  if (!item.value) return
  if (!recallReason.value.trim()) {
    toast('请填写撤回原因', 'error')
    return
  }
  itemsStore.recallItem(item.value.id, recallReason.value.trim())
  recallOpen.value = false
  recallReason.value = ''
  toast('物品已撤回，相关申请已通知处理', 'warning')
}
</script>

<template>
  <div class="page" v-if="item && sharer">
    <button class="btn ghost sm mb-12" @click="router.back()">← 返回</button>

    <div v-if="expired" class="alert danger">
      <span class="alert-icon">⛔</span>
      <div>
        <p class="fw-600">该物品已超过有效期，已暂停一切借用与交接</p>
        <p>过期物品存在安全风险，社区将安排回收报废，请勿使用。</p>
      </div>
    </div>

    <div class="layout">
      <!-- 左：物品信息 -->
      <div class="main-col">
        <div class="card">
          <div class="flex-between item-head">
            <div class="flex-center gap-12">
              <span class="big-icon">{{ categoryIcon(item.category) }}</span>
              <div>
                <h1 class="item-title">{{ item.name }}</h1>
                <p class="small muted">{{ categoryName(item.category) }} · {{ item.spec }}</p>
              </div>
            </div>
            <StatusBadge :tone="ITEM_STATUS_META[item.status].tone" :label="ITEM_STATUS_META[item.status].label" />
          </div>

          <!-- 每次借用必看四要素 -->
          <div class="four-points">
            <div class="fp">
              <span class="fp-label">🏷️ 来源</span>
              <b>{{ sharer.name }}</b>
              <span class="small muted">{{ sharer.building }} · {{ sharer.phone }}</span>
            </div>
            <div class="fp">
              <span class="fp-label">⏳ 效期</span>
              <ExpiryBadge :date="item.expiryDate" />
              <span class="small muted">失效日期：{{ item.expiryDate }}</span>
            </div>
            <div class="fp">
              <span class="fp-label">📦 包装状态</span>
              <span class="badge green">整盒未开封</span>
              <span class="small muted">{{ storageName(item.storage) }}保存</span>
            </div>
            <div class="fp">
              <span class="fp-label">🚫 适用限制</span>
              <span class="small">{{ item.restrictions }}</span>
            </div>
          </div>

          <div class="divider"></div>

          <ul class="info-list">
            <li><span>可借数量</span>
              <b :class="{ 'text-danger': item.availableQty === 0 }">{{ item.availableQty }} / {{ item.quantity }} 件</b>
              <span class="small muted">（已确认的申请会锁定库存）</span>
            </li>
            <li><span>取用地点</span><b>{{ item.pickupLocation }}</b></li>
            <li><span>存放条件</span><b>{{ storageName(item.storage) }}</b></li>
            <li><span>适用场景</span><b>{{ item.scenarios.map(scenarioName).join('、') }}</b></li>
            <li v-if="reviewer"><span>审核人</span><b>{{ reviewer.name }}（{{ reviewer.role === 'staff' ? '社区工作人员' : '志愿者' }}）</b></li>
            <li v-if="item.rejectReason" class="reject-row"><span>未通过原因</span><b class="text-danger">{{ item.rejectReason }}</b></li>
            <li v-if="item.scrapReason" class="reject-row"><span>报废原因</span><b class="text-danger">{{ item.scrapReason }}</b></li>
            <li v-if="item.remarks"><span>共享留言</span><b>{{ item.remarks }}</b></li>
          </ul>

          <div class="action-row mt-16">
            <button v-if="canApply" class="btn" @click="applyOpen = true">🙋 我要借用</button>
            <div v-else-if="myActive" class="alert info mb-12" style="margin:0">
              <span class="alert-icon">✅</span>
              <div>您已有进行中的借用申请，可在下方“流转中的申请”或“我的借用”中查看进展。</div>
            </div>
            <button v-if="isSharer && ['published', 'fully_lent', 'pending_review'].includes(item.status)"
              class="btn warning" @click="recallOpen = true">撤回共享</button>
            <router-link v-if="me.role === 'resident' && !isSharer" class="btn secondary" to="/hall">看看其他物品</router-link>
          </div>
        </div>

        <!-- 安全声明 -->
        <SafetyBanner type="info" icon="🤝" title="互助边界">
          {{ DISCLAIMER_FULL }}
        </SafetyBanner>

        <!-- 流转中的申请 -->
        <h2 class="section-title">
          流转中的申请（{{ isSharer || isVolunteer ? activeRequests.length : visibleActiveRequests.length }}）
        </h2>
        <div v-if="!(isSharer || isVolunteer) && otherPendingCount" class="alert info">
          <span class="alert-icon">🙋</span>
          <div>另有 <strong>{{ otherPendingCount }}</strong> 位邻居正在申请该物品；共享人先确认的申请锁定库存，信息互相不可见。</div>
        </div>
        <div class="req-list">
          <RequestCard v-for="r in visibleActiveRequests" :key="r.id" :request="r" />
          <EmptyState v-if="visibleActiveRequests.length === 0" icon="🗒️" text="暂无进行中的申请" />
        </div>

        <!-- 历史申请（志愿者/社工/共享人可见） -->
        <template v-if="isVolunteer || isSharer">
          <h2 class="section-title">历史流转记录</h2>
          <div class="req-list">
            <RequestCard v-for="r in historyRequests" :key="r.id" :request="r" />
            <EmptyState v-if="historyRequests.length === 0" icon="📁" text="暂无历史记录" />
          </div>
        </template>
      </div>

      <!-- 右：时间线与反馈 -->
      <aside class="side-col">
        <div class="card">
          <h3 class="side-title">物品全流程记录</h3>
          <p class="small muted mb-12">登记 → 审核 → 借出 → 交接 → 归还/补充 → 报废/反馈，全程留痕。</p>
          <TimelineList :events="item.events" />
        </div>

        <div v-if="feedbacks.length" class="card mt-16">
          <h3 class="side-title">安全反馈（{{ feedbacks.length }}）</h3>
          <div v-for="f in feedbacks" :key="f.id" class="feedback-item">
            <div class="flex-between">
              <span class="badge" :class="f.type === 'adverse_reaction' ? 'red' : f.type === 'package_damaged' ? 'amber' : 'blue'">
                {{ f.type === 'adverse_reaction' ? '疑似不适反应' : f.type === 'package_damaged' ? '包装破损' : '其他反馈' }}
              </span>
              <span class="small muted">{{ session.userById(f.reporterId).name }}</span>
            </div>
            <p class="small mt-8">{{ f.description }}</p>
            <p v-if="f.handleNote" class="small text-success mt-8">社区处理：{{ f.handleNote }}</p>
          </div>
        </div>
      </aside>
    </div>

    <ApplyModal :visible="applyOpen" :item="item" :existing-active="myActive ?? null"
      @close="applyOpen = false" @submitted="onApply" />

    <Modal :visible="recallOpen" title="撤回共享物品" @close="recallOpen = false">
      <div class="alert warning">
        <span class="alert-icon">⚠️</span>
        <div>撤回后，待确认与待交接的申请将自动取消并通知借用人；配送中的申请会通知志愿者停止交接。</div>
      </div>
      <div class="field">
        <label>撤回原因<span class="req">*</span></label>
        <textarea v-model="recallReason" placeholder="如：家中仍需自用 / 发现包装有变化"></textarea>
      </div>
      <template #footer>
        <button class="btn secondary" @click="recallOpen = false">再想想</button>
        <button class="btn warning" @click="doRecall">确认撤回</button>
      </template>
    </Modal>
  </div>

  <div v-else class="page">
    <EmptyState icon="❓" text="物品不存在或已被移除">
      <router-link class="btn mt-12" to="/hall">回到互助大厅</router-link>
    </EmptyState>
  </div>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 16px; align-items: start; }
.item-head { margin-bottom: 16px; align-items: flex-start; }
.big-icon {
  width: 52px; height: 52px;
  background: var(--color-primary-soft);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
}
.item-title { font-size: 20px; }
.four-points { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.fp {
  background: #f8faf9;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fp-label { font-size: 12.5px; font-weight: 600; color: var(--color-text-2); }
.info-list { display: flex; flex-direction: column; gap: 10px; }
.info-list li { display: flex; gap: 12px; font-size: 13.5px; }
.info-list li span { width: 84px; flex-shrink: 0; color: var(--color-text-3); }
.info-list li b { font-weight: 500; }
.reject-row b { max-width: 460px; }
.action-row { display: flex; gap: 10px; flex-wrap: wrap; }
.section-title { font-size: 16px; margin: 24px 0 12px; }
.req-list { display: flex; flex-direction: column; gap: 12px; }
.side-title { font-size: 15px; margin-bottom: 4px; }
.feedback-item { padding: 10px 0; border-top: 1px dashed var(--color-border); }
.feedback-item:first-of-type { border-top: none; padding-top: 0; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .four-points { grid-template-columns: 1fr; }
}
</style>
