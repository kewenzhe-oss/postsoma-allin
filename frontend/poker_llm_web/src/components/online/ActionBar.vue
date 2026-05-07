<template>
  <div class="action-bar-container" v-if="(actions && actions.length > 0) || isAiTurn">
    <div class="action-card" v-if="actions && actions.length > 0">
      <div class="raise-controls" v-if="raiseAction">
        <div class="slider-header">
          <span>Raise Amount</span>
          <span class="raise-val">{{ raiseAmount }}</span>
        </div>
        <el-slider
          v-model="raiseAmount"
          :min="raiseAction.min_amount || 0"
          :max="raiseAction.max_amount || 9999"
          :step="1"
          class="custom-slider"
        />
        <div class="slider-bounds">
          <span class="bound-label">Min: {{ raiseAction.min_amount }}</span>
          <span class="bound-label">Max: {{ raiseAction.max_amount }}</span>
        </div>
        <div class="quick-bets">
          <el-button size="small" @click="setToMin" color="#111820" plain>Min</el-button>
          <el-button size="small" @click="setToHalf" color="#111820" plain>½ Max</el-button>
          <el-button size="small" @click="setToMax" color="#111820" plain>Max</el-button>
        </div>
      </div>

      <div class="action-buttons">
        <el-button
          v-for="act in primaryActions"
          :key="act.action"
          :type="getBtnType(act.action)"
          size="large"
          class="act-btn"
          @click="submit(act.action)"
        >
          {{ act.action }}
        </el-button>

        <el-button
          v-if="raiseAction"
          type="warning"
          size="large"
          class="act-btn"
          @click="submit('RAISE', raiseAmount)"
        >
          RAISE {{ raiseAmount }}
        </el-button>
      </div>

      <!-- ALL_IN: secondary row, smaller, de-emphasized -->
      <div class="secondary-actions" v-if="allInAction">
        <el-button
          type="danger"
          size="small"
          class="allin-btn"
          plain
          @click="submit('ALL_IN')"
        >
          ⚠ ALL IN ({{ allInAmount }})
        </el-button>
      </div>
    </div>
    
    <div class="action-card ai-waiting-card" v-else-if="isAiTurn">
      <div class="ai-spinner">🤖</div>
      <div class="ai-thinking-col">
        <div class="ai-message">AI is thinking</div>
        <div class="ai-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  actions: {
    type: Array,
    default: () => []
  },
  isAiTurn: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit-action'])

const raiseAmount = ref(0)

const raiseAction = computed(() => {
  return props.actions.find(a => a.action === 'RAISE')
})

// Primary actions = everything except RAISE and ALL_IN
const primaryActions = computed(() => {
  return props.actions.filter(a => a.action !== 'RAISE' && a.action !== 'ALL_IN')
})

// ALL_IN separated
const allInAction = computed(() => {
  return props.actions.find(a => a.action === 'ALL_IN')
})

// Max chips as ALL_IN amount hint (from heroPlayer's chips via raiseAction max, or fallback)
const allInAmount = computed(() => {
  if (raiseAction.value) return raiseAction.value.max_amount || ''
  return ''
})

watch(() => raiseAction.value, (newVal) => {
  if (newVal) {
    raiseAmount.value = newVal.min_amount
  }
}, { immediate: true })

const setToMin = () => {
  if (raiseAction.value) raiseAmount.value = raiseAction.value.min_amount || 0
}
const setToHalf = () => {
  if (raiseAction.value) {
    const min = raiseAction.value.min_amount || 0
    const max = raiseAction.value.max_amount || 0
    raiseAmount.value = Math.round((min + max) / 2)
  }
}
const setToMax = () => {
  if (raiseAction.value) raiseAmount.value = raiseAction.value.max_amount || 0
}

const getBtnType = (action) => {
  if (action === 'FOLD') return 'info'
  if (action === 'CHECK') return 'primary'
  if (action === 'CALL') return 'success'
  if (action === 'ALL_IN') return 'danger'
  return 'default'
}

const submit = (action, amount = null) => {
  emit('submit-action', action, amount)
}
</script>

<style scoped>
.action-bar-container {
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.action-card {
  background-color: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  min-width: 400px;
}

.raise-controls {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  color: #9CA3AF;
  font-size: 14px;
  margin-bottom: 0.5rem;
}

.raise-val {
  color: #D6A85A;
  font-weight: bold;
}

.quick-bets {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  gap: 0.5rem;
}

.slider-bounds {
  display: flex;
  justify-content: space-between;
  margin-top: 3px;
}

.bound-label {
  font-size: 11px;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.act-btn {
  flex: 1;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* ── Secondary ALL_IN row ─────────────────────────── */
.secondary-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.allin-btn {
  font-size: 12px !important;
  font-weight: 600;
  letter-spacing: 0.5px;
  opacity: 0.8;
}
.allin-btn:hover {
  opacity: 1;
}

/* ── AI Waiting Card ─────────────────────────────── */
.ai-waiting-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
}

.ai-spinner {
  font-size: 24px;
  animation: bounce 1.5s infinite;
}

.ai-thinking-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ai-message {
  font-size: 16px;
  font-weight: 600;
  color: #9CA3AF;
  letter-spacing: 0.5px;
}

/* Animated dots */
.ai-dots {
  display: flex;
  gap: 5px;
  align-items: center;
}

.ai-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--accent-primary);
  animation: dot-pulse 1.4s infinite ease-in-out both;
}

.ai-dots span:nth-child(1) { animation-delay: 0s; }
.ai-dots span:nth-child(2) { animation-delay: 0.2s; }
.ai-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

</style>
