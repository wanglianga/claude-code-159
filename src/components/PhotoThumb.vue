<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ src?: string; label?: string }>()

const isSeed = computed(() => (props.src ?? '').startsWith('seed:'))
const seedLabel = computed(() => {
  const map: Record<string, string> = {
    'seed:doorstep-1': '门口交接照片',
    'seed:pickup-1': '自取交接照片',
    'seed:pickup-2': '归还核对照片',
    'seed:delivery-1': '志愿者送达照片',
    'seed:damage-1': '包装破损照片'
  }
  return map[props.src ?? ''] ?? '交接凭证照片'
})
</script>

<template>
  <div class="photo-thumb seed-photo" :title="label">
    <template v-if="isSeed">
      <span class="seed-icon">📷</span>
      <span class="seed-text">{{ seedLabel }}</span>
    </template>
    <img v-else-if="src" :src="src" :alt="label ?? '照片'" />
    <template v-else>
      <span class="seed-icon">🖼️</span>
    </template>
  </div>
</template>

<style scoped>
.seed-photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: linear-gradient(135deg, #e8f1fa, #e6f4ee);
  color: var(--color-text-3);
  font-size: 10.5px;
  text-align: center;
  padding: 4px;
  overflow: hidden;
}
.seed-icon { font-size: 20px; }
.seed-text { line-height: 1.25; }
.photo-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: 7px; }
</style>
