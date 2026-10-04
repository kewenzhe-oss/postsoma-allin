<template>
  <div class="overlay-container" v-if="isVisible">
    <!-- Game Over State: only show after isGameOverPending completes -->
    <GameOverOverlay
      v-if="onlineStore.isGameOver && !onlineStore.isGameOverPending && onlineStore.latestGameResult"
      :result="onlineStore.latestGameResult"
      @rematch="$emit('rematch')"
      @back-to-lobby="$emit('back-to-lobby')"
    />

    <div v-else-if="onlineStore.errorMessage?.includes('AI')" class="blocking-state error" role="alert">
      <h3>{{ onlineStore.errorMessage }}</h3>
      <button type="button" @click="onlineStore.connectWebSocket()">{{ isZh ? '重新连接' : 'Reconnect' }}</button>
    </div>
    <div v-else-if="Object.keys(onlineStore.absentPlayers).length" class="blocking-state" role="status">
      <h3>{{ Object.values(onlineStore.absentPlayers).includes('left') ? (isZh ? '对手已离开房间' : 'Opponent left the room') : (isZh ? '对手连接中断' : 'Opponent disconnected') }}</h3>
      <p>{{ isZh ? (Object.values(onlineStore.absentPlayers).includes('left') ? '牌局已暂停。' : '牌局已暂停，等待对手重新连接。') : 'Play is paused.' }}</p>
      <button type="button" @click="$emit('back-to-lobby')">{{ isZh ? '返回大厅' : 'Back to lobby' }}</button>
    </div>
    <!-- Waiting for Opponent State -->
    <div v-else-if="perceptualState === 'waiting_for_ai' && !onlineStore.publicState?.stage" class="blocking-state">
      <div class="spinner"></div>
      <h3>Waiting for opponent to sit down</h3>
    </div>

    <!-- Reconnecting State -->
    <div v-else-if="onlineStore.connectionStatus !== 'connected'" class="blocking-state error" role="alert">
      <div class="spinner"></div>
      <h3>{{ onlineStore.connectionStatus === 'connecting' ? (isZh ? '正在连接牌桌' : 'Connecting to the table') : (isZh ? '与牌桌的连接已中断' : 'Connection lost') }}</h3>
      <button v-if="onlineStore.connectionStatus !== 'connecting'" type="button" @click="onlineStore.connectWebSocket()">{{ isZh ? '重新连接' : 'Reconnect' }}</button>
    </div>
  </div>
</template>

<script setup>
import { isZh } from '@/i18n/locale.js'
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
  if (onlineStore.errorMessage?.includes('AI')) return true
  if (Object.keys(onlineStore.absentPlayers).length) return true
  if (onlineStore.connectionStatus !== 'connected') return true
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
  max-width:calc(100% - 2rem);
  max-height:calc(100% - 2rem);
  overflow:auto;
  text-align:center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  background: var(--bg-panel);
  padding: clamp(1rem, 4vw, 3rem);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
}

.blocking-state button { min-height:44px; padding:.5rem 1rem; cursor:pointer; }

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
