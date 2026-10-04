<template>
  <div class="table-stage-container">
    <div class="table-surface" :class="{ 'hero-turn': isMyTurn }">

      <!-- ── Opponent Seat (Top) ───────────────────────── -->
      <div class="seat-zone seat-top" :class="{ 'is-active': isOpponentTurn }">
        <PlayerSeat
          v-if="onlineStore.opponentPlayer"
          :player="onlineStore.opponentPlayer"
          :resultLabel="seatResult(onlineStore.opponentPlayer.player_id)"
          :isCurrentTurn="isOpponentTurn"
          :isDealer="isOpponentDealer"
          :holeCards="opponentRevealedCards"
          :isOpponent="true"
          :highlightCards="winningCardsList"
        />
        <div v-else class="waiting-seat">{{ isZh ? '等待对手入座' : 'Waiting for opponent' }}</div>

        <!-- AI Perceptual Pulse -->
        <div class="thinking-slot" :class="{ 'is-hidden': perceptualState !== 'ai_thinking' }"
          :aria-hidden="perceptualState !== 'ai_thinking'">
          <AIStatusPulse />
        </div>
      </div>

      <!-- ── Center Area: Board & Pot ──────────────────── -->
      <div class="center-zone">
        <div class="center-status" :class="{ 'is-hidden': !centerStatus }" :aria-hidden="!centerStatus">
          {{ centerStatus }}
        </div>
        <CommunityCards
          :cards="onlineStore.latestHandResult?.community_cards || onlineStore.publicState?.community_cards || []"
          :pot="liveDisplayPot"
          :stage="onlineStore.publicState?.stage"
          :highlightCards="winningCardsList"

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
          :resultLabel="seatResult(onlineStore.heroPlayer.player_id)"
          :isCurrentTurn="isMyTurn"
          :isDealer="isHeroDealer"
          :holeCards="onlineStore.latestHandResult?.showdown_info?.players?.find(p=>p.player_id === onlineStore.playerId)?.hole_cards || onlineStore.privateState?.hole_cards || []"
          :isOpponent="false"
          :highlightCards="winningCardsList"
        />
        <div v-else class="waiting-seat">{{ isZh ? '正在入座' : 'Taking your seat' }}</div>

        <!-- Turn Indicator Glow (Hero) -->
        <div class="turn-glow" v-if="isMyTurn"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { isZh } from '@/i18n/locale.js'
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
function seatResult(id) {
 const result=onlineStore.latestHandResult
 if(!result?.winners?.some(w=>w.player_id===id)) return ''
 return result.winners.length>1 ? (isZh.value?'分池':'Split') : (isZh.value?'获胜':'Winner')
}

const liveDisplayPot = computed(() => onlineStore.latestHandResult?.awarded_pot ?? onlineStore.publicState?.pot ?? 0)

const opponentRevealedCards = computed(() => {
  const frozen = onlineStore.latestHandResult?.showdown_info?.players?.find(p=>p.player_id === onlineStore.opponentPlayer?.player_id)
  if (frozen) return frozen.hole_cards
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
  if (onlineStore.publicState.dealer_player_id) {
    return onlineStore.publicState.dealer_player_id === onlineStore.heroPlayer.player_id
  }
  const dealerIdx = onlineStore.publicState.dealer_position
  return onlineStore.publicState.players?.findIndex(
    p => p.player_id === onlineStore.heroPlayer.player_id
  ) === dealerIdx
})

const isOpponentDealer = computed(() => {
  if (!onlineStore.publicState || !onlineStore.opponentPlayer) return false
  if (onlineStore.publicState.dealer_player_id) {
    return onlineStore.publicState.dealer_player_id === onlineStore.opponentPlayer.player_id
  }
  const dealerIdx = onlineStore.publicState.dealer_position
  return onlineStore.publicState.players?.findIndex(
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
  if (props.perceptualState === 'player_turn') return isZh.value ? '轮到你行动' : 'Your turn'
  if (props.perceptualState === 'ai_thinking') return null
  if (props.perceptualState === 'ai_action_revealed') return isZh.value ? '对手已行动' : 'Move played'
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

.is-hidden { visibility: hidden; }
.thinking-slot { height: 2rem; display:flex; align-items:center; justify-content:center; }

.seat-top {
  flex-direction:column;
  gap:.5rem;
  align-self: flex-start;
  margin-top: -28px;
}

.seat-bottom {
  align-self: flex-end;
  margin-bottom: -32px;
}

.center-zone {
  position:relative;
  padding-bottom:3rem;
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

.result-floating-overlay { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:auto; max-width:calc(100% - 1rem); min-height:2.5rem; z-index:30; }


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

/* ── Desktop / tablet landscape ───────────────────────────
   Same interaction model as mobile (≤720px): action bar sits *below* the
   table in normal flow, the hand result appears in the reserved slot under
   the board, nothing floats over the seats. Only the geometry differs:
   the felt keeps its oval aspect and scales to the available height
   (size container), and seats put cards beside the info card so a
   720p laptop still fits everything without scrolling. */
@media (min-width:721px) {
 .table-stage-container {
  container-type:size;
  padding:1.6rem 2.5rem 1.6rem;
 }
 .table-surface {
  /* felt height = width / 1.75, capped by available height */
  --felt-h:min(100cqw / 1.75, 100cqh, 680px);
  --c:clamp(38px, calc((var(--felt-h) - 210px) / 3.6), 80px);
  width:min(100%, 100cqh * 1.75, 1190px);
  max-width:none;
  min-height:0;
  max-height:none;
  aspect-ratio:1.75 / 1;
  padding:1.1rem clamp(1.5rem, 6cqw, 4.5rem);
 }
 .seat-top { margin-top:calc(var(--c) * -0.3); gap:0; }
 .seat-bottom { margin-bottom:calc(var(--c) * -0.3); }
 /* AI pulse shows only while center-status is empty, so it takes that spot */
 .thinking-slot { position:absolute; top:calc(100% + .35rem); left:50%; transform:translateX(-50%); height:auto; z-index:20; }
 /* Mobile structure: status → stage/pot → board → result slot (3rem) */
 .center-zone { gap:.5rem; padding:.35rem 0 3rem; }
 .center-zone :deep(.community-area) { flex-direction:row; flex-wrap:wrap; justify-content:center; align-items:center; gap:.65rem .6rem; }
 .center-zone :deep(.cards-row) { flex-basis:100%; justify-content:center; gap:calc(var(--c) * .14); }
 .center-zone :deep(.pot-container) { flex-direction:row; gap:.55rem; padding:.3rem 1rem; }
 .center-zone :deep(.card-view), .center-zone :deep(.card-placeholder) { width:var(--c); }
 .seat-zone :deep(.cards-area .card-view) { width:calc(var(--c) * .92); }
 .result-floating-overlay { max-width:calc(100% - 1rem); }
}

@media (max-width:720px) {
 .table-stage-container { height:100%; padding:.35rem .5rem; align-items:stretch; }
 .table-surface { min-height:0; max-height:none; height:100%; aspect-ratio:auto; border-radius:34px; border-width:6px; padding:.5rem; gap:.25rem; }
 .seat-top,.seat-bottom { margin:0; }
 .seat-top { gap:.2rem; }
 .center-zone { gap:.3rem; padding:.25rem 0 3rem; }
 .center-status { font-size:.75rem; padding:.2rem .6rem; }
 .center-zone :deep(.card-view), .center-zone :deep(.card-placeholder) { width:40px; }
 .center-zone :deep(.cards-row) { gap:4px; }
 .result-floating-overlay { max-width:calc(100% - 1rem); }
 .seat-top :deep(.ai-status-pulse) { padding:.2rem .6rem; }
 .seat-top :deep(.status-content) { font-size:.75rem; }
 .seat-top :deep(.pulse-ring) { display:none; }
}
</style>
