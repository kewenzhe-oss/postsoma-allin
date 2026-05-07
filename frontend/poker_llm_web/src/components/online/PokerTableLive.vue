<template>
  <div class="poker-table-live">
    <div class="table-surface">

      <!-- ── Opponent Seat (Top) ───────────────────────── -->
      <div class="seat-zone seat-top">
        <PlayerSeat
          v-if="onlineStore.opponentPlayer"
          :player="onlineStore.opponentPlayer"
          :isCurrentTurn="onlineStore.publicState?.current_turn_player_id === onlineStore.opponentPlayer?.player_id"
          :isDealer="isOpponentDealer"
          :holeCards="opponentRevealedCards"
          :isOpponent="true"
        />
        <div v-else class="waiting-seat">Waiting for opponent...</div>
      </div>

      <!-- ── Center Area: Community Cards OR Hand Result ── -->
      <div class="center-zone">
        <!-- Hand Result View (shown after hand_finished, before hand_started) -->
        <HandResultCenter
          v-if="onlineStore.latestHandResult"
          :result="onlineStore.latestHandResult"
        />
        <!-- Normal gameplay view -->
        <CommunityCards
          v-else
          :cards="onlineStore.publicState?.community_cards || []"
          :pot="liveDisplayPot"
          :stage="onlineStore.publicState?.stage"
        />
      </div>

      <!-- ── Hero Seat (Bottom) ────────────────────────── -->
      <div class="seat-zone seat-bottom">
        <PlayerSeat
          v-if="onlineStore.heroPlayer"
          :player="onlineStore.heroPlayer"
          :isCurrentTurn="onlineStore.isMyTurn"
          :isDealer="isHeroDealer"
          :holeCards="onlineStore.privateState?.hole_cards || []"
          :isOpponent="false"
        />
        <div v-else class="waiting-seat">Connecting...</div>
      </div>

    </div>

    <!-- ── Action Bar (outside table, shown only during play) ── -->
    <div class="action-bar-zone">
      <ActionBar
        :actions="onlineStore.availableActions"
        :isAiTurn="onlineStore.publicState?.current_turn_player_id === 'ai_seat'"
        @submit-action="handleAction"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOnlineStore } from '@/stores/online'
import PlayerSeat from './PlayerSeat.vue'
import CommunityCards from './CommunityCards.vue'
import ActionBar from './ActionBar.vue'
import HandResultCenter from './HandResultCenter.vue'

const onlineStore = useOnlineStore()

// During live play: show current pot.
const liveDisplayPot = computed(() => onlineStore.publicState?.pot ?? 0)

// Opponent's revealed cards (only non-empty at showdown)
const opponentRevealedCards = computed(() => {
  const opponentId = onlineStore.opponentPlayer?.player_id
  if (!opponentId) return []
  return onlineStore.revealedCards[opponentId] || []
})

// Dealer position lookup by player_id
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

const handleAction = (action, amount) => {
  onlineStore.submitAction(action, amount)
}
</script>

<style scoped>
.poker-table-live {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem 2rem;
  position: relative;
  min-height: 0;
}

/* ── Oval green table surface ─────────────────────── */
.table-surface {
  width: 100%;
  max-width: 820px;
  min-height: 460px;
  max-height: 540px;
  background: radial-gradient(ellipse at 50% 40%, var(--bg-table-rich) 0%, var(--bg-table) 58%, var(--bg-table-deep) 100%);
  border-radius: 50%;
  border: 14px solid #1b1110;
  box-shadow:
    inset 0 0 60px rgba(0, 0, 0, 0.5),
    0 20px 50px rgba(0, 0, 0, 0.5);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 2.5rem 3rem;
}

/* ── Seat zones ──────────────────────────────────── */
.seat-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
  z-index: 10;
}

.seat-top {
  align-self: flex-start;
  margin-top: -24px;
}

.seat-bottom {
  align-self: flex-end;
  margin-bottom: -24px;
}

/* ── Center zone ─────────────────────────────────── */
.center-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* ── Waiting placeholder ─────────────────────────── */
.waiting-seat {
  background-color: rgba(17, 24, 32, 0.7);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  color: #6B7280;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  font-size: 14px;
}

/* ── Action bar zone ─────────────────────────────── */
.action-bar-zone {
  width: 100%;
  max-width: 820px;
  margin-top: 1.5rem;
}
</style>
