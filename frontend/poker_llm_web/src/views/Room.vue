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
        <HandResultCenter v-if="onlineStore.latestHandResult" :result="onlineStore.latestHandResult" @open-ai-review="historyPanel?.openInsights()" />
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

// The text that pops up briefly to explain the opponent's / AI's latest action
const actionSummary = computed(() => {
  if (latestAIAction.value && !onlineStore.latestHandResult) {
    const act = latestAIAction.value.action
    const amt = latestAIAction.value.amount ? ` ${latestAIAction.value.amount}` : ''
    const actor = latestAIAction.value.isAi
      ? 'AI'
      : (latestAIAction.value.displayName || onlineStore.opponentPlayer?.display_name || (isZh.value ? '对手' : 'Opponent'))

    if (isZh.value) {
      const zhMap = {
        FOLD: '弃牌',
        CHECK: '过牌',
        CALL: '跟注',
        RAISE: '加注至',
        ALL_IN: '全押'
      }
      return `${actor} · ${zhMap[act] || act}${amt}`
    }

    let verb = act
    if (act === 'FOLD') verb = 'Folded'
    else if (act === 'CHECK') verb = 'Checked'
    else if (act === 'CALL') verb = 'Called'
    else if (act === 'RAISE') verb = 'Raised to'
    else if (act === 'ALL_IN') verb = 'went All-In'

    return `${actor} ${verb}${amt}`
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
    if (mode === 'hvsh') {
      const inviteUrl = `${window.location.origin}/?room=${newRoomId}`
      try { await navigator.clipboard.writeText(inviteUrl) } catch {}
      ElMessage.success(isZh.value ? `已创建新房间 ${newRoomId}，邀请链接已复制，快发给好友吧！` : `Rematch room ${newRoomId} created! Invite link copied to clipboard.`)
    } else {
      ElMessage.success(isZh.value ? `已开启新一局 AI 对战（房间 ${newRoomId}）` : `Rematch room created! Room ID: ${newRoomId}`)
    }
  } catch (e) {
    ElMessage.error((isZh.value ? '无法创建新房间：' : 'Could not create rematch room: ') + e.message)
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
  grid-template-rows:minmax(0,1fr) auto;
  position:relative;
  overflow-y:auto;
  overflow-x:hidden;
  overflow-anchor:none;
}
.table-container { min-height:240px; display:flex; flex-direction:column; }
.action-panel-zone {
  height:auto; min-height:0; overflow:visible;
  padding:.25rem 1rem max(.5rem,env(safe-area-inset-bottom));
  display:flex; flex-direction:column; align-items:center; justify-content:flex-end;
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
 .table-container { min-height:320px; }
}
@media (max-width:720px) {
 .table-container { min-height:210px; }
 .action-panel-zone { padding:.2rem .45rem max(.45rem,env(safe-area-inset-bottom)); }
 .action-panel-zone :deep(.action-panel-container) { padding:0; }
 .action-panel-zone :deep(.action-card) { padding:.5rem .55rem; }
 .action-panel-zone :deep(.act-btn) { height:46px; }
 .action-panel-zone :deep(.raise-control) { gap:.38rem; padding:.5rem .55rem; }
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
