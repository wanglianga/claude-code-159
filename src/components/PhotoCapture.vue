<script setup lang="ts">
import { ref } from 'vue'
import PhotoThumb from './PhotoThumb.vue'

/**
 * 交接拍照组件：
 * - 真实环境可调用摄像头/上传；演示环境提供“模拟拍照”生成凭证图，
 *   同时支持本地选择图片（FileReader 转 dataURL）。
 */
const props = defineProps<{ modelValue: string[]; required?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const fileInput = ref<HTMLInputElement | null>(null)

function makeStubPhoto(): string {
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 240
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  const grad = ctx.createLinearGradient(0, 0, 320, 240)
  grad.addColorStop(0, '#2c7a5f')
  grad.addColorStop(1, '#1f4e7a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 320, 240)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = 'bold 20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('交接拍照凭证', 160, 105)
  ctx.font = '14px sans-serif'
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  ctx.fillText(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`, 160, 135)
  ctx.fillText('邻里药箱 · 无接触交接', 160, 160)
  return canvas.toDataURL('image/png')
}

function takePhoto(): void {
  const data = makeStubPhoto()
  if (data) emit('update:modelValue', [...props.modelValue, data])
}

function onFile(e: Event): void {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      emit('update:modelValue', [...props.modelValue, reader.result])
    }
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function removeAt(idx: number): void {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== idx))
}
</script>

<template>
  <div>
    <div class="photo-row">
      <PhotoThumb v-for="(p, i) in modelValue" :key="i" :src="p" />
      <button type="button" class="photo-add" @click="takePhoto">📷<span>拍照</span></button>
      <button type="button" class="photo-add" @click="fileInput?.click()">🖼️<span>相册</span></button>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
    </div>
    <div v-for="i in modelValue.length" :key="`del-${i - 1}`" class="photo-del-line">
      <span class="small muted">凭证 {{ i }}</span>
      <button type="button" class="btn ghost sm" @click="removeAt(i - 1)">删除</button>
    </div>
    <p class="hint">交接双方需拍照留存包装与效期，便于追溯。</p>
  </div>
</template>

<style scoped>
.photo-row { display: flex; gap: 10px; flex-wrap: wrap; }
.photo-add {
  width: 72px; height: 72px;
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-sm);
  background: #fafbfc;
  color: var(--color-text-3);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px; font-size: 20px;
}
.photo-add span { font-size: 11px; }
.photo-add:hover { border-color: var(--color-primary); color: var(--color-primary); }
.photo-del-line { display: flex; align-items: center; justify-content: space-between; margin-top: 2px; }
.hint { font-size: 12px; color: var(--color-text-3); margin-top: 6px; }
</style>
