<template>
  <HandHistoryPanel />
</template>

<script setup>
import HandHistoryPanel from './HandHistoryPanel.vue'

defineProps({
  events: { type: Array, default: () => [] },
  isGameOver: { type: Boolean, default: false }
})
</script>
