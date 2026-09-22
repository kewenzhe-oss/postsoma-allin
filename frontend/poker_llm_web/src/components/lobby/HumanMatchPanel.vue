<template>
  <div class="panel-container">
    <div class="panel-card">
      <el-tabs v-model="activeTab" class="lobby-tabs">
        <el-tab-pane :label="copy.hostTab" name="host">
          <div class="tab-content">
            <div class="form-group">
              <label>{{ copy.displayName }}</label>
              <el-input v-model="displayName" :placeholder="copy.namePlaceholder" class="panel-input" />
            </div>
            <div class="action-wrapper">
              <el-button type="primary" class="panel-btn submit-btn" @click="handleCreate" :loading="loading">
                {{ copy.createRoom }}
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane :label="copy.joinTab" name="join">
          <div class="tab-content">
            <div v-if="props.prefilledRoomId" class="invite-banner">
              <div class="invite-badge">{{ copy.invitedBadge }}</div>
              <div class="invite-desc">{{ copy.invitedDesc }}: <code>{{ props.prefilledRoomId }}</code></div>
            </div>

            <div class="form-group">
              <label>{{ copy.displayName }}</label>
              <el-input
                v-model="joinDisplayName"
                :placeholder="copy.namePlaceholder"
                class="panel-input"
                @keyup.enter="handleJoin"
              />
            </div>
            <div class="form-group">
              <label>Room ID</label>
              <el-input
                v-model="joinRoomId"
                :placeholder="copy.roomPlaceholder"
                class="panel-input"
                :disabled="Boolean(props.prefilledRoomId)"
                @keyup.enter="handleJoin"
              />
            </div>
            <div class="action-wrapper">
              <el-button class="panel-btn join-btn" @click="handleJoin" :loading="loading" :disabled="!joinRoomId">
                {{ props.prefilledRoomId ? copy.joinInvitedRoom : copy.joinRoom }}
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useOnlineStore } from '@/stores/online'
import { ElMessage } from 'element-plus'
import { isZh } from '@/i18n/locale.js'

const props = defineProps({
  prefilledRoomId: {
    type: String,
    default: ''
  }
})

const router = useRouter()
const onlineStore = useOnlineStore()

const activeTab = ref('host')
const loading = ref(false)

const displayName = ref(localStorage.getItem('poker_hvh_name') || 'Player 1')
const joinDisplayName = ref(localStorage.getItem('poker_hvh_name') || 'Player 2')
const joinRoomId = ref('')

// When an invite link provides a room ID, switch to Join tab and pre-fill it
watchEffect(() => {
  if (props.prefilledRoomId) {
    joinRoomId.value = props.prefilledRoomId
    activeTab.value = 'join'
  }
})

const copy = computed(() => isZh.value
  ? {
      hostTab: '创建房间',
      joinTab: '加入房间',
      displayName: '显示名称',
      namePlaceholder: '输入你的名称',
      roomPlaceholder: '输入 8 位 Room ID',
      createRoom: '创建房间',
      joinRoom: '加入房间',
      joinInvitedRoom: '立即进入房间',
      invitedBadge: '邀请函',
      invitedDesc: '受邀加入对局房间',
      nameRequired: '请输入显示名称。',
      createFailed: '创建房间失败。',
      joinRequired: '请输入名称和 Room ID。',
      joinFailed: '加入房间失败。',
      roomNotFound: '房间不存在或已过期解散。',
      roomFull: '房间已满（仅限 2 人 Heads-Up）。'
    }
  : {
      hostTab: 'Host a Game',
      joinTab: 'Join a Game',
      displayName: 'Display Name',
      namePlaceholder: 'Enter your name',
      roomPlaceholder: 'Enter 8-character room ID',
      createRoom: 'Create Room',
      joinRoom: 'Join Room',
      joinInvitedRoom: 'Join Match Now',
      invitedBadge: 'Invite',
      invitedDesc: 'Invited to match room',
      nameRequired: 'Display name is required.',
      createFailed: 'Failed to create room.',
      joinRequired: 'Name and Room ID are required.',
      joinFailed: 'Failed to join room.',
      roomNotFound: 'Room not found or expired.',
      roomFull: 'Room is full (2 players max).'
    })

const handleCreate = async () => {
  if (!displayName.value) return ElMessage.warning(copy.value.nameRequired)
  localStorage.setItem('poker_hvh_name', displayName.value)
  
  loading.value = true
  try {
    const roomId = await onlineStore.createRoom('hvsh', displayName.value)
    router.replace(`/room/${roomId}`)
  } catch (err) {
    ElMessage.error(err.message || copy.value.createFailed)
  } finally {
    loading.value = false
  }
}

const handleJoin = async () => {
  if (!joinDisplayName.value || !joinRoomId.value) return ElMessage.warning(copy.value.joinRequired)
  localStorage.setItem('poker_hvh_name', joinDisplayName.value)
  
  loading.value = true
  try {
    await onlineStore.joinRoom(joinRoomId.value, joinDisplayName.value)
    router.replace(`/room/${joinRoomId.value}`)
  } catch (err) {
    let msg = err.message || copy.value.joinFailed
    if (msg.includes('Room not found')) {
      msg = copy.value.roomNotFound
    } else if (msg.includes('Room is full')) {
      msg = copy.value.roomFull
    }
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.panel-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.panel-card {
  width: 100%;
  max-width: 440px;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.5rem 2rem 2.5rem;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(18px);
}

.tab-content {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.invite-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(217, 173, 88, 0.12);
  border: 1px solid rgba(217, 173, 88, 0.35);
  border-radius: var(--radius-md);
}

.invite-badge {
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.5rem;
  background: var(--accent-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-pill);
  white-space: nowrap;
}

.invite-desc {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 600;
}

.invite-desc code {
  color: var(--accent-primary-strong);
  font-weight: 800;
  padding: 0.15rem 0.35rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 750;
}

.panel-input {
  /* Inner styles inherit from element-plus but can be overridden globally if needed */
}

.action-wrapper {
  margin-top: 1rem;
}

.panel-btn {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 800;
  border-radius: var(--radius-md);
  letter-spacing: 0;
  margin-left: 0;
}

.submit-btn {
  background-color: var(--accent-friend);
  border-color: var(--accent-friend);
  color: var(--text-primary);
}
.submit-btn:hover {
  background-color: var(--burgundy-rich);
  border-color: var(--burgundy-rich);
}

.join-btn {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--text-inverse);
}
.join-btn:hover:not(:disabled) {
  background-color: var(--accent-primary-strong);
  border-color: var(--accent-primary-strong);
}

:deep(.el-tabs__item) {
  color: var(--text-tertiary);
  font-size: 1rem;
  font-weight: 800;
}
:deep(.el-tabs__item.is-active) {
  color: var(--text-primary);
}
:deep(.el-tabs__active-bar) {
  background-color: var(--accent-friend);
}
:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--border-subtle);
}
</style>
