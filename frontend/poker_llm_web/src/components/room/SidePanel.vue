<template>
  <div class="side-panel-container" :class="{ 'is-open': isOpen }">
    <div class="toggle-tab" @click="isOpen = !isOpen">
      <el-icon><ArrowLeft v-if="!isOpen" /><ArrowRight v-else /></el-icon>
      <span class="tab-text">Table Notes</span>
    </div>
    
    <div class="panel-content">
      <el-tabs v-model="activeTab" class="side-tabs">
        <el-tab-pane label="Hand History" name="history">
          <div class="history-scroll-area">
            <HandLog :events="rawEventLog" :isGameOver="isGameOver" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="AI Insights" name="insights">
          <div class="insights-scroll-area">
            <div v-if="!aiReasonings.length" class="empty-state">
              AI notes will appear after it makes a move.
            </div>
            <div v-else class="reasoning-list">
              <div v-for="(insight, idx) in aiReasonings" :key="idx" class="insight-card">
                <div class="insight-header">
                  <span class="action-badge">{{ insight.action }}</span>
                  <span class="action-amount" v-if="insight.amount">${{ insight.amount }}</span>
                </div>
                <div class="insight-body">
                  {{ cleanReasoningText(insight.reasoning) || "The AI made this move without explicit reasoning." }}
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import HandLog from '@/components/online/HandLog.vue'

const props = defineProps({
  rawEventLog: { type: Array, default: () => [] },
  isGameOver: { type: Boolean, default: false }
})

const isOpen = ref(false)
const activeTab = ref('history')

const aiReasonings = computed(() => {
  return props.rawEventLog
    .filter(e => (
      (e.type === 'ai_thought' && e.payload?.thought_summary) ||
      (e.event_type === 'player_action' && e.player_id?.startsWith('ai') && e.reasoning)
    ))
    .map(e => ({
      action: actionLabel(e.payload?.action || e.action_type),
      amount: e.payload?.amount || e.amount,
      reasoning: e.payload?.thought_summary || e.reasoning
    }))
    .reverse() // Newest first
})

// Clean up technical jargon from reasoning
const cleanReasoningText = (text) => {
  if (!text) return ''
  let cleaned = text.replace(/\(Confidence:\s*\d+%\)/gi, '')
  cleaned = cleaned.replace(/\[Confidence:\s*[^\]]+\]/gi, '')
  cleaned = cleaned.replace(/Reasoning:/gi, '')
  cleaned = cleaned.replace(/\b(regex|fallback|parse_status|confidence)\b:?/gi, '')
  cleaned = cleaned.replace(/\[[^\]]*%[^\]]*\]/g, '')
  
  return cleaned.trim()
}

const actionLabel = (action) => {
  if (!action) return 'AI note'
  const labels = {
    FOLD: 'Fold',
    CHECK: 'Check',
    CALL: 'Call',
    RAISE: 'Raise',
    ALL_IN: 'All-in'
  }
  return labels[action] || String(action).replace('_', ' ')
}
</script>

<style scoped>
.side-panel-container {
  position: absolute;
  top: 0;
  right: -340px;
  width: 340px;
  height: 100%;
  background-color: rgba(13, 19, 24, 0.94);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -5px 0 25px rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
  transition: right 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.side-panel-container.is-open {
  right: 0;
}

.toggle-tab {
  position: absolute;
  top: 100px;
  left: -40px;
  width: 40px;
  height: 140px;
  background-color: rgba(18, 27, 33, 0.95);
  border: 1px solid var(--border-subtle);
  border-right: none;
  border-radius: 8px 0 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  box-shadow: -5px 0 10px rgba(0,0,0,0.2);
  transition: color 0.2s, background 0.2s;
}

.toggle-tab:hover {
  color: var(--text-primary);
  background-color: var(--bg-panel-raised);
}

.tab-text {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.82rem;
  font-weight: 850;
  letter-spacing: 0.02em;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
}

.side-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  position: relative;
}

:deep(.el-tab-pane) {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.history-scroll-area, .insights-scroll-area {
  height: 100%;
  overflow-y: auto;
}

.insights-scroll-area::-webkit-scrollbar {
  width: 6px;
}
.insights-scroll-area::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.empty-state {
  color: var(--text-tertiary);
  text-align: center;
  margin-top: 2rem;
  font-size: 0.9rem;
}

.reasoning-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
}

.insight-card {
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.action-badge {
  font-size: 0.75rem;
  font-weight: 850;
  background: rgba(217, 173, 88, 0.13);
  color: var(--accent-primary);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-pill);
}

.action-amount {
  color: var(--accent-turn);
  font-size: 0.85rem;
  font-weight: 600;
}

.insight-body {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

@media (max-width: 720px) {
  .side-panel-container {
    top: auto;
    left: 0;
    right: 0;
    bottom: -58%;
    width: 100%;
    height: 58%;
    border-left: none;
    border-top: 1px solid var(--border-subtle);
    border-radius: 18px 18px 0 0;
    transition: bottom 0.3s ease;
  }

  .side-panel-container.is-open {
    right: 0;
    bottom: 0;
  }

  .toggle-tab {
    top: -38px;
    left: 50%;
    width: auto;
    height: 38px;
    padding: 0 0.85rem;
    transform: translateX(-50%);
    flex-direction: row;
    border-radius: var(--radius-pill) var(--radius-pill) 0 0;
    border-right: 1px solid var(--border-subtle);
    border-bottom: none;
  }

  .tab-text {
    writing-mode: horizontal-tb;
    transform: none;
  }
}
</style>
