<template>
  <div class="panel-container">
    <div class="panel-card">
      <el-tabs v-model="activeTab" class="lobby-tabs">
        <el-tab-pane label="Host a Game" name="host">
          <div class="tab-content">
            <div class="form-group">
              <label>Display Name</label>
              <el-input v-model="displayName" placeholder="Enter your name" class="panel-input" />
            </div>
            <div class="action-wrapper">
              <el-button type="primary" class="panel-btn submit-btn" @click="handleCreate" :loading="loading">
                Create Room
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="Join a Game" name="join">
          <div class="tab-content">
            <div class="form-group">
              <label>Display Name</label>
              <el-input v-model="joinDisplayName" placeholder="Enter your name" class="panel-input" />
            </div>
            <div class="form-group">
              <label>Room ID</label>
              <el-input v-model="joinRoomId" placeholder="Enter 6-character room ID" class="panel-input" />
            </div>
            <div class="action-wrapper">
              <el-button class="panel-btn join-btn" @click="handleJoin" :loading="loading" :disabled="!joinRoomId">
                Join Room
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOnlineStore } from '@/stores/online'
import { ElMessage } from 'element-plus'

const router = useRouter()
const onlineStore = useOnlineStore()

const activeTab = ref('host')
const loading = ref(false)

const displayName = ref(localStorage.getItem('poker_hvh_name') || 'Player 1')
const joinDisplayName = ref(localStorage.getItem('poker_hvh_name') || 'Player 2')
const joinRoomId = ref('')

const handleCreate = async () => {
  if (!displayName.value) return ElMessage.warning("Display name is required")
  localStorage.setItem('poker_hvh_name', displayName.value)
  
  loading.value = true
  try {
    const roomId = await onlineStore.createRoom('hvsh', displayName.value)
    router.replace(`/room/${roomId}`)
  } catch (err) {
    ElMessage.error(err.message || 'Failed to create room')
  } finally {
    loading.value = false
  }
}

const handleJoin = async () => {
  if (!joinDisplayName.value || !joinRoomId.value) return ElMessage.warning("Name and Room ID are required")
  localStorage.setItem('poker_hvh_name', joinDisplayName.value)
  
  loading.value = true
  try {
    await onlineStore.joinRoom(joinRoomId.value, joinDisplayName.value)
    router.replace(`/room/${joinRoomId.value}`)
  } catch (err) {
    ElMessage.error(err.message || 'Failed to join room')
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
