<template>
  <div class="room-shell" :class="{ 'sizing-open': sizingOpen }">
    <RoomTopBar @leave="handleBackToLobby" @open-handbook="historyPanel?.toggle()" />

    <div class="main-viewport">
      <!-- ── Core Table Area ── -->
      <div class="table-container">
        <TableStage :perceptualState="perceptualState" />
      </div>

      <!-- ── Action Area (Bottom) ── -->
      <div class="action-panel-zone">
        <HandResultCenter v-if="onlineStore.latestHandResult" :result="onlineStore.latestHandResult" />
        <ActionPanel
          v-else-if="onlineStore.publicState?.game_status === 'in_hand'"
          :actions="onlineStore.availableActions"
          :disabled="perceptualState !== 'player_turn'"
          :potAmount="onlineStore.publicState.pot || 0"
          :currentBet="onlineStore.publicState.current_bet || 0"
          :heroBet="onlineStore.heroPlayer?.bet_in_round || 0"
          :actionSummary="actionSummary"
          :turnKey="turnKey"
          @submit-action="submitHeroAction"
          @raise-state="sizingOpen = $event"
        />
        <div v-if="!onlineStore.latestHandResult && onlineStore.publicState?.game_status !== 'in_hand'" class="between-hands" role="status">
          {{ onlineStore.latestHandResult ? (isZh ? '等待下一手' : 'Waiting for next hand') : (isZh ? '等待对手入座' : 'Waiting for opponent') }}
        </div>
      </div>

      <!-- ── Side Panels (Drawer) ── -->
      <SidePanel ref="historyPanel"
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

    <!-- Teleportable Tactical Tool Modal -->
    <RangeViewerModal v-model="showDecisionGuide" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import { useOnlineStore } from '@/stores/online'
import { useAIInteraction } from '@/composables/useAIInteraction'
import { ElMessage } from 'element-plus'
import { isZh } from '@/i18n/locale.js'

import RoomTopBar from '@/components/room/RoomTopBar.vue'
import TableStage from '@/components/room/TableStage.vue'
import ActionPanel from '@/components/room/ActionPanel.vue'
import HandResultCenter from '@/components/online/HandResultCenter.vue'
import SidePanel from '@/components/room/SidePanel.vue'
import RoomStateOverlay from '@/components/room/RoomStateOverlay.vue'
import DebugPanel from '@/components/online/DebugPanel.vue'
import RangeViewerModal from '@/components/tools/RangeViewerModal.vue'

const router = useRouter()
const route = useRoute()
const onlineStore = useOnlineStore()
const { perceptualState, latestAIAction, submitHeroAction } = useAIInteraction(onlineStore)

const turnKey = computed(() => `${onlineStore.activeHand?.hand_number ?? ''}:${onlineStore.publicState?.stage}:${onlineStore.publicState?.current_turn_player_id}`)

const showDebug = ref(false) // Toggleable via hotkey or settings later
const showDecisionGuide = ref(false)
const sizingOpen = ref(false)
const historyPanel = ref(null)
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
  const targetRoomId = route.params.id
  onlineStore.initFromSession()

  // If user has no valid session or token is for a different room, redirect to join flow
  if (!onlineStore.playerToken || onlineStore.roomId !== targetRoomId) {
    router.replace({ name: 'Home', query: { room: targetRoomId } })
    return
  }

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
  height: 100dvh;
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
  flex:1;
  min-height:0;
  display:grid;
  grid-template-rows:minmax(0,1fr) var(--action-height);
  --action-height:310px;
  position:relative;
  overflow:auto;
  overflow-anchor:none;
}
.table-container { min-height:340px; display:flex; flex-direction:column; }
.action-panel-zone {
  height:100%; min-height:0; overflow-y:auto; overflow-x:hidden;
  padding:.35rem 1rem max(.5rem,env(safe-area-inset-bottom));
  display:flex; flex-direction:column; align-items:center;
  position:relative; z-index:50;
}
.action-panel-zone > * { flex-shrink:0; margin-top:auto; }
.action-panel-zone > .hand-result-center { margin-top:0; }
.between-hands { width:min(680px,100%); text-align:center; color:var(--text-secondary); padding:1rem; }

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

@media (min-width:721px) {
 .main-viewport { --action-height:300px; }
 .table-container { min-height:360px; }
}
@media (max-width:720px) {
 .main-viewport { --action-height:clamp(280px,36dvh,310px); }
 .table-container { min-height:300px; }
 .action-panel-zone { padding:.3rem .5rem max(.5rem,env(safe-area-inset-bottom)); }
 .action-panel-zone :deep(.action-panel-container) { padding:0; }
 .action-panel-zone :deep(.action-card) { padding:.6rem; }
 .action-panel-zone :deep(.secondary-actions) { margin-top:.4rem; padding-top:.4rem; }
 .action-panel-zone :deep(.act-btn) { height:44px; }
 .action-panel-zone :deep(.raise-control) { gap:.45rem; padding:.55rem; }
}
@media (min-width:721px) and (max-height:500px) {
 .main-viewport { grid-template-columns:minmax(0,1fr) minmax(300px,42%); grid-template-rows:minmax(0,1fr); }
 .table-container { min-height:300px; }
 .action-panel-zone { padding:.35rem .5rem max(.5rem,env(safe-area-inset-bottom)); }
}
@media (prefers-reduced-motion:reduce) {
 .room-shell :deep(*) { animation:none!important; transition:none!important; }
}
</style>
