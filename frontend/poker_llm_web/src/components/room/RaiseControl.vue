<template>
  <div class="raise-control">
    <div class="raise-header">
      <span class="raise-label">{{ currentBet ? (isZh ? '加到' : 'Raise to') : (isZh ? '下注' : 'Bet') }}</span>
      <span class="raise-value">{{ amount }}</span>
    </div>
    
    <p class="size-context">{{ isZh ? '选择底池比例' : 'Choose a pot fraction' }} · {{ currentBet > heroBet ? (isZh ? '按跟注后的底池计算加注' : 'Raise based on the pot after calling') : (isZh ? '按当前底池计算' : 'Based on the current pot') }}</p>
    <div class="size-grid" role="group" :aria-label="isZh ? '下注尺度' : 'Bet sizes'">
      <button v-for="size in sizes" :key="size.label" type="button" :disabled="!size.legal" :aria-pressed="amount === size.target" @click="amount = size.target">
        <strong>{{ size.label }}</strong><span>{{ size.target }}</span>
      </button>
      <button type="button" :aria-pressed="amount === minRaise" @click="amount = minRaise">{{ isZh ? '最小' : 'Minimum' }}<span>{{ minRaise }}</span></button>
      <button type="button" :aria-pressed="amount === maxRaise" @click="amount = maxRaise">{{ isZh ? '最大' : 'Maximum' }}<span>{{ maxRaise }}</span></button>
    </div>
    <details class="custom-size">
      <summary>{{ isZh ? '自定义金额' : 'Custom amount' }}</summary>
      <el-input-number v-model="amount" :min="minRaise" :max="maxRaise" :step="1" :precision="0" :aria-label="isZh ? '目标下注总额' : 'Total bet target'" />
      <el-slider v-model="amount" :min="minRaise" :max="maxRaise" :step="1" />
    </details>
    <div class="actions">
      <el-button class="cancel-btn" text @click="$emit('cancel')">{{ isZh ? '取消' : 'Cancel' }}</el-button>
      <el-button class="confirm-btn" :disabled="!Number.isInteger(amount) || amount < minRaise || amount > maxRaise" @click="$emit('confirm', amount)">
        {{ isZh ? '确认' : 'Confirm' }} {{ currentBet ? (isZh ? '加到' : 'raise to') : (isZh ? '下注' : 'bet') }} {{ amount }} · {{ isZh ? '投入' : 'invest' }} {{ amount - heroBet }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { isZh } from '@/i18n/locale.js'
import { POT_SIZES, potRaiseTarget } from '@/utils/poker/betSizing.js'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  currentBet: { type:Number, default:0 },
  heroBet: { type:Number, default:0 },
  minRaise: { type: Number, required: true },
  maxRaise: { type: Number, required: true },
  potAmount: { type: Number, required: true }
})

defineEmits(['cancel', 'confirm'])

const amount = ref(props.minRaise)

watch(() => props.minRaise, (newVal) => {
  if (amount.value < newVal) amount.value = newVal
})

const sizes = computed(()=>POT_SIZES.map((fraction,index)=>{
 const target=potRaiseTarget({pot:props.potAmount,currentBet:props.currentBet,heroBet:props.heroBet},fraction)
 return {label:['⅓','½','¾','1×','1.5×','2×'][index],target,legal:target>=props.minRaise&&target<=props.maxRaise}
}))
watch(()=>props.maxRaise,value=>{ if(amount.value>value) amount.value=value })
</script>

<style scoped>
.size-context { margin:0; color:var(--text-secondary); font-size:.85rem; }
.size-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:.5rem; }
.size-grid button { min-height:54px; border:1px solid var(--border-strong); border-radius:var(--radius-md); background:var(--bg-panel-solid); color:var(--text-primary); cursor:pointer; font:inherit; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.2rem; }
.size-grid button span { font-size:.8rem; color:var(--text-secondary); }
.size-grid button[aria-pressed="true"] { border-color:var(--accent-primary); background:var(--bg-panel-raised); }
.size-grid button:disabled { opacity:.4; cursor:default; }
.size-grid button:focus-visible, summary:focus-visible { outline:2px solid var(--accent-primary); outline-offset:2px; }
.custom-size summary { cursor:pointer; padding:.5rem 0; color:var(--text-secondary); }
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
/* Desktop: same vertical flow as mobile, slightly tighter than the default */
@media (min-width:721px) {
 .raise-control { padding:.9rem 1rem; gap:.7rem; }
 .size-grid button { min-height:50px; }
 .actions { margin-top:.25rem; }
}
@media (max-width:720px) {
 .raise-control { padding:.75rem; gap:.6rem; }
 .size-grid button { min-height:48px; }
 .actions { gap:.5rem; }
 .confirm-btn { white-space:normal; height:auto; min-height:48px; line-height:1.4; }
}
</style>
