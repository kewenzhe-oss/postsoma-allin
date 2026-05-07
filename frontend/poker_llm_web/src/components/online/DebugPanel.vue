<template>
  <div class="debug-panel" :class="{ 'is-collapsed': collapsed }">
    <div class="debug-header" @click="collapsed = !collapsed">
      <h4><el-icon><Warning /></el-icon> Debug View</h4>
      <el-icon><ArrowDown v-if="!collapsed" /><ArrowUp v-else /></el-icon>
    </div>
    <div class="debug-content" v-show="!collapsed">
      <div class="section">
        <h5>Private State</h5>
        <pre>{{ onlineStore.privateState }}</pre>
      </div>
      <div class="section">
        <h5>Public State</h5>
        <pre>{{ onlineStore.publicState }}</pre>
      </div>
      <div class="section">
        <h5>Available Actions</h5>
        <pre>{{ onlineStore.availableActions }}</pre>
      </div>
      <div class="section">
        <h5>AI Thoughts <span class="section-note">(summary only — no raw prompt/key)</span></h5>
        <div class="log-scroll">
          <pre v-for="(t, i) in onlineStore.aiThoughts" :key="i" class="ai-thought-entry">Hand #{{ t.hand_number }} [{{ t.stage }}] conf={{ (t.confidence * 100).toFixed(0) }}% [{{ t.parse_status }}]
{{ t.thought_summary }}
tags: {{ (t.strategy_tags || []).join(', ') || 'none' }}</pre>
        </div>
      </div>
      <div class="section">
        <h5>Raw Event Log</h5>
        <div class="log-scroll">
          <pre v-for="ev in onlineStore.rawEventLog" :key="ev.seq">{{ ev }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useOnlineStore } from '@/stores/online'
import { Warning, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

const onlineStore = useOnlineStore()
const collapsed = ref(true)
</script>

<style scoped>
.debug-panel {
  background-color: #111820;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  width: 400px;
  height: 100%;
}

.debug-panel.is-collapsed {
  width: 40px;
  overflow: hidden;
}

.debug-header {
  padding: 1rem;
  background-color: #1A2430;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.debug-header h4 {
  margin: 0;
  color: #F4F1EA;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.is-collapsed .debug-header {
  writing-mode: vertical-rl;
  padding: 1rem 0;
  justify-content: center;
  height: 100%;
}

.is-collapsed .debug-header h4 {
  transform: rotate(180deg);
}

.debug-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section h5 {
  margin: 0 0 0.5rem 0;
  color: var(--accent-primary);
  font-size: 12px;
  text-transform: uppercase;
}

pre {
  background-color: #0B0F14;
  padding: 0.75rem;
  border-radius: 4px;
  color: #9CA3AF;
  font-size: 11px;
  overflow-x: auto;
  margin: 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.log-scroll {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.section-note {
  color: #4B5563;
  font-size: 10px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  margin-left: 4px;
}

.ai-thought-entry {
  border-left: 2px solid rgba(110, 168, 255, 0.3) !important;
  color: #7CA3D6 !important;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
