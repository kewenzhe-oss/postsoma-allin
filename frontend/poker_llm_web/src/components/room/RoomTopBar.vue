<template>
  <header class="room-top-bar">
    <div class="left">
      <div class="connection-indicator" :class="connectionClass" :title="onlineStore.connectionStatus"></div>
      <h2 class="room-id"><span>Room</span> {{ onlineStore.roomId }}</h2>
    </div>
    
    <div class="center">
      <span v-if="displayStage" class="stage-badge">
        {{ displayStage }}
      </span>
    </div>
    
    <div class="right">
      <el-button @click="$emit('open-handbook')" plain size="small" class="handbook-btn">
        <el-icon><Reading /></el-icon> Decision Guide · 决策指南
      </el-button>
      <el-button @click="copyLink" plain size="small" class="copy-btn" :class="{ 'is-copied': isCopied }">
        <el-icon>
          <Check v-if="isCopied" />
          <DocumentCopy v-else />
        </el-icon>
        {{ isCopied ? 'Copied!' : 'Copy Invite' }}
      </el-button>
      <div class="player-identity">
        {{ onlineStore.heroPlayer?.display_name || 'Hero' }}
      </div>
      <el-button @click="$emit('leave')" text class="leave-btn" size="small">
        <el-icon><SwitchButton /></el-icon>
      </el-button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useOnlineStore } from '@/stores/online'
import { ElMessage } from 'element-plus'
import { DocumentCopy, SwitchButton, Check, Reading } from '@element-plus/icons-vue'

const onlineStore = useOnlineStore()

defineEmits(['leave', 'open-handbook'])

const connectionClass = computed(() => {
  if (onlineStore.connectionStatus === 'connected') return 'is-connected'
  if (onlineStore.connectionStatus === 'connecting') return 'is-connecting'
  return 'is-error'
})

const displayStage = computed(() => {
  if (!onlineStore.publicState) return null
  const status = onlineStore.publicState.game_status
  const stage = onlineStore.publicState.stage
  
  if (status === 'waiting') return 'Waiting'
  
  // Replace IN_HAND with the actual stage name to avoid redundancy
  if (status === 'in_progress' || status === 'in_hand') {
    return stage ? stageLabel(stage) : 'Dealing'
  }
  
  return stageLabel(status || stage || '')
})

const isCopied = ref(false)

const copyLink = () => {
  const url = window.location.origin
  const inviteUrl = `${url}/?room=${onlineStore.roomId}`
  
  navigator.clipboard.writeText(inviteUrl).then(() => {
    ElMessage.success(`Invite copied. Room: ${onlineStore.roomId}`)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }).catch(() => {
    ElMessage.error('Failed to copy. Please copy manually.')
  })
}

function stageLabel(value) {
  const labels = {
    preflop: 'Preflop',
    flop: 'Flop',
    turn: 'Turn',
    river: 'River',
    showdown: 'Showdown',
    game_over: 'Game over',
    in_hand: 'In hand',
    in_progress: 'In hand'
  }
  return labels[value] || String(value).replace(/_/g, ' ')
}
</script>

<style scoped>
.room-top-bar {
  min-height: 58px;
  background-color: rgba(8, 11, 15, 0.72);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  z-index: 200;
  position: relative;
  flex-shrink: 0;
}

.left, .right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.right {
  justify-content: flex-end;
}

/* Connection Dot Indicator */
.connection-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-tertiary);
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
  transition: background-color 0.3s;
}

.is-connected {
  background-color: var(--success);
  box-shadow: 0 0 10px rgba(121, 216, 144, 0.4);
}

.is-connecting {
  background-color: var(--warning);
  animation: pulse 1s infinite alternate;
}

.is-error {
  background-color: var(--danger);
}

.room-id {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
  letter-spacing: 0;
  font-weight: 800;
}

.room-id span {
  color: var(--text-tertiary);
  font-weight: 700;
}

.stage-badge {
  color: var(--text-primary);
  font-weight: 850;
  letter-spacing: 0.02em;
  font-size: 0.9rem;
  padding: 0.34rem 0.75rem;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid var(--border-subtle);
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.player-identity {
  background-color: transparent;
  padding: 0;
  font-size: 0.84rem;
  font-weight: 750;
  color: var(--text-secondary);
  border: none;
}

.handbook-btn {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border-color: var(--border-subtle) !important;
  color: var(--accent-primary-strong) !important;
  border-radius: var(--radius-pill);
  font-weight: 800;
}
.handbook-btn:hover {
  background-color: rgba(217, 173, 88, 0.13) !important;
  color: var(--text-primary) !important;
  border-color: rgba(217, 173, 88, 0.32) !important;
}

.copy-btn {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border-color: var(--border-subtle) !important;
  color: var(--text-secondary) !important;
  border-radius: var(--radius-pill);
  font-weight: 800;
}
.copy-btn:hover {
  background-color: rgba(217, 173, 88, 0.13) !important;
  color: var(--text-primary) !important;
  border-color: rgba(217, 173, 88, 0.32) !important;
}

.copy-btn.is-copied {
  background-color: rgba(121, 216, 144, 0.15) !important;
  color: var(--success) !important;
  border-color: rgba(121, 216, 144, 0.4) !important;
}

.leave-btn {
  color: var(--text-tertiary);
  padding: 0.4rem;
}
.leave-btn:hover {
  color: var(--danger);
  background-color: rgba(230, 111, 104, 0.12);
}

@keyframes pulse {
  0% { opacity: 0.5; }
  100% { opacity: 1; }
}

@media (max-width: 680px) {
  .room-top-bar {
    padding: 0 0.85rem;
  }

  .player-identity {
    display: none;
  }

  .copy-btn {
    padding: 0.45rem 0.65rem;
  }

  .room-id {
    max-width: 104px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
