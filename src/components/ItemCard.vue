<script setup lang="ts">
import { computed } from 'vue'
import type { Item } from '@/types'
import { categoryIcon, categoryName, scenarioName, storageName } from '@/data/catalog'
import { ITEM_STATUS_META } from '@/data/labels'
import { daysUntil } from '@/utils/date'
import { useItemsStore } from '@/stores/items'
import { useSessionStore } from '@/stores/session'
import StatusBadge from './StatusBadge.vue'
import ExpiryBadge from './ExpiryBadge.vue'

const props = defineProps<{ item: Item }>()
const itemsStore = useItemsStore()
const session = useSessionStore()

const statusMeta = computed(() => ITEM_STATUS_META[props.item.status])
const expired = computed(() => daysUntil(props.item.expiryDate) < 0)
const scenarioNames = computed(() => props.item.scenarios.map(scenarioName).join(' / '))
const sharer = computed(() => session.userById(props.item.sharerId))
const pendingCount = computed(
  () => itemsStore.requestsOfItem(props.item.id).filter((r) => r.status === 'pending').length
)
</script>

<template>
  <router-link :to="`/items/${item.id}`" class="item-card card">
    <div class="card-top">
      <span class="cat-icon">{{ categoryIcon(item.category) }}</span>
      <div class="grow minw0">
        <div class="flex-between">
          <h3 class="item-name">{{ item.name }}</h3>
          <StatusBadge :tone="statusMeta.tone" :label="statusMeta.label" />
        </div>
        <p class="small muted spec">{{ categoryName(item.category) }} · {{ item.spec }}</p>
      </div>
    </div>

    <div class="badge-line">
      <ExpiryBadge :date="item.expiryDate" />
      <span v-if="expired" class="badge red">⛔ 已暂停借用</span>
      <span class="badge teal">📦 整盒未开封</span>
      <span v-if="pendingCount > 0" class="badge amber">🙋 {{ pendingCount }} 人申请中</span>
    </div>

    <ul class="kv small">
      <li><span>存放条件</span><b>{{ storageName(item.storage) }}</b></li>
      <li><span>可借数量</span>
        <b :class="{ 'text-danger': item.availableQty === 0 }">
          {{ item.availableQty }} / {{ item.quantity }} 件
        </b>
      </li>
      <li class="full"><span>来源</span><b>{{ sharer.name }}（{{ sharer.building }}）</b></li>
      <li class="full"><span>取用地点</span><b>{{ item.pickupLocation }}</b></li>
      <li v-if="scenarioNames" class="full"><span>适用场景</span><b>{{ scenarioNames }}</b></li>
    </ul>

    <div class="restriction small">
      <span>🚫 适用限制：</span>{{ item.restrictions || '请按说明书使用，如有不适立即停用就医' }}
    </div>
  </router-link>
</template>

<style scoped>
.item-card {
  display: block;
  padding: 16px;
  color: var(--color-text);
  transition: box-shadow 0.15s, transform 0.15s;
}
.item-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.card-top { display: flex; gap: 12px; }
.cat-icon {
  width: 42px; height: 42px; flex-shrink: 0;
  background: var(--color-primary-soft);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
.minw0 { min-width: 0; }
.item-name { font-size: 15.5px; }
.spec { margin-top: 2px; }
.badge-line { display: flex; gap: 6px; flex-wrap: wrap; margin: 10px 0; }
.kv { display: flex; flex-wrap: wrap; gap: 4px 16px; }
.kv li { display: flex; gap: 6px; }
.kv li.full { width: 100%; }
.kv span { color: var(--color-text-3); flex-shrink: 0; }
.kv b { font-weight: 500; text-align: right; }
.restriction {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-border);
  color: var(--color-warning);
}
</style>
