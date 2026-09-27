<script setup lang="ts">
import { computed, ref } from 'vue'
import { categoryIcon, categoryName } from '@/data/catalog'
import { useItemsStore, isOverduePromise } from '@/stores/items'
import { useFeedbackStore } from '@/stores/feedback'
import { useSessionStore } from '@/stores/session'
import { daysUntil } from '@/utils/date'
import { toast } from '@/composables/useToast'
import { FEEDBACK_STATUS_META, FEEDBACK_TYPE_META, ITEM_STATUS_META } from '@/data/labels'
import Modal from '@/components/Modal.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ExpiryBadge from '@/components/ExpiryBadge.vue'
import EmptyState from '@/components/EmptyState.vue'
import SafetyBanner from '@/components/SafetyBanner.vue'
import TimelineList from '@/components/TimelineList.vue'

const itemsStore = useItemsStore()
const feedbackStore = useFeedbackStore()
const session = useSessionStore()

// ---- 统计 ----
const stats = computed(() => {
  const items = itemsStore.items
  return {
    total: items.length,
    published: items.filter((i) => i.status === 'published').length,
    pendingReview: items.filter((i) => i.status === 'pending_review').length,
    activeLending: itemsStore.requests.filter((r) => ['approved', 'delivering', 'handed_over'].includes(r.status)).length,
    expired: items.filter((i) => ['published', 'fully_lent', 'pending_review'].includes(i.status) && daysUntil(i.expiryDate) < 0).length,
    near: items.filter((i) => ['published', 'fully_lent'].includes(i.status) && daysUntil(i.expiryDate) >= 0 && daysUntil(i.expiryDate) <= 30).length,
    openFeedback: feedbackStore.openFeedbacks.length,
    overdueTasks: itemsStore.requests.filter((r) => isOverduePromise(r)).length,
    scrapped: items.filter((i) => i.status === 'scrapped').length
  }
})

// ---- 效期预警 ----
const expiryWarnings = computed(() =>
  itemsStore.items
    .filter((i) => ['published', 'fully_lent', 'pending_review'].includes(i.status))
    .filter((i) => daysUntil(i.expiryDate) <= 30)
    .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))
)

// ---- 超时任务 ----
const overdueTasks = computed(() =>
  itemsStore.requests.filter((r) => isOverduePromise(r))
)

// ---- 报废弹窗 ----
const scrapTargetId = ref<string | null>(null)
const scrapTarget = computed(() => (scrapTargetId.value ? itemsStore.getItem(scrapTargetId.value) : null))
const scrapReason = ref('')
function openScrap(id: string, preset?: string): void {
  scrapTargetId.value = id
  scrapReason.value = preset ?? ''
}
function doScrap(): void {
  if (!scrapTarget.value) return
  if (!scrapReason.value.trim()) {
    toast('请填写报废原因并完成留痕', 'error')
    return
  }
  itemsStore.scrapItem(scrapTarget.value.id, scrapReason.value.trim())
  scrapTargetId.value = null
  toast('物品已报废，相关申请已取消并通知各方', 'warning')
}

// ---- 反馈处理 ----
const feedbackTab = ref<'open' | 'all'>('open')
const feedbackList = computed(() =>
  feedbackTab.value === 'open' ? feedbackStore.openFeedbacks : feedbackStore.allFeedbacks
)
const resolveTargetId = ref<string | null>(null)
const resolveTarget = computed(() => feedbackStore.feedbacks.find((f) => f.id === resolveTargetId.value))
const resolveNote = ref('')
const scrapLinked = ref(false)
const scrapLinkedReason = ref('')
function openResolve(id: string): void {
  const f = feedbackStore.feedbacks.find((x) => x.id === id)
  resolveTargetId.value = id
  resolveNote.value = ''
  scrapLinked.value = f?.type === 'adverse_reaction'
  scrapLinkedReason.value = f ? '根据用户反馈，社区核实后下架报废同批次物品' : ''
}
function doResolve(): void {
  if (!resolveTarget.value) return
  if (!resolveNote.value.trim()) {
    toast('请填写处理说明（将反馈给居民并留痕）', 'error')
    return
  }
  feedbackStore.resolve({
    id: resolveTarget.value.id,
    note: resolveNote.value.trim(),
    scrapItem: scrapLinked.value,
    scrapReason: scrapLinkedReason.value.trim()
  })
  resolveTargetId.value = null
  toast('反馈已结案，处理结果已通知反馈人', 'success')
}

function itemName(id?: string): string {
  return id ? itemsStore.getItem(id)?.name ?? '物品' : '物品'
}

// ---- 全部流转物品（审计视图） ----
const auditItems = computed(() =>
  [...itemsStore.items].sort((a, b) => b.createdAt - a.createdAt)
)
const auditOpen = ref<string | null>(null)
const auditTarget = computed(() => (auditOpen.value ? itemsStore.getItem(auditOpen.value) : null))
</script>

<template>
  <div class="page">
    <h1 class="page-title">社区工作台</h1>
    <p class="page-sub">社区工作人员视角：风险预警总览、效期与报废管理、反馈升级处置、全流程审计留痕。</p>

    <SafetyBanner type="info" icon="🏛️" title="职责边界">
      社区只负责<strong>物品流转组织、风险提醒与安全兜底</strong>（过期/破损/不适反应物品下架报废），
      不提供任何诊断或用药建议；健康问题请居民联系社区卫生服务中心或就医。
    </SafetyBanner>

    <!-- 指标 -->
    <div class="stat-grid">
      <div class="stat card"><span class="stat-num">{{ stats.published }}</span><span class="stat-label">在架可借</span></div>
      <div class="stat card"><span class="stat-num">{{ stats.activeLending }}</span><span class="stat-label">流转中借用</span></div>
      <div class="stat card" :class="{ alert: stats.pendingReview }"><span class="stat-num text-warning">{{ stats.pendingReview }}</span><span class="stat-label">待审核</span></div>
      <div class="stat card" :class="{ alert: stats.expired }"><span class="stat-num text-danger">{{ stats.expired }}</span><span class="stat-label">已过期待报废</span></div>
      <div class="stat card" :class="{ alert: stats.near }"><span class="stat-num text-warning">{{ stats.near }}</span><span class="stat-label">30天内到期</span></div>
      <div class="stat card" :class="{ alert: stats.overdueTasks }"><span class="stat-num text-danger">{{ stats.overdueTasks }}</span><span class="stat-label">超时交接任务</span></div>
      <div class="stat card" :class="{ alert: stats.openFeedback }"><span class="stat-num text-danger">{{ stats.openFeedback }}</span><span class="stat-label">待处理反馈</span></div>
      <div class="stat card"><span class="stat-num">{{ stats.scrapped }}</span><span class="stat-label">已报废留痕</span></div>
    </div>

    <!-- 效期与超时预警 -->
    <div class="grid grid-2 mt-16">
      <div class="card">
        <h2 class="block-title">⏰ 效期预警（{{ expiryWarnings.length }}）</h2>
        <div v-if="expiryWarnings.length" class="warn-list">
          <div v-for="i in expiryWarnings" :key="i.id" class="warn-row">
            <div class="grow">
              <router-link :to="`/items/${i.id}`" class="fw-600">{{ i.name }}</router-link>
              <div class="small muted">{{ i.spec }} · 库存 {{ i.availableQty }}/{{ i.quantity }}</div>
              <div class="mt-8"><ExpiryBadge :date="i.expiryDate" /></div>
            </div>
            <div class="flex gap-8">
              <router-link class="btn sm secondary" :to="`/items/${i.id}`">查看</router-link>
              <button class="btn sm danger" @click="openScrap(i.id, daysUntil(i.expiryDate) < 0 ? '已超过有效期，社区回收报废，禁止继续流转' : '临近有效期且未完成流转，回收报废')">
                报废
              </button>
            </div>
          </div>
        </div>
        <EmptyState v-else icon="✅" text="效期状态良好。" />
      </div>

      <div class="card">
        <h2 class="block-title">⏱ 超时未取 / 配送延误（{{ overdueTasks.length }}）</h2>
        <div v-if="overdueTasks.length" class="warn-list">
          <div v-for="r in overdueTasks" :key="r.id" class="warn-row">
            <div class="grow">
              <span class="badge red">{{ r.status === 'delivering' ? '配送延误' : '迟迟未取' }}</span>
              <div class="fw-600 mt-8">{{ itemName(r.itemId) }} × {{ r.qty }}</div>
              <div class="small muted">借用人：{{ session.userById(r.borrowerId).name }}</div>
            </div>
            <div class="flex gap-8">
              <button class="btn sm warning" @click="itemsStore.urge(r.id); toast('已催办', 'warning')">催办</button>
              <button class="btn sm danger" @click="itemsStore.closeOverdue(r.id); toast('已关闭并释放库存', 'error')">关闭释放库存</button>
            </div>
          </div>
        </div>
        <EmptyState v-else icon="🚲" text="没有超时任务。" />
      </div>
    </div>

    <!-- 反馈处置 -->
    <div class="card mt-16">
      <div class="flex-between mb-12">
        <h2 class="block-title" style="margin:0">🚨 居民反馈处置</h2>
        <div class="seg">
          <button :class="{ active: feedbackTab === 'open' }" @click="feedbackTab = 'open'">待处理 {{ feedbackStore.openFeedbacks.length }}</button>
          <button :class="{ active: feedbackTab === 'all' }" @click="feedbackTab = 'all'">全部 {{ feedbackStore.allFeedbacks.length }}</button>
        </div>
      </div>
      <div v-if="feedbackList.length" class="feedback-table">
        <div v-for="f in feedbackList" :key="f.id" class="fb-row">
          <div class="grow">
            <div class="flex-center wrap gap-8">
              <span class="badge" :class="f.type === 'adverse_reaction' ? 'red' : f.type === 'package_damaged' ? 'amber' : 'blue'">
                {{ FEEDBACK_TYPE_META[f.type].label }}
              </span>
              <StatusBadge :tone="FEEDBACK_STATUS_META[f.status].tone" :label="FEEDBACK_STATUS_META[f.status].label" />
              <span class="small muted">{{ session.userById(f.reporterId).name }} · {{ itemName(f.itemId) }}</span>
            </div>
            <p class="small mt-8">{{ f.description }}</p>
            <p v-if="f.handleNote" class="small text-success mt-8">处理记录：{{ f.handleNote }}</p>
          </div>
          <div class="flex gap-8">
            <button v-if="f.status === 'open'" class="btn sm warning" @click="feedbackStore.startHandle(f.id); toast('已开始核实', 'info')">开始核实</button>
            <button v-if="f.status !== 'resolved' && f.status !== 'escalated'" class="btn sm" @click="openResolve(f.id)">结案 / 升级处理</button>
            <button v-else class="btn sm secondary" @click="openResolve(f.id)">查看处理</button>
          </div>
        </div>
      </div>
      <EmptyState v-else icon="🩹" text="暂无反馈。" />
    </div>

    <!-- 审计视图 -->
    <div class="card mt-16">
      <h2 class="block-title">📒 物品流转审计（{{ auditItems.length }}）</h2>
      <p class="small muted mb-12">同一件物品的登记、审核、借出、交接、归还、报废、反馈全程串联可追溯。</p>
      <div class="audit-list">
        <button v-for="i in auditItems" :key="i.id" class="audit-row" @click="auditOpen = i.id">
          <span class="a-icon">{{ categoryIcon(i.category) }}</span>
          <span class="grow a-name">{{ i.name }} <small class="muted">{{ categoryName(i.category) }} · {{ i.spec }}</small></span>
          <ExpiryBadge :date="i.expiryDate" />
          <StatusBadge :tone="ITEM_STATUS_META[i.status].tone" :label="ITEM_STATUS_META[i.status].label" />
          <span class="chev">›</span>
        </button>
      </div>
    </div>

    <!-- 报废弹窗 -->
    <Modal :visible="!!scrapTarget" title="物品报废处理" @close="scrapTargetId = null">
      <template v-if="scrapTarget">
        <div class="alert danger">
          <span class="alert-icon">⛔</span>
          <div>报废后物品立即下架，进行中的申请/配送全部取消并通知借用人与志愿者停止交接。操作全程留痕。</div>
        </div>
        <p class="mb-12"><strong>{{ scrapTarget.name }}</strong>（{{ scrapTarget.spec }}）</p>
        <div class="field">
          <label>报废原因<span class="req">*</span></label>
          <textarea v-model="scrapReason" placeholder="如：已过期 / 包装破损污染 / 疑似不适反应同批回收"></textarea>
        </div>
      </template>
      <template #footer>
        <button class="btn secondary" @click="scrapTargetId = null">取消</button>
        <button class="btn danger" @click="doScrap">确认报废并通知各方</button>
      </template>
    </Modal>

    <!-- 反馈结案弹窗 -->
    <Modal :visible="!!resolveTarget" :title="resolveTarget ? `反馈结案：${FEEDBACK_TYPE_META[resolveTarget.type].label}` : ''"
      @close="resolveTargetId = null">
      <template v-if="resolveTarget">
        <p class="mb-12">{{ resolveTarget.description }}</p>
        <div v-if="resolveTarget.type === 'adverse_reaction'" class="alert danger">
          <span class="alert-icon">🚨</span>
          <div>
            疑似不适反应按<strong>升级处理</strong>记录：请回访居民是否已停用就医，
            并建议<strong>联动物品下架报废</strong>，防止其他居民继续使用。
          </div>
        </div>
        <div class="field">
          <label>处理说明（同步给反馈人并留痕）<span class="req">*</span></label>
          <textarea v-model="resolveNote" placeholder="如：已电话回访，建议停用就医；同批次物品已下架回收报废"></textarea>
        </div>
        <div v-if="resolveTarget.itemId && itemsStore.getItem(resolveTarget.itemId)?.status !== 'scrapped'" class="field">
          <label class="checkbox-row">
            <input v-model="scrapLinked" type="checkbox" />
            <span>同时将关联物品<strong class="text-danger">下架报废</strong>（包装破损 / 不适反应建议勾选）</span>
          </label>
          <textarea v-if="scrapLinked" v-model="scrapLinkedReason" class="mt-8" placeholder="报废原因"></textarea>
        </div>
      </template>
      <template #footer>
        <button class="btn secondary" @click="resolveTargetId = null">取消</button>
        <button class="btn" @click="doResolve">确认结案并通知居民</button>
      </template>
    </Modal>

    <!-- 审计详情 -->
    <Modal :visible="!!auditTarget" :title="auditTarget ? `流转记录：${auditTarget.name}` : ''" width="620px"
      @close="auditOpen = null">
      <template v-if="auditTarget">
        <div class="flex-center wrap gap-8 mb-12">
          <StatusBadge :tone="ITEM_STATUS_META[auditTarget.status].tone" :label="ITEM_STATUS_META[auditTarget.status].label" />
          <ExpiryBadge :date="auditTarget.expiryDate" />
          <span class="tag">来源：{{ session.userById(auditTarget.sharerId).name }}</span>
        </div>
        <TimelineList :events="auditTarget.events" />
        <router-link class="btn secondary mt-16" :to="`/items/${auditTarget.id}`" @click="auditOpen = null">进入物品完整页面</router-link>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px; }
.stat.alert { border: 1px solid #f0d9b5; background: #fffdf8; }
.stat-num { font-size: 26px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 12.5px; color: var(--color-text-2); }
.block-title { font-size: 16px; margin-bottom: 12px; }
.warn-list { display: flex; flex-direction: column; gap: 12px; }
.warn-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-top: 1px dashed var(--color-border); }
.warn-row:first-child { border-top: none; padding-top: 0; }
.fb-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 12px 0; border-top: 1px dashed var(--color-border); }
.fb-row:first-child { border-top: none; padding-top: 0; }
.audit-list { display: flex; flex-direction: column; }
.audit-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 8px;
  background: none; border: none; border-bottom: 1px solid var(--color-border);
  text-align: left; width: 100%;
}
.audit-row:hover { background: #f8faf9; }
.a-icon { font-size: 20px; }
.a-name { font-size: 13.5px; }
.a-name small { margin-left: 6px; }
.chev { color: var(--color-text-3); font-size: 18px; }
@media (max-width: 860px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
