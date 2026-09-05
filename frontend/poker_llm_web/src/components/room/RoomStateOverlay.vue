<template>
  <div class="overlay-container" v-if="isVisible">
    <!-- Game Over State: only show after isGameOverPending completes -->
    <GameOverOverlay
      v-if="onlineStore.isGameOver && !onlineStore.isGameOverPending && onlineStore.latestGameResult"
      :result="onlineStore.latestGameResult"
      @rematch="$emit('rematch')"
      @back-to-lobby="$emit('back-to-lobby')"
    />

    <!-- Waiting for Opponent State -->
    <div v-else-if="perceptualState === 'waiting_for_ai' && !onlineStore.publicState?.stage" class="blocking-state">
      <div class="spinner"></div>
      <h3>Waiting for opponent to sit down</h3>
    </div>

    <!-- Reconnecting State -->
    <div v-else-if="onlineStore.connectionStatus === 'connecting'" class="blocking-state error">
      <div class="spinner"></div>
      <h3>Reconnecting to the table</h3>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOnlineStore } from '@/stores/online'
import GameOverOverlay from '@/components/online/GameOverOverlay.vue'

const props = defineProps({
  perceptualState: { type: String, required: true }
})

defineEmits(['rematch', 'back-to-lobby'])

const onlineStore = useOnlineStore()

const isVisible = computed(() => {
  if (onlineStore.isGameOver && !onlineStore.isGameOverPending) return true
  if (onlineStore.connectionStatus === 'connecting') return true
  // Initial loading before stage is set
  if (props.perceptualState === 'waiting_for_ai' && !onlineStore.publicState?.stage) return true
  return false
})
</script>

<style scoped>
.overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 250;
  pointer-events: all;
  background-color: rgba(8, 11, 15, 0.82);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.blocking-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background: var(--bg-panel);
  padding: 3rem 4rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
}

.blocking-state h3 {
  margin: 0;
  color: var(--text-secondary);
  font-weight: 750;
  letter-spacing: 0;
}

.blocking-state.error {
  border-color: rgba(230, 111, 104, 0.34);
}

.blocking-state.error h3 {
  color: var(--danger);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(217, 173, 88, 0.2);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.blocking-state.error .spinner {
  border: 3px solid rgba(230, 111, 104, 0.2);
  border-top-color: var(--danger);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
