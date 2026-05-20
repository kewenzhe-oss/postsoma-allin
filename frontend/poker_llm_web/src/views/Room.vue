<template>
  <div class="room-shell">
    <RoomTopBar @leave="handleBackToLobby" />

    <div class="main-viewport">
      <!-- ── Core Table Area ── -->
      <div class="table-container">
        <TableStage :perceptualState="perceptualState" />
      </div>

      <!-- ── Action Area (Bottom) ── -->
      <div class="action-panel-zone">
        <ActionPanel
          v-if="onlineStore.publicState"
          :actions="onlineStore.availableActions"
          :disabled="perceptualState !== 'player_turn'"
          :potAmount="onlineStore.publicState.pot || 0"
          :actionSummary="actionSummary"
          @submit-action="submitHeroAction"
        />
      </div>

      <!-- ── Side Panels (Drawer) ── -->
      <SidePanel 
        :rawEventLog="onlineStore.rawEventLog" 
        :isGameOver="onlineStore.isGameOver" 
      />
      
      <!-- ── Dev Tools (Hidden by default, Layer 5) ── -->
      <DebugPanel class="debug-overlay" v-if="showDebug" />
    </div>

    <!-- ── State Overlays (Layer 10) ── -->
    <RoomStateOverlay 
      :perceptualState="perceptualState"
      @rematch="handleRematch"
      @back-to-lobby="handleBackToLobby"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { onBeforeRouteLeave } from 'vue-router'
import { useOnlineStore } from '@/stores/online'
import { useAIInteraction } from '@/composables/useAIInteraction'
import { ElMessage } from 'element-plus'

import RoomTopBar from '@/components/room/RoomTopBar.vue'
import TableStage from '@/components/room/TableStage.vue'
import ActionPanel from '@/components/room/ActionPanel.vue'
import SidePanel from '@/components/room/SidePanel.vue'
import RoomStateOverlay from '@/components/room/RoomStateOverlay.vue'
import DebugPanel from '@/components/online/DebugPanel.vue'

const router = useRouter()
const onlineStore = useOnlineStore()
const { perceptualState, latestAIAction, submitHeroAction } = useAIInteraction(onlineStore)

const showDebug = ref(false) // Toggleable via hotkey or settings later
let isCreatingRematch = false

// The text that pops up briefly to explain the AI's action
const actionSummary = computed(() => {
  if (perceptualState.value === 'ai_action_revealed' && latestAIAction.value) {
    const act = latestAIAction.value.action
    const amt = latestAIAction.value.amount ? ` $${latestAIAction.value.amount}` : ''
    
    // Naturalize the action verb
    let verb = act
    if (act === 'FOLD') verb = 'Folded'
    else if (act === 'CHECK') verb = 'Checked'
    else if (act === 'CALL') verb = 'Called'
    else if (act === 'RAISE') verb = 'Raised to'
    else if (act === 'ALL_IN') verb = 'went All-In'
    
    return `AI ${verb}${amt}`
  }
  return null
})

onMounted(() => {
  onlineStore.initFromSession()
  onlineStore.connectWebSocket()
  
  // Dynamic SEO exclusion: mark transient room page as noindex
  const meta = document.createElement('meta')
  meta.name = 'robots'
  meta.content = 'noindex, nofollow'
  meta.id = 'room-noindex-meta'
  document.head.appendChild(meta)
  
  // Example: Hotkey to toggle debug view (Ctrl+Shift+D)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  cleanupRoomState()
  
  // Clean up the dynamic noindex meta tag
  const meta = document.getElementById('room-noindex-meta')
  if (meta) {
    meta.remove()
  }
})

onBeforeRouteLeave(() => {
  cleanupRoomState()
})

function handleKeydown(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    showDebug.value = !showDebug.value
  }
}

function handleBackToLobby() {
  cleanupRoomState()
  router.push({ name: 'Home' })
}

async function handleRematch() {
  const heroName = onlineStore.heroPlayer?.display_name || ''
  const mode = onlineStore.roomMode || 'hvsh'
  const aiConfig = onlineStore.lastAiConfig || null
  
  isCreatingRematch = true
  onlineStore.leaveRoom()

  try {
    const newRoomId = await onlineStore.createRoom(mode, heroName, aiConfig)
    await router.push({ name: 'Room', params: { id: newRoomId } })
    onlineStore.connectWebSocket()
    ElMessage.success(`Rematch room created! Room ID: ${newRoomId}`)
  } catch (e) {
    ElMessage.error('Could not create rematch room: ' + e.message)
    router.push({ name: 'Home' })
  } finally {
    isCreatingRematch = false
  }
}

function cleanupRoomState() {
  if (isCreatingRematch) return
  if (onlineStore.roomId || onlineStore.connectionStatus !== 'disconnected') {
    onlineStore.leaveRoom()
  }
}
</script>

<style scoped>
.room-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background:
    radial-gradient(circle at 50% 25%, rgba(15, 74, 50, 0.36), transparent 34rem),
    radial-gradient(circle at 16% 86%, rgba(101, 28, 32, 0.2), transparent 24rem),
    radial-gradient(circle at 88% 78%, rgba(217, 173, 88, 0.09), transparent 22rem),
    var(--bg-app);
  color: var(--text-primary);
  font-family: var(--font-family);
  overflow: hidden;
  position: relative;
}

.main-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.action-panel-zone {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0 1rem max(1rem, env(safe-area-inset-bottom));
  display: flex;
  justify-content: center;
  z-index: 50;
  pointer-events: none;
}

.action-panel-zone > * {
  pointer-events: auto; /* Re-enable clicks on the panel itself */
}

.debug-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 320px;
  z-index: 500;
  box-shadow: 5px 0 15px rgba(0,0,0,0.5);
  background: rgba(0, 0, 0, 0.9);
}

@media (max-width: 720px) {
  .action-panel-zone {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
</style>
