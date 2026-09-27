<script setup lang="ts">
defineProps<{ icon?: string; text: string }>()
</script>

<template>
  <div class="empty">
    <span class="empty-icon">{{ icon ?? '📭' }}</span>
    <p>{{ text }}</p>
    <slot />
  </div>
</template>
