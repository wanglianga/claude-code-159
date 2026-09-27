<script setup lang="ts">
defineProps<{ visible: boolean; title: string; width?: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <teleport to="body">
    <div v-if="visible" class="modal-mask" @click.self="emit('close')">
      <div class="modal" :style="width ? { maxWidth: width } : undefined">
        <div class="modal-head">
          <span>{{ title }}</span>
          <button class="modal-close" aria-label="关闭" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-foot">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>
