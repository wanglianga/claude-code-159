<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ScenarioId } from '@/types'
import { SCENARIOS } from '@/data/catalog'
import { daysUntil } from '@/utils/date'
import { useItemsStore } from '@/stores/items'
import ItemCard from '@/components/ItemCard.vue'
import SafetyBanner from '@/components/SafetyBanner.vue'
import EmptyState from '@/components/EmptyState.vue'

const itemsStore = useItemsStore()

const activeScenario = ref<ScenarioId | null>(null)
const keyword = ref('')
const includeLent = ref(true)

const activeScenarioMeta = computed(() => SCENARIOS.find((s) => s.id === activeScenario.value))

const filtered = computed(() => {
  return itemsStore.publishedItems.filter((item) => {
    if (!includeLent.value && item.status !== 'published') return false
    // 过期物品在大厅不展示（已自动暂停借用），仅在工作台处理
    if (daysUntil(item.expiryDate) < 0) return false
    if (activeScenario.value && !item.scenarios.includes(activeScenario.value)) return false
    if (keyword.value.trim()) {
      const k = keyword.value.trim()
      if (!`${item.name}${item.spec}${item.restrictions}`.includes(k)) return false
    }
    return true
  })
})

function selectScenario(id: ScenarioId): void {
  activeScenario.value = activeScenario.value === id ? null : id
}
</script>

<template>
  <div class="page">
    <SafetyBanner type="warning" icon="🩺" title="共享物品不替代就医">
      本平台只帮助邻里流转<strong>未拆封</strong>的常备用品并提示风险，不做诊断建议。
      <strong>处方药、拆封药品和冷链药品不能进入共享。</strong>症状严重或持续不缓解请及时就医。
    </SafetyBanner>

    <h1 class="page-title">按症状场景找应急物品</h1>
    <p class="page-sub">先选场景，再核对每件物品的来源、效期、包装状态与适用限制。</p>

    <div class="scenario-grid">
      <button
        v-for="s in SCENARIOS"
        :key="s.id"
        class="scenario-card"
        :class="{ selected: activeScenario === s.id }"
        @click="selectScenario(s.id)"
      >
        <span class="sc-icon">{{ s.icon }}</span>
        <span class="sc-name">{{ s.name }}</span>
        <span class="sc-desc">{{ s.desc }}</span>
      </button>
    </div>

    <div v-if="activeScenarioMeta" class="alert info mt-12">
      <span class="alert-icon">💡</span>
      <div>
        <p class="fw-600">{{ activeScenarioMeta.name }} · 安全提示</p>
        <p>{{ activeScenarioMeta.safety }}</p>
      </div>
    </div>

    <div class="flex-between filter-bar">
      <input v-model="keyword" type="text" placeholder="搜索品名 / 规格，如“退热贴”“纱布”" class="search-input" />
      <label class="checkbox-row">
        <input v-model="includeLent" type="checkbox" />
        <span class="small">显示已全部借出（可关注归还补充）</span>
      </label>
    </div>

    <p class="small muted mb-12">共 {{ filtered.length }} 件物品{{ activeScenarioMeta ? ` · 场景：${activeScenarioMeta.name}` : '' }}</p>

    <div v-if="filtered.length" class="grid grid-3">
      <ItemCard v-for="item in filtered" :key="item.id" :item="item" />
    </div>
    <EmptyState v-else icon="🔍" text="当前场景暂无可借物品，可以换个场景，或到“登记物品”把家中富余的未拆封用品共享出来。">
      <router-link class="btn mt-12" to="/register">去登记共享</router-link>
    </EmptyState>

    <div class="card mt-24 boundary-card">
      <h3>🤝 邻里互助的边界</h3>
      <ul>
        <li><strong>社区只做物品流转和风险提醒，不做诊断建议</strong>，是否使用请自行判断或咨询医生。</li>
        <li>仅限<strong>整盒未开封、非处方、非冷链</strong>的常备外用物品与耗材；处方药、口服药、拆封药品、冷链药品禁入。</li>
        <li>每次借用均可查看物品的<strong>来源、效期、包装状态、适用限制</strong>与完整流转记录。</li>
        <li>出现包装破损或任何不适反应，请立即停用并在订单中反馈，社区会第一时间下架核实。</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.scenario-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.scenario-card {
  text-align: left;
  background: #fff;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.15s, background 0.15s, transform 0.15s;
}
.scenario-card:hover { border-color: #9fc7b6; transform: translateY(-1px); }
.scenario-card.selected { border-color: var(--color-primary); background: var(--color-primary-soft); }
.sc-icon { font-size: 24px; }
.sc-name { font-weight: 600; font-size: 14.5px; }
.sc-desc { font-size: 12px; color: var(--color-text-2); }
.filter-bar { margin: 20px 0 10px; gap: 16px; }
.search-input { max-width: 320px; }
.boundary-card h3 { margin-bottom: 10px; font-size: 15px; }
.boundary-card ul { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--color-text-2); }
@media (max-width: 860px) {
  .scenario-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
