<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BorrowRequest, SettlePlan } from '@/types'
import { SETTLE_PLAN_META } from '@/data/labels'
import Modal from './Modal.vue'
import PhotoCapture from './PhotoCapture.vue'
import { toast } from '@/composables/useToast'

const props = defineProps<{ visible: boolean; request: BorrowRequest | null }>()
const emit = defineEmits<{
  close: []
  confirmed: [payload: { requestId: string; photos: string[]; note: string; settlePlan: SettlePlan }]
}>()

const photos = ref<string[]>([])
const note = ref('')
const settlePlan = ref<SettlePlan>('return')

watch(
  () => props.visible,
  (v) => {
    if (v) {
      photos.value = []
      note.value = ''
      settlePlan.value = 'return'
    }
  }
)

function confirm(): void {
  if (photos.value.length === 0) {
    toast('请先拍照确认交接', 'error')
    return
  }
  if (!props.request) return
  emit('confirmed', { requestId: props.request.id, photos: [...photos.value], note: note.value.trim(), settlePlan: settlePlan.value })
}
</script>

<template>
  <Modal :visible="visible" title="完成交接 · 拍照确认" @close="emit('close')">
    <div class="field">
      <label>交接照片<span class="req">*</span></label>
      <PhotoCapture v-model="photos" />
    </div>
    <div class="field">
      <label>交接备注</label>
      <textarea v-model="note" placeholder="如：已放至 201 门口挂钩 / 当面核对包装完好，效期至 2027-xx"></textarea>
    </div>
    <div class="field">
      <label>约定归还 / 补充方式<span class="req">*</span></label>
      <div class="m-list">
        <label v-for="(meta, key) in SETTLE_PLAN_META" :key="key" class="radio-card" :class="{ selected: settlePlan === key }">
          <input v-model="settlePlan" :value="key" type="radio" hidden />
          <div class="rc-title">{{ meta.icon }} {{ meta.label }}</div>
        </label>
      </div>
      <p class="hint">体温计等可复用物品约定原物归还；纱布口罩等耗材可补充同款新品或标注赠送。</p>
    </div>
    <div class="alert warning">
      <span class="alert-icon">⚠️</span>
      <div>如发现包装破损、效期不符，请不要完成交接，直接在订单中反馈，志愿者与社区会介入处理。</div>
    </div>
    <template #footer>
      <button class="btn secondary" @click="emit('close')">取消</button>
      <button class="btn" @click="confirm">确认交接完成</button>
    </template>
  </Modal>
</template>

<style scoped>
.m-list { display: flex; flex-direction: column; gap: 8px; }
</style>
