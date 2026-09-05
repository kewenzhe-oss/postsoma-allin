<template>
  <div class="table-stage-container">
    <div class="table-surface" :class="{ 'hero-turn': isMyTurn }">
      
      <!-- ── Opponent Seat (Top) ───────────────────────── -->
      <div class="seat-zone seat-top" :class="{ 'is-active': isOpponentTurn }">
        <PlayerSeat
          v-if="onlineStore.opponentPlayer"
          :player="onlineStore.opponentPlayer"
          :isCurrentTurn="isOpponentTurn"
          :isDealer="isOpponentDealer"
          :holeCards="opponentRevealedCards"
          :isOpponent="true"
          :highlightCards="winningCardsList"
        />
        <div v-else class="waiting-seat">Waiting for opponent</div>

        <!-- AI Perceptual Pulse -->
        <transition name="fade">
          <AIStatusPulse v-if="perceptualState === 'ai_thinking'" />
        </transition>
      </div>

      <!-- ── Center Area: Board & Pot ──────────────────── -->
      <div class="center-zone" :class="{ 'dimmed': isDimmed }">
        <div class="center-status" v-if="centerStatus">
          {{ centerStatus }}
        </div>
        <CommunityCards
          :cards="onlineStore.publicState?.community_cards || []"
          :pot="liveDisplayPot"
          :stage="onlineStore.publicState?.stage"
          :highlightCards="winningCardsList"
          :class="{ 'board-dimmed': !!onlineStore.latestHandResult }"
        />
        <transition name="fade">
          <HandResultCenter
            v-if="onlineStore.latestHandResult"
            :result="onlineStore.latestHandResult"
            class="result-floating-overlay"
          />
        </transition>
      </div>

      <!-- ── Hero Seat (Bottom) ────────────────────────── -->
      <div class="seat-zone seat-bottom" :class="{ 'is-active': isMyTurn }">
        <PlayerSeat
          v-if="onlineStore.heroPlayer"
          :player="onlineStore.heroPlayer"
          :isCurrentTurn="isMyTurn"
          :isDealer="isHeroDealer"
          :holeCards="onlineStore.privateState?.hole_cards || []"
          :isOpponent="false"
          :highlightCards="winningCardsList"
        />
        <div v-else class="waiting-seat">Taking your seat</div>

        <!-- Turn Indicator Glow (Hero) -->
        <div class="turn-glow" v-if="isMyTurn"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOnlineStore } from '@/stores/online'
import PlayerSeat from '@/components/online/PlayerSeat.vue'
import CommunityCards from '@/components/online/CommunityCards.vue'
import HandResultCenter from '@/components/online/HandResultCenter.vue'
import AIStatusPulse from './AIStatusPulse.vue'

const props = defineProps({
  perceptualState: {
    type: String,
    required: true
  }
})

const onlineStore = useOnlineStore()

const liveDisplayPot = computed(() => onlineStore.publicState?.pot ?? 0)

const opponentRevealedCards = computed(() => {
  const opponentId = onlineStore.opponentPlayer?.player_id
  if (!opponentId) return []
  return onlineStore.revealedCards[opponentId] || []
})

const winningCardsList = computed(() => {
  const result = onlineStore.latestHandResult
  if (!result || !result.showdown_info) return []
  return result.showdown_info.winning_cards || []
})

const isHeroDealer = computed(() => {
  if (!onlineStore.publicState || !onlineStore.heroPlayer) return false
  const dealerIdx = onlineStore.publicState.dealer_position
  return onlineStore.publicState.players.findIndex(
    p => p.player_id === onlineStore.heroPlayer.player_id
  ) === dealerIdx
})

const isOpponentDealer = computed(() => {
  if (!onlineStore.publicState || !onlineStore.opponentPlayer) return false
  const dealerIdx = onlineStore.publicState.dealer_position
  return onlineStore.publicState.players.findIndex(
    p => p.player_id === onlineStore.opponentPlayer.player_id
  ) === dealerIdx
})

const isMyTurn = computed(() => props.perceptualState === 'player_turn')
const isOpponentTurn = computed(() => 
  props.perceptualState === 'ai_thinking' || 
  props.perceptualState === 'waiting_for_ai' || 
  props.perceptualState === 'ai_action_revealed'
)

const isDimmed = computed(() => props.perceptualState === 'ai_thinking')

const centerStatus = computed(() => {
  if (onlineStore.latestHandResult) return null
  if (props.perceptualState === 'player_turn') return 'Your turn'
  if (props.perceptualState === 'ai_thinking') return 'AI is choosing a move'
  if (props.perceptualState === 'ai_action_revealed') return 'Move played'
  if (!onlineStore.opponentPlayer) return 'Invite a friend to sit down'
  if (onlineStore.publicState?.game_status === 'waiting') return 'Waiting for opponent'
  return null
})
</script>

<style scoped>
.table-stage-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(1rem, 3vw, 2rem) clamp(0.75rem, 3vw, 2rem) 9rem;
  min-height: 0;
  width: 100%;
}

.table-surface {
  width: 100%;
  max-width: 880px;
  min-height: min(56vh, 520px);
  max-height: 560px;
  aspect-ratio: 1.75 / 1;
  background:
    radial-gradient(ellipse at 50% 44%, rgba(217, 173, 88, 0.1) 0%, transparent 38%),
    radial-gradient(ellipse at 50% 44%, var(--bg-table-rich) 0%, var(--bg-table) 48%, var(--bg-table-deep) 100%);
  border-radius: 48%;
  border: clamp(9px, 1.8vw, 15px) solid #1b1110;
  box-shadow:
    inset 0 0 90px rgba(0, 0, 0, 0.62),
    inset 0 0 0 1px var(--felt-line),
    inset 0 0 0 9px rgba(217, 173, 88, 0.055),
    var(--shadow-lg);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: clamp(1.35rem, 4vw, 2.5rem) clamp(1.35rem, 5vw, 3.2rem);
  transition: box-shadow 0.5s ease;
}

.table-surface.hero-turn {
  box-shadow:
    inset 0 0 90px rgba(0, 0, 0, 0.62),
    inset 0 0 0 1px rgba(241, 199, 106, 0.2),
    0 22px 70px rgba(0, 0, 0, 0.48),
    0 0 42px rgba(241, 199, 106, 0.16);
  border-color: #2d1b14;
}

.seat-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 10;
  transition: opacity 0.3s, filter 0.3s;
}

.seat-zone:not(.is-active) {
  opacity: 0.9;
  filter: saturate(0.88);
}

.seat-top {
  align-self: flex-start;
  margin-top: -28px;
}

.seat-bottom {
  align-self: flex-end;
  margin-bottom: -32px;
}

.center-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  transition: opacity 0.4s ease;
}

.center-zone.dimmed {
  opacity: 0.5;
  filter: saturate(0.82);
}

.board-dimmed {
  opacity: 0.35;
  filter: blur(1px);
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.result-floating-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 30;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 24px rgba(241, 199, 106, 0.2);
}

.waiting-seat {
  background-color: rgba(18, 27, 33, 0.78);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  border: 1px dashed var(--border-strong);
  font-size: 14px;
}

.turn-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(241, 199, 106, 0.2) 0%, transparent 70%);
  pointer-events: none;
  z-index: -1;
  animation: pulse-glow 2s infinite alternate;
}

.center-status {
  color: var(--text-primary);
  background: rgba(8, 11, 15, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.32rem 0.8rem;
  font-size: var(--font-size-label);
  font-weight: 850;
  letter-spacing: 0.02em;
  box-shadow: var(--shadow-sm);
}

@keyframes pulse-glow {
  from { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .table-stage-container {
    align-items: flex-start;
    padding-top: 1rem;
    padding-bottom: 11.25rem;
  }

  .table-surface {
    min-height: 480px;
    aspect-ratio: auto;
    border-radius: 34px;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .seat-top {
    margin-top: -18px;
  }

  .seat-bottom {
    margin-bottom: -22px;
  }
}
</style>
