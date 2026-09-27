<script setup lang="ts">
defineProps<{
  tone: 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'teal'
  label: string
  icon?: string
}>()
</script>

<template>
  <span class="badge" :class="tone">
    <span v-if="icon">{{ icon }}</span>{{ label }}
  </span>
</template>
