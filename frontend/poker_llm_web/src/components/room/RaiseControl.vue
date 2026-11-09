<template>
  <div class="raise-control">
    <div class="raise-header">
      <div class="raise-title-group">
        <span class="raise-label">{{ currentBet > 0 ? (isZh ? '加注至' : 'Raise to') : (isZh ? '下注' : 'Bet') }}</span>
        <span class="raise-value">{{ target }}</span>
        <span v-if="heroBet > 0" class="raise-sub">{{ isZh ? `需补 ${amount}` : `Pay ${amount}` }}</span>
      </div>
      <div class="amount-breakdown">
        <span v-if="breakdown.toCall > 0">{{ isZh ? '跟注' : 'Call' }} <b>{{ breakdown.toCall }}</b></span>
        <span v-if="heroBet > 0">{{ isZh ? '已投' : 'In' }} <b>{{ heroBet }}</b></span>
        <span>{{ isZh ? '底池' : 'Pot' }} <b>{{ potAmount }}</b></span>
      </div>
    </div>
    
    <div class="size-grid" role="group" :aria-label="isZh ? '下注尺度' : 'Bet sizes'">
      <button v-for="size in sizes" :key="size.label" type="button" :disabled="!size.legal" :aria-pressed="amount === size.invest" :title="size.legal ? '' : (isZh ? '不满足加注范围' : 'Outside raise limits')" @click="amount = size.invest">
        <strong>{{ size.label }}</strong><span>{{ size.invest }}</span>
      </button>
    </div>
    <div class="custom-size">
      <el-slider v-model="amount" class="raise-slider" :min="minInvest" :max="maxInvest" :step="1" :show-tooltip="false" :aria-label="isZh ? '滑动调整筹码' : 'Slide to adjust chips'" />
      <el-input-number v-model="amount" class="raise-input" size="small" :min="minInvest" :max="maxInvest" :step="1" :precision="0" :aria-label="isZh ? '本次投入筹码' : 'Chips to pay now'" />
      <button type="button" class="max-pill" :aria-pressed="amount === maxInvest" @click="amount = maxInvest">
        {{ isZh ? '最大' : 'Max' }}
      </button>
    </div>
    <div class="actions">
      <el-button class="cancel-btn" @click="$emit('cancel')">{{ isZh ? '取消' : 'Cancel' }}</el-button>
      <el-button class="confirm-btn" :disabled="!Number.isInteger(amount) || amount < minInvest || amount > maxInvest" @click="$emit('confirm', target)">
        {{ currentBet > 0 ? (isZh ? `确认加注 ${target}` : `Raise to ${target}`) : (isZh ? `确认下注 ${target}` : `Bet ${target}`) }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { isZh } from '@/i18n/locale.js'
import { POT_SIZES, potBetAmount, raiseTarget, raiseAmounts } from '@/utils/poker/betSizing.js'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  currentBet: { type:Number, default:0 },
  heroBet: { type:Number, default:0 },
  minRaise: { type: Number, required: true },
  maxRaise: { type: Number, required: true },
  potAmount: { type: Number, required: true }
})

defineEmits(['cancel', 'confirm'])

const minInvest = computed(() => Math.max(0, props.minRaise - props.heroBet))
const maxInvest = computed(() => Math.max(0, props.maxRaise - props.heroBet))
const amount = ref(minInvest.value)
const target = computed(() => raiseTarget(amount.value, props.heroBet))
const breakdown = computed(() => raiseAmounts({pot:props.potAmount, currentBet:props.currentBet, heroBet:props.heroBet}, target.value))
const sizes = computed(() => POT_SIZES.map((fraction, index) => {
  const invest = potBetAmount(props.potAmount, fraction)
  const label = isZh.value
    ? ['⅓ 底池', '½ 底池', '¾ 底池', '1 倍底池', '1.5 倍底池', '2 倍底池'][index]
    : ['⅓ pot', '½ pot', '¾ pot', '1× pot', '1.5× pot', '2× pot'][index]
  return {label, invest, legal:invest >= minInvest.value && invest <= maxInvest.value}
}))
watch([minInvest, maxInvest], ([minimum, maximum]) => {
  amount.value = Math.max(minimum, Math.min(maximum, amount.value))
})
</script>

<style scoped>
.amount-breakdown { display:flex; flex-wrap:wrap; align-items:center; gap:.55rem; color:var(--text-secondary); font-size:.78rem; }
.amount-breakdown b { color:var(--text-primary); font-variant-numeric:tabular-nums; }
.size-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.4rem; }
.size-grid button { min-height:42px; padding:.25rem .4rem; border:1px solid var(--border-strong); border-radius:var(--radius-sm); background:var(--bg-panel-solid); color:var(--text-primary); cursor:pointer; font:inherit; display:flex; align-items:center; justify-content:space-between; gap:.25rem; transition:border-color .15s, background-color .15s; }
.size-grid button strong { font-size:.8rem; font-weight:800; }
.size-grid button span { font-size:.78rem; color:var(--accent-turn); font-weight:750; font-variant-numeric:tabular-nums; }
.size-grid button[aria-pressed="true"] { border-color:var(--accent-primary); background:rgba(217, 173, 88, 0.16); box-shadow:inset 0 0 0 1px rgba(241, 199, 106, 0.28); }
.size-grid button:disabled { opacity:.35; cursor:default; }
.size-grid button:focus-visible, .max-pill:focus-visible { outline:2px solid var(--accent-primary); outline-offset:2px; }
.custom-size { display:flex; align-items:center; gap:.65rem; padding:0 .15rem; }
.raise-slider { flex:1; min-width:0; margin:0 .25rem; }
.raise-input { width:108px; flex-shrink:0; }
.max-pill {
  height:32px;
  padding:0 .65rem;
  border-radius:var(--radius-pill);
  border:1px solid rgba(230, 111, 104, 0.45);
  background:rgba(180, 69, 63, 0.18);
  color:#ffe7dd;
  font-size:.76rem;
  font-weight:800;
  cursor:pointer;
  flex-shrink:0;
}
.max-pill[aria-pressed="true"] {
  border-color:var(--accent-primary);
  background:rgba(217, 173, 88, 0.22);
  color:var(--text-primary);
}
.raise-control {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  background-color: var(--bg-panel-raised);
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(241, 199, 106, 0.3);
  animation: slideUp 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.raise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.raise-title-group {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.raise-label {
  color: var(--text-secondary);
  font-size: 0.84rem;
  font-weight: 800;
}

.raise-sub {
  color: var(--text-tertiary);
  font-size: 0.74rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.raise-value {
  color: var(--accent-turn);
  font-size: 1.25rem;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.actions {
  display: flex;
  gap: 0.55rem;
  margin-top: 0.1rem;
}

.cancel-btn {
  flex: 0 0 88px;
  height: 44px;
  margin: 0 !important;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  font-weight: 800;
}
.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-primary);
}

.confirm-btn {
  flex: 1;
  height: 44px;
  margin: 0 !important;
  border-radius: var(--radius-md);
  font-weight: 900;
  font-size: 0.98rem;
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border-color: rgba(255, 255, 255, 0.18);
  color: var(--text-inverse);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Desktop: same vertical flow as mobile, slightly tighter than the default */
@media (min-width:721px) {
 .raise-control { padding:.75rem .9rem; gap:.55rem; }
 .size-grid button { min-height:42px; padding:.3rem .55rem; }
}
@media (max-width:720px) {
 .raise-control { padding:.55rem .65rem; gap:.42rem; }
 .size-grid { gap:.32rem; }
 .size-grid button { min-height:36px; padding:.2rem .38rem; }
 .size-grid button strong { font-size:.76rem; }
 .size-grid button span { font-size:.74rem; }
 .custom-size { gap:.45rem; }
 .raise-input { width:98px; }
 .actions { gap:.45rem; }
 .cancel-btn { flex:0 0 76px; height:42px; }
 .confirm-btn { height:42px; font-size:.94rem; }
}
</style>
