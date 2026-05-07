<template>
  <div class="hand-log">
    <div class="log-header">
      <h4>Hand History</h4>
    </div>
    <div class="log-content" ref="logContainer">
      <div v-for="(log, idx) in formattedLogs" :key="idx" class="log-line" :class="log.level">
        <span class="log-text" v-html="log.text"></span>
      </div>
      <div v-if="isGameOver && formattedLogs.length > 0" class="game-over-footer">
        Game over
      </div>
      <div v-if="formattedLogs.length === 0 && !isGameOver" class="empty-log">
        Waiting for the first hand
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  events: { type: Array, default: () => [] },
  isGameOver: { type: Boolean, default: false }
})

const logContainer = ref(null)

const HIDDEN_TYPES = new Set([
  'state_updated',
  'private_hole_cards'
])

const formattedLogs = computed(() => {
  return props.events
    .filter(ev => !HIDDEN_TYPES.has(ev.type))
    .map(ev => {
      let text = ''
      let level = 'default'

      switch (ev.type) {
        case 'hand_started':
          text = `<span class="log-accent">Hand #${ev.payload.hand_number} started</span>`
          level = 'hand-start'
          break

        case 'blinds_posted':
          text = `Blinds posted <b>${ev.payload.small_blind}</b> / <b>${ev.payload.big_blind}</b> · Pot <span class="log-pot">${ev.payload.pot}</span>`
          break

        case 'player_action_applied': {
          const name = ev.payload.display_name || ev.payload.player_id?.substring(0, 8) || 'Player'
          const act = actionLabel(ev.payload.action)
          const amt = ev.payload.amount && ev.payload.amount > 0 ? ` <span class="log-pot">${ev.payload.amount}</span>` : ''
          const potAfter = ev.payload.pot_after != null && ev.payload.pot_after > 0 ? ` · pot ${ev.payload.pot_after}` : ''
          text = `<b>${name}</b> ${act}${amt}${potAfter}`
          break
        }

        case 'community_cards_dealt': {
          const stage = labelize(ev.payload.stage || '')
          const cards = (ev.payload.cards || []).join(' ')
          text = `<span class="log-muted">${stage}</span> <span class="log-pot">${cards}</span>`
          level = 'stage'
          break
        }

        case 'hand_finished': {
          const winners = ev.payload.winners || []
          const endedBy = ev.payload.ended_by || ''
          const showdownInfo = ev.payload.showdown_info || null

          if (winners.length === 0) {
            text = `<span class="log-success">Hand finished.</span>`
          } else {
            const lines = winners.map(w => {
              const name = w.display_name || w.player_id || 'Player'
              const amt = w.amount != null && w.amount > 0 ? ` wins <b class="log-pot">${w.amount}</b>` : ''
              return `<b>${name}</b><span class="log-success">${amt}</span>`
            })
            const how = endedBy === 'fold' ? ' by fold' : endedBy === 'showdown' ? ' at showdown' : ''
            const desc = showdownInfo ? `<br><span class="log-accent small">Winning hand: ${showdownInfo.winningHandName}</span>` : ''
            text = lines.join('<br>') + `<span class="log-muted small">${how}</span>` + desc
          }
          level = 'winner'
          break
        }

        case 'game_over': {
          const w = ev.payload.winner
          text = w
            ? `<b>Game over</b> · <span class="log-pot">${w.display_name || w.player_id}</span> <span class="log-success">wins the match</span>`
            : `<span class="log-muted">Game over</span>`
          level = 'game-over'
          break
        }

        case 'ai_thought': {
          const summary = cleanAiSummary(ev.payload.thought_summary || '')
          text = `<span class="log-accent">AI note:</span> <span>${summary || 'The AI is weighing the table.'}</span>`
          level = 'ai-thought'
          break
        }

        default:
          text = ''
      }

      return { text, level }
    })
    .filter(log => log.text)
})

watch(() => formattedLogs.value.length, () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
})

function actionLabel(action = '') {
  const labels = {
    FOLD: 'folded',
    CHECK: 'checked',
    CALL: 'called',
    RAISE: 'raised to',
    ALL_IN: 'went all-in'
  }
  return labels[action] || action.toLowerCase().replace('_', ' ')
}

function labelize(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}

function cleanAiSummary(text) {
  return text
    .replace(/\(Confidence:\s*\d+%\)/gi, '')
    .replace(/\[Confidence:\s*[^\]]+\]/gi, '')
    .replace(/\b(regex|fallback|parse_status|confidence)\b:?/gi, '')
    .trim()
}
</script>

<style scoped>
.hand-log {
  background-color: transparent;
  border: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.log-header {
  padding: 0.35rem 0 0.8rem;
  background-color: transparent;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.log-header h4 {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
  font-family: var(--font-family);
  font-size: 0.84rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.log-content::-webkit-scrollbar {
  width: 4px;
}

.log-content::-webkit-scrollbar-track {
  background: transparent;
}

.log-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.12);
  border-radius: 2px;
}

.log-line {
  color: var(--text-secondary);
  line-height: 1.5;
  padding: 0.45rem 0.55rem;
  border-radius: var(--radius-sm);
}

.log-line.hand-start {
  margin-top: 0.35rem;
  border-top: 1px solid rgba(217, 173, 88, 0.16);
}

.log-line.stage {
  border-left: 2px solid rgba(241, 199, 106, 0.38);
  padding-left: 0.65rem;
}

.log-line.winner {
  background-color: rgba(121, 216, 144, 0.08);
  border-left: 2px solid rgba(121, 216, 144, 0.4);
}

.log-line.ai-thought {
  background-color: rgba(217, 173, 88, 0.055);
  border-left: 2px solid rgba(217, 173, 88, 0.25);
}

.log-line.game-over {
  background-color: rgba(241, 199, 106, 0.08);
  border-left: 2px solid rgba(241, 199, 106, 0.5);
}

.empty-log {
  color: var(--text-tertiary);
  text-align: center;
  margin-top: 2rem;
  font-size: 0.82rem;
}

.game-over-footer {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-subtle);
  text-align: center;
  color: var(--text-tertiary);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
}

:deep(.log-pot) {
  color: var(--accent-turn);
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

:deep(.log-accent) {
  color: var(--accent-primary);
  font-weight: 850;
}

:deep(.log-success) {
  color: var(--success);
  font-weight: 850;
}

:deep(.log-muted) {
  color: var(--text-tertiary);
}

:deep(.small) {
  font-size: 0.75rem;
}
</style>
