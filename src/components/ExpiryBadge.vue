<script setup lang="ts">
import { computed } from 'vue'
import { expiryLevel, expiryText } from '@/utils/date'
import StatusBadge from './StatusBadge.vue'

const props = defineProps<{ date: string; showDate?: boolean }>()

const level = computed(() => expiryLevel(props.date))
const meta = computed(() => {
  switch (level.value) {
    case 'expired':
      return { tone: 'red' as const, icon: '⛔', label: `已过期 · ${props.date}` }
    case 'urgent':
      return { tone: 'red' as const, icon: '⚠️', label: expiryText(props.date) }
    case 'near':
      return { tone: 'amber' as const, icon: '⏰', label: expiryText(props.date) }
    case 'watch':
      return { tone: 'blue' as const, icon: '📅', label: expiryText(props.date) }
    default:
      return { tone: 'green' as const, icon: '✅', label: `有效期至 ${props.date}` }
  }
})
</script>

<template>
  <StatusBadge :tone="meta.tone" :icon="meta.icon" :label="meta.label" />
</template>
