<script setup lang="ts">
import { computed, ref } from 'vue'
import { categoryIcon, categoryName, storageName, BANNED_RULES } from '@/data/catalog'
import { isOverduePromise, useItemsStore } from '@/stores/items'
import { useSessionStore } from '@/stores/session'
import { useFeedbackStore } from '@/stores/feedback'
import { toast } from '@/composables/useToast'
import { daysUntil } from '@/utils/date'
import StatusBadge from '@/components/StatusBadge.vue'
import ExpiryBadge from '@/components/ExpiryBadge.vue'
import RequestCard from '@/components/RequestCard.vue'
import Modal from '@/components/Modal.vue'
import EmptyState from '@/components/EmptyState.vue'
import SafetyBanner from '@/components/SafetyBanner.vue'
import { FEEDBACK_STATUS_META, FEEDBACK_TYPE_META } from '@/data/labels'

const tab = ref<'review' | 'delivery' | 'feedback'>('review')

const itemsStore = useItemsStore()
const session = useSessionStore()
const feedbackStore = useFeedbackStore()

const pendingItems = computed(() => itemsStore.pendingReviewItems)

const deliveryTasks = computed(() =>
  itemsStore.deliveryTasks
    .filter((r) => {
      const item = itemsStore.getItem(r.itemId)
      return !!item
    })
    .sort((a, b) => (a.promisedBefore ?? 0) - (b.promisedBefore ?? 0))
)

const openFeedbacks = computed(() => feedbackStore.openFeedbacks)

const reviewTargetId = ref<string | null>(null)
const reviewTarget = computed(() => (reviewTargetId.value ? itemsStore.getItem(reviewTargetId.value) : null))
const rejectOpen = ref(false)
const rejectReason = ref('')

function openReview(id: string): void {
  reviewTargetId.value = id
}
function approve(): void {
  if (!reviewTarget.value) return
  itemsStore.reviewItem(reviewTarget.value.id, true)
  reviewTargetId.value = null
  toast('审核通过，已发布', 'success')
}
function openReject(): void {
  rejectReason.value = ''
  rejectOpen.value = true
}
function doReject(): void {
  if (!reviewTarget.value) return
  if (!rejectReason.value.trim()) {
    toast('请填写未通过原因，将反馈给共享人', 'error')
    return
  }
  itemsStore.reviewItem(reviewTarget.value.id, false, rejectReason.value.trim())
  rejectOpen.value = false
  reviewTargetId.value = null
  toast('已驳回并告知原因', 'warning')
}

function itemName(itemId: string): string {
  return itemsStore.getItem(itemId)?.name ?? '物品'
}
</script>

<template>
  <div class="page">
    <h1 class="page-title">志愿者中心</h1>
    <p class="page-sub">
      审核共享准入（效期 / 未开封 / 非处方非冷链）、承接代送、催办超时交接、初核安全反馈。
    </p>

    <SafetyBanner type="warning" icon="🛡️" title="审核红线：以下三类一律不得通过">
      <div class="banned-inline">
        <span v-for="r in BANNED_RULES" :key="r.title" class="tag">🚫 {{ r.title }}</span>
      </div>
    </SafetyBanner>

    <div class="seg mb-16">
      <button :class="{ active: tab === 'review' }" @click="tab = 'review'">
        待审核 <span v-if="pendingItems.length" class="seg-count">{{ pendingItems.length }}</span>
      </button>
      <button :class="{ active: tab === 'delivery' }" @click="tab = 'delivery'">
        配送/交接任务 <span v-if="deliveryTasks.length" class="seg-count">{{ deliveryTasks.length }}</span>
      </button>
      <button :class="{ active: tab === 'feedback' }" @click="tab = 'feedback'">
        安全反馈 <span v-if="openFeedbacks.length" class="seg-count danger">{{ openFeedbacks.length }}</span>
      </button>
    </div>

    <!-- 待审核 -->
    <div v-if="tab === 'review'">
      <div v-if="pendingItems.length" class="review-list">
        <div v-for="item in pendingItems" :key="item.id" class="card review-card">
          <div class="flex-between">
            <div class="flex-center gap-12">
              <span class="big-icon">{{ categoryIcon(item.category) }}</span>
              <div>
                <h3>{{ item.name }}</h3>
                <p class="small muted">{{ categoryName(item.category) }} · {{ item.spec }} · 数量 {{ item.quantity }}</p>
              </div>
            </div>
            <StatusBadge tone="amber" label="待审核" />
          </div>
          <ul class="kv-grid small mt-12">
            <li><span>有效期</span><ExpiryBadge :date="item.expiryDate" /></li>
            <li><span>存放条件</span><b>{{ storageName(item.storage) }}</b></li>
            <li><span>整盒未开封</span><b :class="item.sealedNew ? 'text-success' : 'text-danger'">{{ item.sealedNew ? '是' : '否（禁入）' }}</b></li>
            <li><span>登记人</span><b>{{ session.userById(item.sharerId).name }}（{{ session.userById(item.sharerId).building }}）</b></li>
            <li class="full"><span>取用地点</span><b>{{ item.pickupLocation }}</b></li>
            <li class="full"><span>适用限制</span><b>{{ item.restrictions || '未填写，审核时需补充' }}</b></li>
            <li v-if="item.remarks" class="full"><span>留言</span><b>{{ item.remarks }}</b></li>
          </ul>
          <div v-if="daysUntil(item.expiryDate) <= 30" class="alert warning mt-12">
            <span class="alert-icon">⏰</span>
            <div>效期不足 30 天，通过后请在物品页持续关注，借用人交接时需再次提示效期。</div>
          </div>
          <div class="flex gap-8 mt-12">
            <button class="btn sm" @click="openReview(item.id)">查看大图 / 逐项核对</button>
          </div>
        </div>
      </div>
      <EmptyState v-else icon="🎉" text="所有物品都已审核完毕，辛苦了！" />
    </div>

    <!-- 配送/交接 -->
    <div v-if="tab === 'delivery'">
      <div v-if="deliveryTasks.length" class="req-list">
        <div v-for="r in deliveryTasks" :key="r.id" class="task-wrap">
          <div v-if="isOverduePromise(r)" class="alert danger">
            <span class="alert-icon">⏱</span>
            <div>
              <strong>已超过约定交接时间</strong> ——
              {{ r.status === 'delivering' ? '请尽快送达或联系借用人改期' : '借用人迟迟未取，请催办；仍未完成可关闭申请释放库存' }}
            </div>
          </div>
          <RequestCard :request="r" />
        </div>
      </div>
      <EmptyState v-else icon="🚲" text="当前没有待接单或配送中的任务。" />
    </div>

    <!-- 反馈 -->
    <div v-if="tab === 'feedback'">
      <div v-if="openFeedbacks.length" class="feedback-list">
        <div v-for="f in openFeedbacks" :key="f.id" class="card">
          <div class="flex-between">
            <div class="flex-center gap-8 wrap">
              <span class="badge" :class="f.type === 'adverse_reaction' ? 'red' : f.type === 'package_damaged' ? 'amber' : 'blue'">
                {{ FEEDBACK_TYPE_META[f.type].label }}
              </span>
              <StatusBadge :tone="FEEDBACK_STATUS_META[f.status].tone" :label="FEEDBACK_STATUS_META[f.status].label" />
              <span class="small muted">{{ session.userById(f.reporterId).name }} · {{ itemName(f.itemId ?? '') }}</span>
            </div>
          </div>
          <p class="mt-12">{{ f.description }}</p>
          <div v-if="f.type === 'adverse_reaction'" class="alert danger mt-12">
            <span class="alert-icon">🚨</span>
            <div>疑似不适反应须<strong>立即上报社区工作人员</strong>，建议同步回访当事人是否已停用就医。</div>
          </div>
          <div class="flex gap-8 mt-12">
            <button v-if="f.status === 'open'" class="btn sm warning" @click="feedbackStore.startHandle(f.id); toast('已开始核实', 'info')">
              开始核实
            </button>
            <router-link class="btn sm secondary" :to="`/staff`">联系社区结案 / 下架</router-link>
          </div>
        </div>
      </div>
      <EmptyState v-else icon="🩹" text="没有待处理的安全反馈。" />
    </div>

    <!-- 审核详情弹窗 -->
    <Modal :visible="!!reviewTarget" :title="reviewTarget ? `审核：${reviewTarget.name}` : ''" width="640px"
      @close="reviewTargetId = null">
      <template v-if="reviewTarget">
        <div class="review-checklist">
          <label class="checkbox-row"><input type="checkbox" checked /> 物品为<strong>整盒未开封</strong>，外包装完好无受潮破损</label>
          <label class="checkbox-row"><input type="checkbox" checked /> 不属于处方药、口服药、针剂等<strong>禁入类别</strong></label>
          <label class="checkbox-row"><input type="checkbox" checked /> 非<strong>冷链</strong>保存物品，存放条件与实际相符</label>
          <label class="checkbox-row"><input type="checkbox" :checked="daysUntil(reviewTarget.expiryDate) > 30" :readonly="true" />
            有效期充足（当前：<ExpiryBadge :date="reviewTarget.expiryDate" />）
          </label>
          <label class="checkbox-row"><input type="checkbox" checked /> 品名、规格、数量、取用地点填写完整，适用限制已告知</label>
        </div>
        <div class="alert info">
          <span class="alert-icon">ℹ️</span>
          <div>登记人：{{ session.userById(reviewTarget.sharerId).name }}；审核通过后物品进入互助大厅，借用人每次都可查看来源、效期、包装状态与限制。</div>
        </div>
      </template>
      <template #footer>
        <button class="btn danger" @click="openReject">审核不通过</button>
        <button class="btn secondary" @click="reviewTargetId = null">稍后处理</button>
        <button class="btn" @click="approve">审核通过，发布</button>
      </template>
    </Modal>

    <Modal :visible="rejectOpen" title="审核未通过原因" @close="rejectOpen = false">
      <div class="field">
        <label>请说明原因（将通知共享人）<span class="req">*</span></label>
        <textarea v-model="rejectReason" placeholder="如：物品已拆封 / 属于口服药不能共享 / 有效期不足"></textarea>
      </div>
      <template #footer>
        <button class="btn secondary" @click="rejectOpen = false">取消</button>
        <button class="btn danger" @click="doReject">确认驳回</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.seg-count {
  display: inline-block;
  background: var(--color-accent);
  color: #fff;
  border-radius: 999px;
  font-size: 11px;
  padding: 0 6px;
  margin-left: 4px;
}
.seg-count.danger { background: var(--color-danger); }
.big-icon {
  width: 42px; height: 42px;
  background: var(--color-primary-soft);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.kv-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; }
.kv-grid li { display: flex; gap: 8px; align-items: center; }
.kv-grid .full { grid-column: 1 / -1; }
.kv-grid span { color: var(--color-text-3); min-width: 72px; }
.kv-grid b { font-weight: 500; }
.review-checklist { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.banned-inline { display: flex; gap: 8px; flex-wrap: wrap; }
.req-list { display: flex; flex-direction: column; gap: 12px; }
.task-wrap { display: flex; flex-direction: column; gap: 8px; }
</style>
