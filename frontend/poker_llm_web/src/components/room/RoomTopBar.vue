<template>
  <header class="room-top-bar">
    <div class="left">
      <div class="connection-indicator" :class="connectionClass" :title="onlineStore.connectionStatus"></div>
      <h2 class="room-id"><span>{{ copy.room }}</span> {{ onlineStore.roomId }}</h2>
    </div>
    
    <div class="center">
      <span v-if="displayStage" class="stage-badge">
        {{ displayStage }}
      </span>
    </div>
    
    <div class="right">
      <LocaleSwitcher class="room-locale-switcher" />
      <el-button
        @click="$emit('open-handbook')"
        plain
        size="small"
        class="handbook-btn"
        :aria-label="copy.openGuide"
      >
        <el-icon><Reading /></el-icon><span class="button-label">{{ copy.guide }}</span>
      </el-button>
      <el-button
        @click="copyLink"
        plain
        size="small"
        class="copy-btn"
        :class="{ 'is-copied': isCopied }"
        :aria-label="isCopied ? copy.copied : copy.copyInvite"
      >
        <el-icon>
          <Check v-if="isCopied" />
          <DocumentCopy v-else />
        </el-icon>
        <span class="button-label">{{ isCopied ? copy.copied : copy.copyInvite }}</span>
      </el-button>
      <div class="player-identity">
        {{ onlineStore.heroPlayer?.display_name || 'Hero' }}
      </div>
      <el-button @click="$emit('leave')" text class="leave-btn" size="small" :aria-label="copy.leave">
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
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { isZh } from '@/i18n/locale.js'

const onlineStore = useOnlineStore()

defineEmits(['leave', 'open-handbook'])

const copy = computed(() => isZh.value
  ? {
      room: '房间',
      guide: '决策指南',
      openGuide: '打开决策指南',
      copyInvite: '复制邀请',
      copied: '已复制',
      copySuccess: '邀请已复制',
      copyFailure: '复制失败，请手动复制。',
      leave: '离开房间',
      waiting: '等待中',
      dealing: '发牌中'
    }
  : {
      room: 'Room',
      guide: 'Decision Guide',
      openGuide: 'Open Decision Guide',
      copyInvite: 'Copy Invite',
      copied: 'Copied!',
      copySuccess: 'Invite copied',
      copyFailure: 'Failed to copy. Please copy manually.',
      leave: 'Leave room',
      waiting: 'Waiting',
      dealing: 'Dealing'
    })

const connectionClass = computed(() => {
  if (onlineStore.connectionStatus === 'connected') return 'is-connected'
  if (onlineStore.connectionStatus === 'connecting') return 'is-connecting'
  return 'is-error'
})

const displayStage = computed(() => {
  if (!onlineStore.publicState) return null
  const status = onlineStore.publicState.game_status
  const stage = onlineStore.publicState.stage
  
  if (status === 'waiting') return copy.value.waiting
  
  // Replace IN_HAND with the actual stage name to avoid redundancy
  if (status === 'in_progress' || status === 'in_hand') {
    return stage ? stageLabel(stage) : copy.value.dealing
  }
  
  return stageLabel(status || stage || '')
})

const isCopied = ref(false)

const copyLink = () => {
  const url = window.location.origin
  const inviteUrl = `${url}/?room=${onlineStore.roomId}`
  
  navigator.clipboard.writeText(inviteUrl).then(() => {
    ElMessage.success(`${copy.value.copySuccess}: ${onlineStore.roomId}`)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }).catch(() => {
    ElMessage.error(copy.value.copyFailure)
  })
}

function stageLabel(value) {
  const labels = isZh.value
    ? {
        preflop: '翻前',
        flop: '翻牌',
        turn: '转牌',
        river: '河牌',
        showdown: '摊牌',
        game_over: '牌局结束',
        in_hand: '牌局中',
        in_progress: '牌局中'
      }
    : {
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

.room-locale-switcher {
  flex: 0 0 auto;
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
  min-width: 44px;
  min-height: 44px;
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

  .center {
    display: none;
  }

  .left {
    flex: 0 1 auto;
  }

  .right {
    flex: 1 1 auto;
    gap: 0.35rem;
  }

  .handbook-btn,
  .copy-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0.45rem !important;
  }

  .button-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .copy-btn {
    padding: 0.45rem 0.65rem;
  }

  .room-id {
    max-width: 76px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 440px) {
  .room-id {
    display: none;
  }
}
</style>
