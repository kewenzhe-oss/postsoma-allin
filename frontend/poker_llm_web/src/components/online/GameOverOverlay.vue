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
        <div class="review-header">
          <div>
            <h3>{{ isZh ? 'AI 对局复盘' : 'AI Match Review' }}</h3>
            <p class="review-sample">{{ isZh ? `样本：${result.player_statistics.hands} 手` : `Sample: ${result.player_statistics.hands} hands` }}</p>
          </div>
          <span v-if="structuredReview?.style_label" class="style-badge">{{ structuredReview.style_label }}</span>
        </div>

        <div class="review-stats">
          <div class="stat-tile">
            <span>{{ isZh ? '入池率' : 'VPIP' }}</span>
            <strong class="num">{{ rate(result.player_statistics.vpip_count, result.player_statistics.hands) }}</strong>
            <small class="num">{{ result.player_statistics.vpip_count }}/{{ result.player_statistics.hands }}</small>
          </div>
          <div class="stat-tile">
            <span>{{ isZh ? '翻前加注' : 'PFR' }}</span>
            <strong class="num">{{ rate(result.player_statistics.pfr_count, result.player_statistics.hands) }}</strong>
            <small class="num">{{ result.player_statistics.pfr_count }}/{{ result.player_statistics.hands }}</small>
          </div>
          <div class="stat-tile">
            <span>{{ isZh ? '受压弃牌' : 'Fold vs Raise' }}</span>
            <strong class="num">{{ rate(result.player_statistics.fold_to_pressure_count, result.player_statistics.pressure_opportunities) }}</strong>
            <small class="num">{{ result.player_statistics.fold_to_pressure_count }}/{{ result.player_statistics.pressure_opportunities }}</small>
          </div>
          <div class="stat-tile">
            <span>{{ isZh ? '摊牌胜率' : 'Showdown Win' }}</span>
            <strong class="num">{{ rate(result.player_statistics.showdown_wins, result.player_statistics.showdowns) }}</strong>
            <small class="num">{{ result.player_statistics.showdown_wins }}/{{ result.player_statistics.showdowns }}</small>
          </div>
          <div class="stat-tile">
            <span>{{ isZh ? '河牌施压' : 'River Pressure' }}</span>
            <strong class="num">{{ result.player_statistics.river_aggression_count ?? 0 }}</strong>
            <small>{{ isZh ? '次激进行动' : 'aggressive' }}</small>
          </div>
          <div class="stat-tile">
            <span>{{ isZh ? '全下次数' : 'All-ins' }}</span>
            <strong class="num">{{ result.player_statistics.all_in_count ?? 0 }}</strong>
            <small>{{ isZh ? '总加注' : 'raises' }}: {{ result.player_statistics.raise_count ?? 0 }}</small>
          </div>
        </div>

        <div v-if="structuredReview" class="review-sections">
          <div v-if="structuredReview.style_verdict" class="review-block review-block-accent">
            <div class="review-block-label">{{ isZh ? '01 · 整体风格判断' : '01 · Overall Style' }}</div>
            <p class="review-text">{{ structuredReview.style_verdict }}</p>
          </div>

          <div v-if="structuredReview.play_pattern" class="review-block">
            <div class="review-block-label">{{ isZh ? '02 · 牌路与打法特征' : '02 · Play Pattern' }}</div>
            <p class="review-text">{{ structuredReview.play_pattern }}</p>
          </div>

          <div v-if="structuredReview.data_summary" class="review-block">
            <div class="review-block-label">{{ isZh ? '03 · 数据解读' : '03 · Data Summary' }}</div>
            <p class="review-text">{{ structuredReview.data_summary }}</p>
          </div>

          <div v-if="structuredReview.improvements?.length" class="review-block">
            <div class="review-block-label">{{ isZh ? '04 · 改进建议' : '04 · How to Improve' }}</div>
            <ol class="improvement-list">
              <li v-for="(tip, tipIndex) in structuredReview.improvements" :key="tipIndex" class="improvement-item">
                <span class="improvement-num num">{{ String(tipIndex + 1).padStart(2, '0') }}</span>
                <span class="improvement-copy">{{ tip }}</span>
              </li>
            </ol>
          </div>
        </div>
        <div v-else-if="plainReviewText" class="review-block">
          <div class="review-block-label">{{ isZh ? 'AI 的观察' : 'AI Observations' }}</div>
          <p class="review-text">{{ plainReviewText }}</p>
        </div>
        <p v-else-if="result.review?.status === 'pending'" class="review-status-note">
          {{ isZh ? 'AI 正在结合全场牌局整理深度复盘…' : 'AI is analyzing your hands for a full match review…' }}
        </p>
        <p v-else class="review-status-note">
          {{ isZh ? 'AI 复盘暂时无法生成，你仍可查看上方本场统计。' : 'AI review is unavailable. Your match statistics are shown above.' }}
        </p>
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
        <div v-for="settlement in result.deciding_hand.settlements" :key="settlement.player_id" class="stack-row settlement-row">
          <span class="stack-name">{{ settlement.display_name }}</span>
          <span class="settlement-detail num">{{ formatSettlement(settlement) }}</span>
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
import { computed } from 'vue'
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

const activeReviewLocale = computed(() => {
  if (props.result?.review?.status !== 'ready') return null
  return isZh.value ? props.result.review.zh : props.result.review.en
})

const structuredReview = computed(() => {
  const val = activeReviewLocale.value
  return val && typeof val === 'object' ? val : null
})

const plainReviewText = computed(() => {
  const val = activeReviewLocale.value
  return typeof val === 'string' ? val : ''
})

const formatSettlement = (settlement) => {
  const net = `${settlement.net_change > 0 ? '+' : ''}${settlement.net_change}`
  if (isZh.value) {
    return `获得 ${settlement.received} · 退回 ${settlement.returned} · 净变化 ${net}`
  }
  return `Won ${settlement.received} · Returned ${settlement.returned} · Net ${net}`
}

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
.match-review {
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.match-review h3, .match-review p { margin: 0; }
.review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.review-header h3 {
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 800;
}
.review-sample {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  margin-top: 0.15rem;
}
.style-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-pill);
  background: rgba(217, 173, 88, 0.14);
  border: 1px solid rgba(217, 173, 88, 0.35);
  color: var(--accent-primary-strong);
  font-size: 0.75rem;
  font-weight: 800;
}
.review-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.55rem 0.65rem;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--border-subtle);
  min-width: 0;
}
.stat-tile span, .stat-tile small {
  color: var(--text-tertiary);
  font-size: 0.68rem;
  line-height: 1.3;
}
.stat-tile strong {
  color: var(--accent-turn);
  font-size: 1.05rem;
  font-weight: 800;
}
.review-sections {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.review-block {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
}
.review-block-accent {
  background: rgba(217, 173, 88, 0.06);
  border-color: rgba(217, 173, 88, 0.25);
}
.review-block-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--accent-primary-strong);
  text-transform: uppercase;
}
.review-text {
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.review-status-note {
  color: var(--text-tertiary);
  font-size: 0.82rem;
  line-height: 1.5;
}
.improvement-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.improvement-item {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}
.improvement-num {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--text-inverse);
  background: var(--accent-primary);
  border-radius: 6px;
  padding: 0.12rem 0.4rem;
  margin-top: 0.15rem;
}
.improvement-copy {
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}
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
  max-width: 520px;
  width: calc(100% - 1.5rem);
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
  gap: 0.65rem;
  flex-wrap: wrap;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
}

.settlement-detail {
  font-size: 0.78rem;
  color: var(--text-secondary);
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

@media (max-width: 480px) {
  .game-over-card {
    margin: 0.75rem;
    gap: 1.15rem;
  }
  .review-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
