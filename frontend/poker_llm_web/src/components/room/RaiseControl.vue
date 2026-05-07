<template>
  <div class="raise-control">
    <div class="raise-header">
      <span class="raise-label">Raise to</span>
      <span class="raise-value">${{ amount }}</span>
    </div>
    
    <div class="slider-container">
      <el-slider 
        v-model="amount" 
        :min="minRaise" 
        :max="maxRaise" 
        :step="1"
        :show-tooltip="false"
      />
    </div>

    <div class="shortcuts">
      <el-button size="small" plain @click="amount = minRaise">Min</el-button>
      <el-button size="small" plain @click="setFraction(0.5)">1/2 Pot</el-button>
      <el-button size="small" plain @click="setFraction(1)">Pot</el-button>
      <el-button size="small" plain class="max-shortcut" @click="amount = maxRaise">Max</el-button>
    </div>

    <div class="actions">
      <el-button class="cancel-btn" text @click="$emit('cancel')">Cancel</el-button>
      <el-button class="confirm-btn" @click="$emit('confirm', amount)">
        Confirm Raise to ${{ amount }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  minRaise: { type: Number, required: true },
  maxRaise: { type: Number, required: true },
  potAmount: { type: Number, required: true }
})

defineEmits(['cancel', 'confirm'])

const amount = ref(props.minRaise)

watch(() => props.minRaise, (newVal) => {
  if (amount.value < newVal) amount.value = newVal
})

const setFraction = (frac) => {
  let target = Math.floor(props.potAmount * frac)
  if (target < props.minRaise) target = props.minRaise
  if (target > props.maxRaise) target = props.maxRaise
  amount.value = target
}
</script>

<style scoped>
.raise-control {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--bg-panel-raised);
  padding: 1.15rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(241, 199, 106, 0.3);
  animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.raise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.raise-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 800;
}

.raise-value {
  color: var(--accent-turn);
  font-size: 1.4rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.shortcuts {
  display: flex;
  gap: 0.5rem;
}

.shortcuts .el-button {
  flex: 1;
  background-color: transparent;
  border-color: var(--border-subtle);
  color: var(--text-secondary);
  border-radius: var(--radius-pill);
  font-weight: 800;
  margin: 0;
}

.shortcuts .el-button:hover {
  border-color: rgba(241, 199, 106, 0.42);
  color: var(--accent-turn);
}

.shortcuts .max-shortcut:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  flex: 1;
  color: var(--text-secondary);
}
.cancel-btn:hover {
  color: var(--text-primary);
}

.confirm-btn {
  flex: 2;
  font-weight: 900;
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border-color: rgba(255, 255, 255, 0.18);
  color: var(--text-inverse);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
