<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'danger' | 'warning' | 'info' | 'success'
    icon?: string
    title?: string
  }>(),
  { type: 'warning', icon: '⚠️', title: '' }
)
</script>

<template>
  <div class="alert" :class="type">
    <span class="alert-icon">{{ icon }}</span>
    <div>
      <p v-if="title" class="fw-600">{{ title }}</p>
      <slot>共享物品不替代就医，社区仅做物品流转与风险提醒，不提供诊断建议。</slot>
    </div>
  </div>
</template>
