<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { BorrowRequest, DeliveryMethod, Item, ScenarioId } from '@/types'
import { SCENARIOS } from '@/data/catalog'
import { DELIVERY_METHOD_META } from '@/data/labels'
import Modal from './Modal.vue'
import { toast } from '@/composables/useToast'

const props = defineProps<{ visible: boolean; item: Item; existingActive?: BorrowRequest | null }>()
const emit = defineEmits<{
  close: []
  submitted: [payload: { qty: number; scenario: ScenarioId; method: DeliveryMethod }]
}>()

const qty = ref(1)
const scenario = ref<ScenarioId>('fever_night')
const method = ref<DeliveryMethod>('pickup')
const confirmed = ref(false)

watch(
  () => props.visible,
  (v) => {
    if (v) {
      qty.value = 1
      scenario.value = props.item.scenarios[0] ?? 'home_care'
      method.value = 'pickup'
      confirmed.value = false
    }
  }
)

const validScenarios = computed(() => SCENARIOS.filter((s) => props.item.scenarios.includes(s.id)))
const canSubmit = computed(() => qty.value >= 1 && qty.value <= props.item.availableQty && confirmed.value)

function submit(): void {
  if (!canSubmit.value) {
    toast('请核对数量并勾选安全确认', 'error')
    return
  }
  emit('submitted', { qty: qty.value, scenario: scenario.value, method: method.value })
}
</script>

<template>
  <Modal :visible="visible" title="申请借用" @close="emit('close')">
    <div v-if="existingActive" class="alert warning">
      <span class="alert-icon">🙋</span>
      <div>您已有一笔针对该物品的进行中申请（状态：{{ existingActive.status === 'pending' ? '待共享人确认' : '交接流程中' }}），请勿重复申请。</div>
    </div>
    <template v-else>
      <div class="apply-item">
        <h3>{{ item.name }}</h3>
        <p class="small muted">{{ item.spec }} · 当前可借 {{ item.availableQty }} 件</p>
      </div>

      <div class="field">
        <label>借用数量<span class="req">*</span></label>
        <input v-model.number="qty" type="number" min="1" :max="item.availableQty" />
        <p class="hint">多人同时申请时，共享人先确认的申请锁定库存；数量不足时您的申请会收到提示。</p>
      </div>

      <div class="field">
        <label>使用场景<span class="req">*</span></label>
        <div class="m-list">
          <label v-for="s in validScenarios" :key="s.id" class="radio-card" :class="{ selected: scenario === s.id }">
            <input v-model="scenario" :value="s.id" type="radio" hidden />
            <div class="rc-title">{{ s.icon }} {{ s.name }}</div>
            <div class="rc-desc">{{ s.safety }}</div>
          </label>
        </div>
      </div>

      <div class="field">
        <label>交接方式<span class="req">*</span></label>
        <div class="m-list">
          <label v-for="(meta, key) in DELIVERY_METHOD_META" :key="key" class="radio-card" :class="{ selected: method === key }">
            <input v-model="method" :value="key" type="radio" hidden />
            <div class="rc-title">{{ meta.icon }} {{ meta.label }}</div>
          </label>
        </div>
        <p class="hint">选择志愿者代送后，志愿者会在志愿者中心接单；门口交接请拍照确认。</p>
      </div>

      <div class="alert info">
        <span class="alert-icon">🔎</span>
        <div>
          交接时请当面/拍照核对：<strong>来源、有效期、包装是否整盒未开封、适用限制</strong>。
          共享物品不替代就医，社区不提供诊断建议。
        </div>
      </div>

      <label class="checkbox-row">
        <input v-model="confirmed" type="checkbox" />
        <span>我已知晓该物品仅作应急共享，使用前会核对效期与包装；出现不适立即停用就医并反馈。</span>
      </label>
    </template>

    <template #footer>
      <button class="btn secondary" @click="emit('close')">关闭</button>
      <button v-if="!existingActive" class="btn" :disabled="!canSubmit" @click="submit">提交申请</button>
    </template>
  </Modal>
</template>

<style scoped>
.apply-item { margin-bottom: 14px; }
.m-list { display: flex; flex-direction: column; gap: 8px; }
</style>
