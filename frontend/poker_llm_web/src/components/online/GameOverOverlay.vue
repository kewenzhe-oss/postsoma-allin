<template>
  <!--
    GameOverOverlay.vue
    Shown when game_status === "game_over" or latestGameResult is set.
    Covers the table surface (not the header or debug panel).
  -->
  <div class="game-over-overlay">
    <div class="game-over-card">
      <!-- Title -->
      <div class="go-header">
        <h2 class="go-title">{{ isZh ? '本场对局结束' : 'Game over' }}</h2>
      </div>

      <!-- Match winner -->
      <div class="match-winner" v-if="result.winner">
        <span class="winner-label">{{ isZh ? '对局获胜者' : 'Match winner' }}</span>
        <div class="winner-row">
          <span class="winner-name">{{ result.winner.display_name || result.winner.player_id }}</span>
          <span class="winner-chips">{{ result.winner.chips }} {{ isZh ? '筹码' : 'chips' }}</span>
        </div>
      </div>

      <section v-if="result.player_statistics" class="match-review" aria-live="polite">
        <h3>{{ isZh ? '你的对局复盘' : 'Your match review' }}</h3>
        <p class="review-sample">{{ isZh ? `样本：${result.player_statistics.hands} 手` : `Sample: ${result.player_statistics.hands} hands` }}</p>
        <div class="review-stats">
          <div><span>{{ isZh ? '入池率' : 'VPIP' }}</span><strong>{{ rate(result.player_statistics.vpip_count, result.player_statistics.hands) }}</strong><small>{{ result.player_statistics.vpip_count }}/{{ result.player_statistics.hands }}</small></div>
          <div><span>{{ isZh ? '翻前加注率' : 'Preflop raise' }}</span><strong>{{ rate(result.player_statistics.pfr_count, result.player_statistics.hands) }}</strong><small>{{ result.player_statistics.pfr_count }}/{{ result.player_statistics.hands }}</small></div>
          <div><span>{{ isZh ? '面对加注弃牌' : 'Fold facing raise' }}</span><strong>{{ rate(result.player_statistics.fold_to_pressure_count, result.player_statistics.pressure_opportunities) }}</strong><small>{{ result.player_statistics.fold_to_pressure_count }}/{{ result.player_statistics.pressure_opportunities }}</small></div>
        </div>
        <h4>{{ isZh ? 'AI 的观察' : 'AI observations' }}</h4>
        <p v-if="result.review?.status === 'ready'" class="review-text">{{ isZh ? result.review.zh : result.review.en }}</p>
        <p v-else-if="result.review?.status === 'pending'" class="review-text">{{ isZh ? 'AI 正在整理本场表现…' : 'AI is reviewing your match…' }}</p>
        <p v-else class="review-text">{{ isZh ? 'AI 复盘暂时无法生成，你仍可查看本场统计。' : 'AI review is unavailable. Your match statistics are shown above.' }}</p>
      </section>

      <!-- Deciding Hand Recap -->
      <div class="deciding-hand-recap" v-if="result.deciding_hand">
        <div class="recap-header">
          <span class="recap-badge">{{ isZh ? '决定胜负的一手' : 'DECIDING HAND' }} #{{ result.deciding_hand.hand_number }}</span>
          <span class="recap-ended-by">{{ result.deciding_hand.ended_by === 'showdown' ? (isZh ? '摊牌' : 'Showdown') : (isZh ? '弃牌结束' : 'Fold') }}</span>
        </div>

        <div class="recap-winning-reason" v-if="result.deciding_hand.winning_reason || result.deciding_hand.ended_by === 'fold'">
          {{ result.deciding_hand.ended_by === 'fold' ? (isZh ? '对手弃牌，未摊牌' : 'Opponent folded; no showdown') : (isZh ? (result.deciding_hand.winning_reason_zh || result.deciding_hand.showdown_info?.winning_reason_zh || result.deciding_hand.winning_reason) : result.deciding_hand.winning_reason) }}
        </div>

        <!-- Community Cards -->
        <div class="recap-board" v-if="result.deciding_hand.community_cards && result.deciding_hand.community_cards.length > 0">
          <div class="recap-label">{{ isZh ? '公共牌' : 'BOARD' }}</div>
          <div class="recap-cards-row">
            <CardView
              v-for="(card, cIdx) in result.deciding_hand.community_cards"
              :key="cIdx"
              :cardStr="card"
              :visible="true"
              :highlighted="isDecidingWinningCard(card)"
              class="recap-card"
            />
          </div>
        </div>

        <!-- Showdown Players Comparison -->
        <div class="recap-players-grid" v-if="result.deciding_hand.showdown_info?.players">
          <div
            v-for="p in result.deciding_hand.showdown_info.players"
            :key="p.player_id"
            class="recap-player-card"
            :class="{ 'is-winner': isDecidingPlayerWinner(p.player_id) }"
          >
            <div class="recap-player-name">
              <span>{{ p.display_name }}</span>
              <span v-if="isDecidingPlayerWinner(p.player_id)" class="recap-winner-tag">{{ result.deciding_hand?.winners?.length > 1 ? (isZh ? '分池' : 'Split') : (isZh ? '获胜' : 'Winner') }}</span>
            </div>
            <div class="recap-hole-cards">
              <CardView
                v-for="(card, cIdx) in p.hole_cards"
                :key="cIdx"
                :cardStr="card"
                :visible="true"
                :highlighted="isDecidingWinningCard(card)"
                class="recap-mini-card"
              />
            </div>
            <div class="recap-player-desc">{{ isZh ? (p.hand_description_zh || p.hand_name_zh || p.hand_description) : (p.hand_description || p.hand_name) }}</div>
          </div>
        </div>
      </div>

      <div v-if="result.deciding_hand?.settlements?.length" class="final-stacks">
        <div v-for="p in result.deciding_hand.settlements" :key="p.player_id" class="stack-row">
          <span>{{ p.display_name }}</span><span>获得 {{ p.received }} · 退回 {{ p.returned }} · 净变化 {{ p.net_change > 0 ? '+' : '' }}{{ p.net_change }}</span>
        </div>
      </div>
      <!-- Final stacks -->
      <div class="final-stacks" v-if="result.final_stacks && result.final_stacks.length">
        <div class="stacks-label">{{ isZh ? '最终筹码' : 'Final stacks' }}</div>
        <div
          v-for="(player, idx) in result.final_stacks"
          :key="idx"
          class="stack-row"
          :class="{ 'is-winner': result.winner && player.player_id === result.winner.player_id, 'is-bust': player.chips <= 0 }"
        >
          <span class="stack-name">{{ player.display_name || player.player_id }}</span>
          <span class="stack-chips">{{ player.chips }}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="go-actions">
        <button class="btn-rematch" @click="emit('rematch')">
          {{ isZh ? '再来一场' : 'Rematch' }}
        </button>
        <button class="btn-lobby" @click="emit('back-to-lobby')">
          {{ isZh ? '返回大厅' : 'Back to Lobby' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { isZh } from '@/i18n/locale.js'
import CardView from './CardView.vue'
import { normalizeCard } from '@/utils/cardFormat'

const props = defineProps({
  /**
   * latestGameResult from online.js store:
   * {
   *   winner: { player_id, display_name, chips } | null,
   *   final_stacks: [{ player_id, display_name, chips }],
   *   deciding_hand: { ... } | null
   * }
   */
  result: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['rematch', 'back-to-lobby'])

const rate = (count, total) => total > 0 ? `${Math.round(count / total * 100)}%` : '—'

const isDecidingWinningCard = (cardStr) => {
  const winningCards = props.result.deciding_hand?.winning_cards
  if (!winningCards || winningCards.length === 0 || !cardStr) return false
  const norm = normalizeCard(cardStr)
  if (!norm.valid) return false
  return winningCards.some(wc => {
    const wNorm = normalizeCard(wc)
    return wNorm.valid && wNorm.code === norm.code
  })
}

const isDecidingPlayerWinner = (playerId) => {
  const winners = props.result.deciding_hand?.winners || []
  return winners.some(w => w.player_id === playerId)
}
</script>

<style scoped>
.match-review { text-align:left; display:flex; flex-direction:column; gap:.65rem; padding:1rem; border:1px solid var(--border-subtle); border-radius:var(--radius-md); }
.match-review h3, .match-review h4, .match-review p { margin:0; }
.match-review h3 { color:var(--text-primary); font-size:1rem; }
.match-review h4 { color:var(--text-primary); font-size:.9rem; }
.review-sample, .review-text { color:var(--text-secondary); font-size:.85rem; line-height:1.5; white-space:pre-wrap; }
.review-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.5rem; }
.review-stats div { display:flex; flex-direction:column; gap:.2rem; }
.review-stats span, .review-stats small { color:var(--text-secondary); font-size:.7rem; }
.review-stats strong { color:var(--accent-turn); font-size:1.05rem; }
/* ── Overlay: covers table area, not header ──────── */
.game-over-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(5, 8, 12, 0.82);
  backdrop-filter: blur(4px);
  z-index: 200;
  /* Prevent overlay bleeding into header via pointer-events */
  pointer-events: all;
}

/* ── Card ─────────────────────────────────────────── */
.game-over-card {
  background-color: var(--bg-panel-solid);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding:clamp(1rem,3vw,2rem);
  min-width:0;
  max-height:calc(100dvh - 2rem);
  overflow-y:auto;
  margin:1rem;
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: var(--shadow-lg);
  text-align: center;
}

/* ── Header ──────────────────────────────────────── */
.go-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.go-title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
  color: var(--text-primary);
  text-transform: none;
}

/* ── Match winner ────────────────────────────────── */
.match-winner {
  background-color: rgba(121, 216, 144, 0.09);
  border: 1px solid rgba(121, 216, 144, 0.24);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
}

.winner-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--success);
  margin-bottom: 0.6rem;
}

.winner-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.winner-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

.winner-chips {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-turn);
  background-color: rgba(241, 199, 106, 0.12);
  padding: 2px 10px;
  border-radius: 12px;
}

/* ── Final stacks ────────────────────────────────── */
.final-stacks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stacks-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.stack-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
}

.stack-row.is-winner {
  background-color: rgba(121, 216, 144, 0.08);
  border-color: rgba(121, 216, 144, 0.22);
}

.stack-row.is-bust {
  opacity: 0.5;
}

.stack-name {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.stack-chips {
  font-size: 15px;
  font-weight: 800;
  color: var(--accent-turn);
}

.stack-row.is-bust .stack-chips {
  color: var(--text-tertiary);
}

/* ── Action buttons ──────────────────────────────── */
.go-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-rematch,
.btn-lobby {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0;
  border: none;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.btn-rematch:hover,
.btn-lobby:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}
.btn-rematch:active,
.btn-lobby:active {
  transform: translateY(0);
}

.btn-rematch {
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  color: var(--text-inverse);
}

.btn-lobby {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
}

/* ── Deciding hand recap ─────────────────────────── */
.deciding-hand-recap {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(241, 199, 106, 0.2);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
}

.recap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recap-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--accent-turn);
}

.recap-ended-by {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.recap-winning-reason {
  font-size: 13px;
  font-weight: 700;
  color: #79d890;
  background-color: rgba(121, 216, 144, 0.08);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(121, 216, 144, 0.18);
}

.recap-board {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recap-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}

.recap-cards-row {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin: 4px 0;
}

.recap-card {
  width: 44px !important;
}

.recap-players-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 4px;
}

.recap-player-card {
  background-color: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recap-player-card.is-winner {
  border-color: rgba(121, 216, 144, 0.35);
  background-color: rgba(121, 216, 144, 0.06);
}

.recap-player-name {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
}

.recap-winner-tag {
  font-size: 9px;
  font-weight: 800;
  color: #79d890;
  background-color: rgba(121, 216, 144, 0.15);
  padding: 1px 6px;
  border-radius: 4px;
}

.recap-hole-cards {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.recap-mini-card {
  width: 38px !important;
}

.recap-player-desc {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.25;
}
.go-actions button { min-height:44px; }
.go-actions { position:sticky; bottom:-1rem; background:var(--bg-panel-solid); padding:.5rem 0; }
</style>
