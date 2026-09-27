<script setup lang="ts">
import { computed } from 'vue'
import { useItemsStore } from '@/stores/items'
import { useSessionStore } from '@/stores/session'
import RequestCard from '@/components/RequestCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import SafetyBanner from '@/components/SafetyBanner.vue'

const itemsStore = useItemsStore()
const session = useSessionStore()

const myRequests = computed(() => itemsStore.requestsByBorrower(session.currentUserId).value)
const active = computed(() => myRequests.value.filter((r) => ['pending', 'approved', 'delivering', 'handed_over'].includes(r.status)))
const history = computed(() => myRequests.value.filter((r) => !['pending', 'approved', 'delivering', 'handed_over'].includes(r.status)))
</script>

<template>
  <div class="page">
    <h1 class="page-title">我的借用</h1>
    <p class="page-sub">跟踪申请、交接、归还/补充的每一步；遇到包装破损或不适请第一时间反馈。</p>

    <SafetyBanner type="info" icon="🔎">
      交接时请核对来源、效期、包装状态与适用限制；出现不适立即停用就医并在对应订单中反馈。
    </SafetyBanner>

    <h2 class="section-title">进行中（{{ active.length }}）</h2>
    <div v-if="active.length" class="req-list">
      <RequestCard v-for="r in active" :key="r.id" :request="r" />
    </div>
    <EmptyState v-else icon="🗒️" text="暂无进行中的借用申请。">
      <router-link class="btn mt-12" to="/hall">去互助大厅看看</router-link>
    </EmptyState>

    <h2 class="section-title">历史记录（{{ history.length }}）</h2>
    <div v-if="history.length" class="req-list">
      <RequestCard v-for="r in history" :key="r.id" :request="r" />
    </div>
    <EmptyState v-else icon="📁" text="暂无历史记录。" />
  </div>
</template>

<style scoped>
.section-title { font-size: 16px; margin: 24px 0 12px; }
.req-list { display: flex; flex-direction: column; gap: 12px; }
</style>
