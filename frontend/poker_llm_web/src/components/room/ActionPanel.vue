<template>
  <div class="action-panel-container">
    <div class="action-card" :class="{ 'is-disabled': disabled }">
      
      <!-- Stage 1: Primary Actions -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="!isRaising" class="primary-actions" key="primary">
          <div class="turn-prompt" v-if="!disabled">Choose your move</div>
          
          <div class="action-buttons">
            <el-button
              v-for="act in primaryActions"
              :key="act.action"
              size="large"
              class="act-btn"
              :class="actionClass(act.action)"
              :disabled="disabled"
              @click="submit(act.action)"
            >
              {{ actionLabel(act.action, act.amount) }}
            </el-button>

            <!-- The Raise button transitions to Stage 2 -->
            <el-button
              v-if="raiseAction"
              size="large"
              class="act-btn raise-btn"
              :disabled="disabled"
              @click="isRaising = true"
            >
              Raise
            </el-button>
          </div>

          <!-- Secondary All-In -->
          <div class="secondary-actions" v-if="allInAction">
            <el-button
              size="small"
              class="allin-btn"
              :disabled="disabled"
              @click="submit('ALL_IN')"
            >
              All-in {{ allInAmount }}
            </el-button>
          </div>
        </div>

        <!-- Stage 2: Raise Control Panel -->
        <div v-else class="raise-stage" key="raise">
          <RaiseControl 
            :minRaise="raiseAction.min_amount || 0"
            :maxRaise="raiseAction.max_amount || 9999"
            :potAmount="potAmount"
            @cancel="isRaising = false"
            @confirm="(amt) => submit('RAISE', amt)"
          />
        </div>
      </transition>
      
      <!-- Action Summary Overlay (Shows briefly after AI acts) -->
      <transition name="toast-fade">
        <div v-if="actionSummary" class="action-summary-toast">
          {{ actionSummary }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import RaiseControl from './RaiseControl.vue'

const props = defineProps({
  actions: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  potAmount: {
    type: Number,
    default: 0
  },
  actionSummary: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['submit-action'])

const isRaising = ref(false)

const raiseAction = computed(() => props.actions.find(a => a.action === 'RAISE'))
const allInAction = computed(() => props.actions.find(a => a.action === 'ALL_IN'))
const primaryActions = computed(() => props.actions.filter(a => a.action !== 'RAISE' && a.action !== 'ALL_IN'))

const allInAmount = computed(() => {
  const value = allInAction.value?.amount || raiseAction.value?.max_amount || ''
  return value ? `$${value}` : ''
})

// Reset raising state if actions change (e.g. new turn)
watch(() => props.actions, () => {
  isRaising.value = false
}, { deep: true })

const actionClass = (action) => {
  if (action === 'FOLD') return 'secondary-btn'
  if (action === 'CHECK' || action === 'CALL') return 'primary-btn'
  return 'utility-btn'
}

const actionLabel = (action, amount) => {
  if (action === 'FOLD') return 'Fold'
  if (action === 'CHECK') return 'Check'
  if (action === 'CALL') return amount ? `Call $${amount}` : 'Call'
  return action.replace('_', ' ')
}

const submit = (action, amount = null) => {
  isRaising.value = false
  emit('submit-action', action, amount)
}
</script>

<style scoped>
.action-panel-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
  width: 100%;
  position: relative;
}

.action-card {
  background:
    linear-gradient(180deg, rgba(217, 173, 88, 0.07), rgba(0, 0, 0, 0.08)),
    rgba(24, 18, 15, 0.92);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(18px);
  width: min(680px, 100%);
  min-width: 0;
  transition: opacity 0.3s, transform 0.3s;
  position: relative;
}

.action-card.is-disabled {
  opacity: 0.38;
  pointer-events: none;
}

.primary-actions {
  display: flex;
  flex-direction: column;
}

.turn-prompt {
  text-align: center;
  color: var(--accent-turn);
  font-weight: 850;
  letter-spacing: 0.02em;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-shadow: 0 0 10px rgba(241, 199, 106, 0.22);
  animation: pulse-text 2s infinite alternate;
}

@keyframes pulse-text {
  from { opacity: 0.7; }
  to { opacity: 1; text-shadow: 0 0 15px rgba(241, 199, 106, 0.44); }
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  justify-content: center;
}

.act-btn {
  flex: 1;
  font-weight: 850;
  letter-spacing: 0;
  height: 56px;
  font-size: 1.02rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  margin: 0 !important;
  color: var(--text-inverse);
}

.primary-btn {
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border-color: rgba(255, 255, 255, 0.14);
}

.primary-btn:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.secondary-btn {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.07);
  border-color: var(--border-subtle);
}

.secondary-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--border-strong);
}

.raise-btn {
  color: var(--text-primary);
  background: linear-gradient(180deg, var(--burgundy-rich), var(--accent-friend));
  border-color: rgba(255, 255, 255, 0.18);
}

.secondary-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border-subtle);
}

.allin-btn {
  font-size: 0.86rem !important;
  font-weight: 850;
  letter-spacing: 0;
  opacity: 0.9;
  height: 38px;
  border-radius: var(--radius-pill);
  color: #ffe7dd;
  background: rgba(180, 69, 63, 0.2);
  border: 1px solid rgba(180, 69, 63, 0.48);
  margin: 0;
}
.allin-btn:hover {
  opacity: 1;
  color: #fff7f5;
  background: rgba(180, 69, 63, 0.32);
  border-color: rgba(217, 173, 88, 0.4);
}

.raise-stage {
  width: 100%;
}

.action-summary-toast {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent-primary);
  color: var(--text-inverse);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-pill);
  font-weight: 850;
  font-size: 1rem;
  box-shadow: 0 8px 24px rgba(217, 173, 88, 0.28);
  z-index: 100;
  pointer-events: none;
  white-space: nowrap;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

@media (max-width: 620px) {
  .action-panel-container {
    padding: 0;
  }

  .action-card {
    padding: 0.85rem;
  }

  .action-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .act-btn {
    height: 52px;
    font-size: 0.95rem;
  }
}
</style>
