<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FeedbackType } from '@/types'
import Modal from './Modal.vue'
import PhotoCapture from './PhotoCapture.vue'
import { toast } from '@/composables/useToast'

const props = defineProps<{ visible: boolean; itemName?: string; defaultType?: FeedbackType }>()
const emit = defineEmits<{
  close: []
  submitted: [payload: { type: FeedbackType; description: string; photos: string[] }]
}>()

const type = ref<FeedbackType>('package_damaged')
const description = ref('')
const photos = ref<string[]>([])

watch(
  () => props.visible,
  (v) => {
    if (v) {
      type.value = props.defaultType ?? 'package_damaged'
      description.value = ''
      photos.value = []
    }
  }
)

function submit(): void {
  if (!description.value.trim()) {
    toast('请填写问题描述', 'error')
    return
  }
  emit('submitted', { type: type.value, description: description.value.trim(), photos: [...photos.value] })
}
</script>

<template>
  <Modal :visible="visible" title="问题反馈与安全上报" @close="emit('close')">
    <div class="alert danger">
      <span class="alert-icon">🚨</span>
      <div>
        <strong>如出现皮肤红肿、瘙痒、呼吸困难等任何不适反应，请立即停用、必要时就医</strong>，
        并在此上报，社区工作人员会第一时间核实并可联动物品下架报废。
      </div>
    </div>
    <p v-if="itemName" class="small muted mb-12">关联物品：{{ itemName }}</p>

    <div class="field">
      <label>反馈类型<span class="req">*</span></label>
      <div class="m-list">
        <label class="radio-card" :class="{ selected: type === 'package_damaged' }">
          <input v-model="type" value="package_damaged" type="radio" hidden />
          <div class="rc-title">📦 包装破损 / 封口开裂 / 受潮污染</div>
        </label>
        <label class="radio-card danger-card" :class="{ selected: type === 'adverse_reaction' }">
          <input v-model="type" value="adverse_reaction" type="radio" hidden />
          <div class="rc-title">🩹 使用后疑似不适反应（红、痒、刺激等）</div>
        </label>
        <label class="radio-card" :class="{ selected: type === 'other' }">
          <input v-model="type" value="other" type="radio" hidden />
          <div class="rc-title">💬 其他问题或建议</div>
        </label>
      </div>
    </div>

    <div class="field">
      <label>问题描述<span class="req">*</span></label>
      <textarea v-model="description" placeholder="请描述发生时间、部位/现象、是否已停用等信息，便于社区核实"></textarea>
    </div>

    <div class="field">
      <label>照片凭证（可选）</label>
      <PhotoCapture v-model="photos" />
    </div>

    <template #footer>
      <button class="btn secondary" @click="emit('close')">取消</button>
      <button class="btn danger" @click="submit">提交反馈</button>
    </template>
  </Modal>
</template>

<style scoped>
.m-list { display: flex; flex-direction: column; gap: 8px; }
.danger-card.selected { border-color: var(--color-danger); background: var(--color-danger-soft); }
</style>
