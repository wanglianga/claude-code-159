<script setup lang="ts">
import { computed } from 'vue'
import { useItemsStore } from '@/stores/items'
import { useSessionStore } from '@/stores/session'
import ItemCard from '@/components/ItemCard.vue'
import RequestCard from '@/components/RequestCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import ExpiryBadge from '@/components/ExpiryBadge.vue'
import { daysUntil } from '@/utils/date'

const itemsStore = useItemsStore()
const session = useSessionStore()

const myItems = computed(() => itemsStore.itemsBySharer(session.currentUserId).value)

/** 需要我处理的申请：待确认 + 已确认但超时 */
const pendingApprove = computed(() =>
  myItems.value.flatMap((i) =>
    itemsStore.requestsOfItem(i.id).filter((r) => ['pending', 'approved', 'delivering', 'handed_over'].includes(r.status))
  )
)

const nearExpiry = computed(() =>
  myItems.value.filter((i) => ['published', 'fully_lent', 'pending_review'].includes(i.status) && daysUntil(i.expiryDate) <= 30)
)
</script>

<template>
  <div class="page">
    <h1 class="page-title">我共享的物品</h1>
    <p class="page-sub">及时确认邻居的申请；效期临近的物品请优先流转，到期未借出将由社区统一报废。</p>

    <div v-if="nearExpiry.length" class="alert warning">
      <span class="alert-icon">⏰</span>
      <div>
        <p class="fw-600">效期提醒（{{ nearExpiry.length }} 件临近/已过期）</p>
        <div v-for="i in nearExpiry" :key="i.id" class="flex-between expiry-line">
          <span>{{ i.name }}（{{ i.spec }}）</span>
          <ExpiryBadge :date="i.expiryDate" />
        </div>
      </div>
    </div>

    <h2 class="section-title">待我处理的借用与交接（{{ pendingApprove.length }}）</h2>
    <div v-if="pendingApprove.length" class="req-list">
      <RequestCard v-for="r in pendingApprove" :key="r.id" :request="r" />
    </div>
    <EmptyState v-else icon="✅" text="目前没有需要处理的申请与交接。" />

    <h2 class="section-title">我登记的全部物品（{{ myItems.length }}）</h2>
    <div v-if="myItems.length" class="grid grid-3">
      <ItemCard v-for="i in myItems" :key="i.id" :item="i" />
    </div>
    <EmptyState v-else icon="🧺" text="您还没有登记过共享物品。">
      <router-link class="btn mt-12" to="/register">去登记</router-link>
    </EmptyState>
  </div>
</template>

<style scoped>
.section-title { font-size: 16px; margin: 24px 0 12px; }
.req-list { display: flex; flex-direction: column; gap: 12px; }
.expiry-line { margin-top: 6px; gap: 12px; }
</style>
