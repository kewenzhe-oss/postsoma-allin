<template>
  <div class="hand-history-panel">
    <!-- Header with live status and Jump-to-Live prompt -->
    <div class="panel-header">
      <div class="header-title-row">
        <h4>Hand History</h4>
        <span v-if="onlineStore.activeHand?.status === 'active'" class="live-indicator">
          <span class="pulse-dot"></span> LIVE
        </span>
      </div>

      <!-- Review Lock Notice & Jump-to-Live Button -->
      <transition name="slide-fade">
        <div v-if="onlineStore.isReviewingPastHand" class="review-lock-banner">
          <span class="review-text">
            Reviewing #{{ onlineStore.userReviewHandNumber }} • Hand #{{ onlineStore.activeHandNumber }} is live
          </span>
          <button class="jump-live-btn" @click="handleJumpToLive">
            Jump to Live &rarr;
          </button>
        </div>
      </transition>
    </div>

    <!-- Hand History List (Accordion) -->
    <div class="history-content" ref="historyContainer">
      <el-collapse
        v-model="activeNames"
        class="premium-collapse"
        accordion
        @change="handleCollapseChange"
      >
        <el-collapse-item
          v-for="hand in onlineStore.allHands"
          :key="hand.hand_number"
          :name="hand.hand_number.toString()"
          :class="{ 'is-active-hand': hand.status === 'active' }"
        >
          <template #title>
            <div class="hand-title">
              <span
                class="hand-badge"
                :class="{ 'badge-active': hand.status === 'active' }"
              >
                HAND #{{ hand.hand_number }}
              </span>
              <span class="hand-summary" v-html="getHandSummaryHtml(hand)"></span>
            </div>
          </template>

          <div class="hand-details">
            <div
              v-for="street in hand.streets"
              :key="street.name"
              class="street-group"
            >
              <div class="street-header">
                <span class="street-name">{{ street.name }}</span>
                <span v-if="street.cards" class="street-cards" v-html="street.cards"></span>
              </div>
              <div class="street-actions">
                <div
                  v-for="(action, idx) in street.actions"
                  :key="idx"
                  class="action-line"
                  :class="{
                    'is-ai': action.isAi,
                    'is-wager': action.isWager
                  }"
                >
                  <span v-html="action.text"></span>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>

      <div v-if="onlineStore.allHands.length === 0" class="empty-history">
        <span class="empty-icon">&#9824;</span>
        <p>Waiting for the first hand...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { useOnlineStore } from '@/stores/online'

const onlineStore = useOnlineStore()
const activeNames = ref([])
const historyContainer = ref(null)

// Auto-focus logic:
// When activeHandNumber changes and user is NOT reviewing a past hand,
// automatically expand the newest active hand.
watch(
  () => onlineStore.activeHandNumber,
  (newHandNum) => {
    if (newHandNum && !onlineStore.isReviewingPastHand) {
      activeNames.value = [newHandNum.toString()]
      nextTick(() => {
        if (historyContainer.value) {
          historyContainer.value.scrollTop = 0
        }
      })
    }
  },
  { immediate: true }
)

// Also ensure that if allHands becomes populated initially, expand the top hand
watch(
  () => onlineStore.allHands.length,
  (len) => {
    if (len > 0 && activeNames.value.length === 0 && !onlineStore.isReviewingPastHand) {
      activeNames.value = [onlineStore.allHands[0].hand_number.toString()]
    }
  },
  { immediate: true }
)

function handleCollapseChange(val) {
  // If user opened an accordion item
  if (val) {
    const selectedNum = parseInt(val, 10)
    if (selectedNum && selectedNum !== onlineStore.activeHandNumber) {
      onlineStore.lockReviewHand(selectedNum)
    } else {
      onlineStore.returnToLiveHand()
    }
  }
}

function handleJumpToLive() {
  onlineStore.returnToLiveHand()
  if (onlineStore.activeHandNumber) {
    activeNames.value = [onlineStore.activeHandNumber.toString()]
  }
  nextTick(() => {
    if (historyContainer.value) {
      historyContainer.value.scrollTop = 0
    }
  })
}

function getHandSummaryHtml(hand) {
  if (hand.status === 'active') {
    return '<span class="log-live-badge">Live in progress</span>'
  }
  const resultStreet = hand.streets?.find(s => s.name === 'Result')
  if (resultStreet && resultStreet.actions?.length > 0) {
    const raw = resultStreet.actions[0].text
    // Show only the first winning summary line in header title
    return raw.replace(/<br>.*/s, '')
  }
  return '<span class="log-muted small">Finished</span>'
}
</script>

<style scoped>
.hand-history-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: #e2e8f0;
  font-family: inherit;
}

.panel-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.6);
}

.header-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title-row h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #f8fafc;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 2px 7px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot-anim 1.5s infinite;
}

@keyframes pulse-dot-anim {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.review-lock-banner {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
}

.review-text {
  font-size: 0.75rem;
  color: #fbbf24;
  font-weight: 500;
}

.jump-live-btn {
  background: #f59e0b;
  color: #0f172a;
  border: none;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.jump-live-btn:hover {
  background: #d97706;
  transform: translateY(-1px);
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

:deep(.premium-collapse) {
  border: none;
  background: transparent;
}

:deep(.el-collapse-item__header) {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 0.35rem;
  padding: 0.6rem 0.75rem;
  height: auto;
  min-height: 40px;
  color: #e2e8f0;
  transition: all 0.2s ease;
}

:deep(.el-collapse-item__header:hover) {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(255, 255, 255, 0.12);
}

:deep(.el-collapse-item.is-active-hand .el-collapse-item__header) {
  border-left: 3px solid #10b981;
  background: rgba(16, 185, 129, 0.08);
}

:deep(.el-collapse-item__wrap) {
  background: rgba(15, 23, 42, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0 0 6px 6px;
  margin-top: -0.35rem;
  margin-bottom: 0.5rem;
}

:deep(.el-collapse-item__content) {
  padding: 0.75rem;
  color: #cbd5e1;
}

.hand-title {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  overflow: hidden;
  font-size: 0.82rem;
}

.hand-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.badge-active {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.hand-summary {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.78rem;
  color: #cbd5e1;
}

:deep(.log-live-badge) {
  color: #10b981;
  font-weight: 600;
  letter-spacing: 0.04em;
}

:deep(.log-pot) {
  color: #fbbf24;
  font-weight: 600;
}

:deep(.log-success) {
  color: #34d399;
  font-weight: 600;
}

:deep(.log-accent) {
  color: #60a5fa;
  font-weight: 600;
}

:deep(.log-muted) {
  color: #94a3b8;
}

:deep(.small) {
  font-size: 0.75rem;
}

:deep(.ai-thought-text) {
  color: #93c5fd;
  font-style: italic;
}

:deep(.card-pill) {
  display: inline-block;
  padding: 0 4px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 700;
  margin: 0 2px;
  background: #ffffff;
}

:deep(.card-red) {
  color: #ef4444;
}

:deep(.card-black) {
  color: #0f172a;
}

.street-group {
  margin-bottom: 0.6rem;
  border-left: 2px solid rgba(255, 255, 255, 0.1);
  padding-left: 0.6rem;
}

.street-group:last-child {
  margin-bottom: 0;
}

.street-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.35rem;
}

.street-name {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.street-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.action-line {
  font-size: 0.78rem;
  line-height: 1.4;
  color: #e2e8f0;
}

.action-line.is-ai {
  background: rgba(59, 130, 246, 0.08);
  border-left: 2px solid #3b82f6;
  padding: 3px 6px;
  border-radius: 0 4px 4px 0;
  margin: 2px 0;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #64748b;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.4;
}

.empty-history p {
  margin: 0;
  font-size: 0.85rem;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-6px);
  opacity: 0;
}
</style>
