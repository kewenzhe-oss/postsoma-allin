<template>
  <div class="hand-result-center" role="status" aria-live="polite">
    <div class="headline-row">
      <span class="winner-title">{{ summary }}</span>
      <span v-if="winningReason" class="winning-reason">· {{ winningReason }}</span>
    </div>
    
    <div class="subline-row" v-if="amounts">
      <span class="amounts-tag">{{ amounts }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isZh } from '@/i18n/locale.js'

const props = defineProps({
  result: { type: Object, required: true }
})

const summary = computed(() => {
  const winners = props.result.winners || []
  if (winners.length > 1) return isZh.value ? '分池' : 'Split pot'
  const name = winners[0]?.display_name || winners[0]?.player_id || ''
  return `${name} ${isZh.value ? '获胜' : 'wins'}`
})

const zhHandNames = {
  'High Card': '高牌',
  'One Pair': '一对',
  'Pair': '一对',
  'Two Pair': '两对',
  'Three of a Kind': '三条',
  'Straight': '顺子',
  'Flush': '同花',
  'Full House': '葫芦',
  'Four of a Kind': '四条',
  'Straight Flush': '同花顺',
  'Royal Flush': '皇家同花顺'
}

const winningReason = computed(() => {
  const res = props.result
  if (!res) return ''

  if (res.ended_by === 'fold') {
    return isZh.value ? '对手弃牌' : 'Opponent folded'
  }

  const sInfo = res.showdown_info
  if (!sInfo) return ''

  if (isZh.value) {
    if (sInfo.winning_hand_desc_zh) return sInfo.winning_hand_desc_zh
    const firstWinnerId = res.winners?.[0]?.player_id
    const winnerPlayer = sInfo.players?.find(p => p.player_id === firstWinnerId)
    if (winnerPlayer) {
      if (winnerPlayer.hand_description_zh) return winnerPlayer.hand_description_zh
      if (winnerPlayer.hand_name_zh) return winnerPlayer.hand_name_zh
      if (winnerPlayer.hand_name && zhHandNames[winnerPlayer.hand_name]) return zhHandNames[winnerPlayer.hand_name]
      if (winnerPlayer.hand_description) return winnerPlayer.hand_description
    }
    if (sInfo.winning_hand_desc) return sInfo.winning_hand_desc
  } else {
    if (sInfo.winning_hand_desc) return sInfo.winning_hand_desc
    const firstWinnerId = res.winners?.[0]?.player_id
    const winnerPlayer = sInfo.players?.find(p => p.player_id === firstWinnerId)
    if (winnerPlayer?.hand_description) return winnerPlayer.hand_description
    if (winnerPlayer?.hand_name) return winnerPlayer.hand_name
  }

  return ''
})

const amounts = computed(() =>
  (props.result.winners || []).map(w => `${w.display_name || w.player_id} +${w.amount}`).join(' · ')
)
</script>

<style scoped>
.hand-result-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: var(--accent-primary);
  text-align: center;
  font-size: 0.95rem;
  line-height: 1.35;
  background: rgba(14, 19, 24, 0.92);
  border: 1px solid rgba(217, 173, 88, 0.4);
  border-radius: var(--radius-md);
  padding: 0.45rem 1.15rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  white-space: nowrap;
}

.headline-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.winner-title {
  font-weight: 850;
  color: var(--accent-turn);
  letter-spacing: 0.02em;
}

.winning-reason {
  color: #fff;
  font-weight: 800;
  background: rgba(217, 173, 88, 0.2);
  border: 1px solid rgba(217, 173, 88, 0.35);
  padding: 0.08rem 0.5rem;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
}

.subline-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 0.82rem;
}

.amounts-tag {
  color: var(--text-secondary);
  font-weight: 700;
}
</style>
