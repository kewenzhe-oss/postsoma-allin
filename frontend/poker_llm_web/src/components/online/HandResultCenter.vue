<template>
  <!--
    HandResultCenter.vue
    Shown in the table center after hand_finished, until the next hand_started.
    Replaces CommunityCards in the center zone.
  -->
  <div class="hand-result-center">
    <div class="result-header">
      <span class="hand-badge">HAND #{{ result.hand_number }}</span>
      <span class="result-label" :class="{ 'showdown-text': result.ended_by === 'showdown' }">
        {{ endedByLabel }}
      </span>
    </div>

    <!-- ── Showdown Explain Layout ──────────────────── -->
    <div v-if="result.ended_by === 'showdown' && comparedPlayers.length > 0" class="showdown-explain">
      <div class="winning-reason-badge">
        {{ result.showdown_info?.winning_reason || getDefaultWinningReason() }}
      </div>

      <div class="showdown-grid">
        <div
          v-for="p in comparedPlayers"
          :key="p.player_id"
          class="player-comparison-card"
          :class="{ 'is-winner': p.isWinner }"
        >
          <div class="player-name-row">
            <span class="player-name">{{ p.display_name }}</span>
            <span v-if="p.isWinner" class="winner-indicator">Winner</span>
          </div>

          <div class="hole-cards-row">
            <CardView
              v-for="(card, cIdx) in p.hole_cards"
              :key="cIdx"
              :card-str="card"
              :visible="true"
            />
          </div>

          <div class="player-hand-desc">
            {{ p.hand_description }}
          </div>
        </div>
      </div>

      <!-- Winning 5-card Combination -->
      <div v-if="winningHandCards.length > 0" class="winning-combination-area">
        <div class="combination-label">WINNING 5-CARD HAND</div>
        <div class="mini-cards-row">
          <CardView
            v-for="(card, cIdx) in winningHandCards"
            :key="cIdx"
            :card-str="card"
            :visible="true"
            :highlighted="true"
            class="mini-card"
          />
        </div>
      </div>
    </div>

    <!-- ── Folded Result Layout ─────────────────────── -->
    <div v-else-if="result.ended_by === 'fold'" class="folded-explain">
      <div class="winners-area">
        <div
          v-for="(winner, idx) in result.winners"
          :key="idx"
          class="winner-row"
        >
          <span class="winner-name">{{ winner.display_name || winner.player_id }}</span>
          <span class="winner-amount">wins +{{ winner.amount }} chips</span>
        </div>
      </div>
      <div class="fold-details">
        {{ getFoldExplanation() }}
      </div>
    </div>

    <!-- ── Default Fallback Layout ──────────────────── -->
    <div v-else class="winners-area">
      <div
        v-for="(winner, idx) in result.winners"
        :key="idx"
        class="winner-row"
      >
        <span class="winner-name">{{ winner.display_name || winner.player_id }}</span>
        <span class="winner-amount">+{{ winner.amount }}</span>
      </div>
    </div>

    <!-- Pot summary -->
    <div class="pot-summary">
      <span class="pot-label">POT</span>
      <span class="pot-amount">{{ result.awarded_pot }}</span>
    </div>

    <!-- Countdown -->
    <div class="next-hand-notice">
      Next hand starting soon...
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOnlineStore } from '@/stores/online'
import CardView from '@/components/online/CardView.vue'

const props = defineProps({
  /**
   * latestHandResult from online.js store:
   * {
   *   hand_number,
   *   winners: [{ player_id, display_name, amount }],
   *   awarded_pot,
   *   ended_by: 'fold' | 'showdown' | 'unknown',
   *   stage: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown',
   *   showdown_info: { ... }
   * }
   */
  result: {
    type: Object,
    required: true
  }
})

const onlineStore = useOnlineStore()

const endedByLabel = computed(() => {
  if (props.result.ended_by === 'fold') return 'Won by fold'
  if (props.result.ended_by === 'showdown') return 'Showdown'
  return 'Hand complete'
})

const opponentId = computed(() => {
  const hId = onlineStore.playerId
  const op = onlineStore.publicState?.players?.find(p => p.player_id !== hId)
  return op ? op.player_id : null
})

const opponentDisplayName = computed(() => {
  const hId = onlineStore.playerId
  const op = onlineStore.publicState?.players?.find(p => p.player_id !== hId)
  return op ? op.display_name : 'AI'
})

const comparedPlayers = computed(() => {
  const info = props.result.showdown_info
  if (!info) return []

  // Client-side enriched structure
  if (info.hero && info.villain) {
    const heroHoles = onlineStore.privateState?.hole_cards || []
    const villainId = opponentId.value
    const newRevealedMap = onlineStore.revealedCards || {}
    const villainHoles = newRevealedMap[villainId] || []

    const isHeroWinner = props.result.winners?.some(w => w.player_id === onlineStore.playerId)
    const isVillainWinner = props.result.winners?.some(w => w.player_id === villainId)

    return [
      {
        player_id: onlineStore.playerId,
        display_name: 'Hero',
        hole_cards: heroHoles,
        hand_description: info.hero.handDescription || info.hero.handName,
        isWinner: isHeroWinner
      },
      {
        player_id: villainId,
        display_name: opponentDisplayName.value,
        hole_cards: villainHoles,
        hand_description: info.villain.handDescription || info.villain.handName,
        isWinner: isVillainWinner
      }
    ]
  }

  // Server-side fallback structure
  if (info.players) {
    return info.players.map(p => {
      const isWinner = props.result.winners?.some(w => w.player_id === p.player_id)
      const isHero = p.player_id === onlineStore.playerId
      return {
        player_id: p.player_id,
        display_name: isHero ? 'Hero' : (p.display_name || 'AI'),
        hole_cards: p.hole_cards,
        hand_description: p.hand_description || p.hand_name,
        best_five_cards: p.best_five_cards || [],
        isWinner
      }
    })
  }

  return []
})

const winningHandCards = computed(() => {
  const info = props.result.showdown_info
  if (!info) return []
  if (info.winning_cards && info.winning_cards.length > 0) return info.winning_cards
  
  const winnerId = props.result.winners?.[0]?.player_id
  if (!winnerId) return []

  if (info.hero && info.villain) {
    if (winnerId === onlineStore.playerId) {
      return info.hero.cards || []
    } else {
      return info.villain.cards || []
    }
  }
  return []
})

function getDefaultWinningReason() {
  const winnerNames = props.result.winners?.map(w => w.display_name || w.player_id) || []
  if (winnerNames.length === 0) return 'Split pot.'
  return `${winnerNames.join(' and ')} wins.`
}

function getFoldExplanation() {
  // Determine who folded by looking at players
  const players = onlineStore.publicState?.players || []
  const folder = players.find(p => p.folded)
  const folderName = folder ? (folder.player_id === onlineStore.playerId ? 'Hero' : folder.display_name) : 'Opponent'
  
  const stageName = props.result.stage ? labelize(props.result.stage) : 'the hand'
  return `${folderName} folded on the ${stageName.toLowerCase()}.`
}

function labelize(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}
</script>

<style scoped>
.hand-result-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  padding: 1.25rem 1.75rem;
  background-color: rgba(8, 11, 15, 0.72);
  border: 1px solid rgba(241, 199, 106, 0.22);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(8px);
  min-width: 320px;
  max-width: 460px;
  text-align: center;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

/* ── Header ───────────────────────────────────────── */
.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hand-badge {
  font-size: 10px;
  color: var(--text-tertiary);
  letter-spacing: 2px;
  font-weight: 700;
}

.result-label {
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  color: var(--text-primary);
  text-transform: uppercase;
}

.result-label.showdown-text {
  color: var(--accent-turn);
}

/* ── Showdown Explain ────────────────────────────── */
.showdown-explain {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.winning-reason-badge {
  font-size: 0.84rem;
  color: var(--success);
  font-weight: 800;
  background-color: rgba(121, 216, 144, 0.08);
  border: 1px solid rgba(121, 216, 144, 0.18);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  display: inline-block;
  align-self: center;
}

.showdown-grid {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.player-comparison-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem;
  background-color: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
}

.player-comparison-card.is-winner {
  background-color: rgba(121, 216, 144, 0.04);
  border-color: rgba(121, 216, 144, 0.2);
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.player-name {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.winner-indicator {
  font-size: 8px;
  color: var(--success);
  font-weight: 900;
  text-transform: uppercase;
  background-color: rgba(121, 216, 144, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.hole-cards-row {
  display: flex;
  gap: 4px;
  justify-content: center;
}

:deep(.hole-cards-row .card-view) {
  width: 44px !important;
}

.player-hand-desc {
  font-size: 0.74rem;
  color: var(--text-tertiary);
  font-weight: 600;
  min-height: 14px;
}

/* ── Winning 5-card Hand ────────────────────────── */
.winning-combination-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0.65rem;
  background-color: rgba(241, 199, 106, 0.03);
  border: 1px dashed rgba(241, 199, 106, 0.18);
  border-radius: var(--radius-sm);
}

.combination-label {
  font-size: 8px;
  color: var(--accent-turn);
  font-weight: 900;
  letter-spacing: 1.5px;
}

.mini-cards-row {
  display: flex;
  gap: 3px;
  justify-content: center;
}

:deep(.mini-card) {
  width: 32px !important;
  border-radius: 4px !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25) !important;
}

:deep(.mini-card .corner-rank) {
  font-size: 8px !important;
}

:deep(.mini-card .corner-suit) {
  font-size: 6px !important;
}

:deep(.mini-card .card-center-suit) {
  font-size: 16px !important;
}

/* ── Folded Explain ──────────────────────────────── */
.folded-explain {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.winners-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.winner-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: rgba(121, 216, 144, 0.08);
  border: 1px solid rgba(121, 216, 144, 0.18);
  border-radius: var(--radius-sm);
}

.winner-name {
  color: var(--text-primary);
  font-weight: 800;
  font-size: 0.94rem;
}

.winner-amount {
  color: var(--success);
  font-weight: 850;
  font-size: 0.94rem;
}

.fold-details {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  font-weight: 600;
  margin-top: 4px;
}

/* ── Pot summary ──────────────────────────────────── */
.pot-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  background-color: rgba(0, 0, 0, 0.35);
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
}

.pot-label {
  font-size: 9px;
  color: var(--text-tertiary);
  letter-spacing: 1.5px;
  font-weight: 700;
}

.pot-amount {
  font-size: 1.05rem;
  font-weight: 850;
  color: var(--accent-turn);
}

/* ── Next hand notice ─────────────────────────────── */
.next-hand-notice {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 0.9; }
  100% { opacity: 0.5; }
}
</style>
