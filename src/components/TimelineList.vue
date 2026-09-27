<script setup lang="ts">
import type { TimelineEvent } from '@/types'
import { fmtTime } from '@/utils/date'

defineProps<{ events: TimelineEvent[] }>()
</script>

<template>
  <div class="timeline">
    <div v-for="e in [...events].sort((a, b) => b.at - a.at)" :key="e.id" class="timeline-item"
      :class="{ active: e.level === 'success', danger: e.level === 'danger', warning: e.level === 'warning' }">
      <div class="t-time">{{ fmtTime(e.at) }} · {{ e.actorName }}</div>
      <div class="t-title">{{ e.text }}</div>
    </div>
  </div>
</template>
