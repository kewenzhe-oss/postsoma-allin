<template>
  <div class="hand-log">
    <div class="log-header">
      <h4>Hand History</h4>
    </div>
    <div class="log-content" ref="logContainer">
      <el-collapse v-slot="{ active }" v-model="activeNames" class="premium-collapse" accordion>
        <el-collapse-item
          v-for="hand in groupedHands"
          :key="hand.hand_number"
          :name="hand.hand_number.toString()"
        >
          <template #title>
            <div class="hand-title">
              <span class="hand-badge">HAND #{{ hand.hand_number }}</span>
              <span class="hand-summary" v-html="getHandWinnerSummary(hand)"></span>
            </div>
          </template>
          
          <div class="hand-details">
            <div
              v-for="street in hand.streets"
              :key="street.name"
              class="street-group"
            >
              <div class="street-header">
                <span class="street-name">{{ street.name }}</span>
                <span v-if="street.cards" class="street-cards" v-html="street.cards"></span>
              </div>
              <div class="street-actions">
                <div
                  v-for="(action, idx) in street.actions"
                  :key="idx"
                  class="action-line"
                  :class="{ 'is-ai': action.isAi }"
                >
                  <span v-html="action.text"></span>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      
      <div v-if="groupedHands.length === 0" class="empty-log">
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
const activeNames = ref([])

// Group logs into collapsible hands & streets
const groupedHands = computed(() => {
  const hands = []
  let currentHand = null

  const getPlayerLabel = (id, displayName) => {
    if (displayName) return displayName
    return id?.substring(0, 8) || 'Player'
  }

  props.events.forEach(ev => {
    if (ev.type === 'hand_started') {
      currentHand = {
        hand_number: ev.payload.hand_number,
        streets: [
          { name: 'Preflop', actions: [] }
        ]
      }
      hands.push(currentHand)
      return
    }

    if (!currentHand) return

    switch (ev.type) {
      case 'blinds_posted': {
        const street = currentHand.streets[0] // Preflop
        const sbName = getPlayerLabel(ev.payload.small_blind_player_id)
        const bbName = getPlayerLabel(ev.payload.big_blind_player_id)
        street.actions.push({
          text: `<b>${sbName}</b> posts small blind <span class="log-pot">${ev.payload.small_blind}</span>`,
          isWager: true
        })
        street.actions.push({
          text: `<b>${bbName}</b> posts big blind <span class="log-pot">${ev.payload.big_blind}</span>`,
          isWager: true
        })
        break
      }

      case 'player_action_applied': {
        const street = currentHand.streets[currentHand.streets.length - 1]
        const name = getPlayerLabel(ev.payload.player_id, ev.payload.display_name)
        const act = ev.payload.action
        const amt = ev.payload.amount || 0
        const betInRound = ev.payload.bet_in_round || 0
        
        let text = ''
        if (act === 'FOLD') {
          text = `<b>${name}</b> folds`
        } else if (act === 'CHECK') {
          text = `<b>${name}</b> checks`
        } else if (act === 'CALL') {
          text = `<b>${name}</b> calls <span class="log-pot">${amt}</span>`
        } else if (act === 'RAISE') {
          const hasWagers = street.actions.some(a => a.isWager)
          if (!hasWagers && street.name !== 'Preflop') {
            text = `<b>${name}</b> bets <span class="log-pot">${betInRound}</span>`
          } else {
            text = `<b>${name}</b> raises to <span class="log-pot">${betInRound}</span>`
          }
          street.actions.push({ text, isWager: true })
          break
        } else if (act === 'ALL_IN' || act === 'ALL-IN') {
          text = `<b>${name}</b> goes all-in for <span class="log-pot">${betInRound}</span>`
          street.actions.push({ text, isWager: true })
          break
        } else {
          text = `<b>${name}</b> ${act.toLowerCase()}`
        }
        
        street.actions.push({ text })
        break
      }

      case 'community_cards_dealt': {
        const stage = ev.payload.stage
        const stageLabel = labelize(stage)
        const cardsFormatted = formatCardsHtml((ev.payload.cards || []).join(' '))
        
        currentHand.streets.push({
          name: stageLabel,
          cards: cardsFormatted,
          actions: []
        })
        break
      }

      case 'hand_finished': {
        const winners = ev.payload.winners || []
        const endedBy = ev.payload.ended_by || ''
        const showdownInfo = ev.payload.showdown_info || null
        
        let text = ''
        if (winners.length === 0) {
          text = `Hand finished with no winners.`
        } else {
          const lines = winners.map(w => {
            const name = getPlayerLabel(w.player_id, w.display_name)
            return `<b>${name}</b> wins <span class="log-success">+${w.amount}</span>`
          })
          const how = endedBy === 'fold' ? ' (by fold)' : endedBy === 'showdown' ? ' (at showdown)' : ''
          const desc = showdownInfo ? `<br><span class="log-accent small">Winning hand: ${showdownInfo.winning_reason || showdownInfo.winningHandName}</span>` : ''
          text = lines.join('<br>') + `<span class="log-muted small">${how}</span>` + desc
        }
        
        currentHand.streets.push({
          name: 'Result',
          actions: [{ text }]
        })
        break
      }

      case 'ai_thought': {
        const street = currentHand.streets[currentHand.streets.length - 1]
        const summary = cleanAiSummary(ev.payload.thought_summary || '')
        if (summary) {
          street.actions.push({
            text: `<span class="log-accent">AI Note:</span> <span class="ai-thought-text">${summary}</span>`,
            isAi: true
          })
        }
        break
      }
    }
  })

  return [...hands].reverse()
})

// Auto-expand the active hand (first element in reversed list)
watch(() => groupedHands.value, (newHands) => {
  if (newHands.length > 0 && activeNames.value.length === 0) {
    activeNames.value = [newHands[0].hand_number.toString()]
  }
}, { immediate: true })

function getHandWinnerSummary(hand) {
  const resultStreet = hand.streets.find(s => s.name === 'Result')
  if (!resultStreet || resultStreet.actions.length === 0) {
    return '<span class="log-live-badge">Active</span>'
  }
  const actionText = resultStreet.actions[0].text
  return actionText.replace(/<br>.*/s, '') // Only show the first winner line, strip details
}

function formatCardHtml(cardStr) {
  if (!cardStr) return ''
  const suitSymbols = ['♠', '♥', '♦', '♣']
  const firstChar = cardStr.charAt(0)
  
  let rank = cardStr
  let suit = ''
  
  if (suitSymbols.includes(firstChar)) {
    rank = cardStr.slice(1)
    suit = firstChar
  } else {
    const lastChar = cardStr.slice(-1)
    if (suitSymbols.includes(lastChar)) {
      rank = cardStr.slice(0, -1)
      suit = lastChar
    }
  }
  
  const isRed = suit === '♥' || suit === '♦'
  const suitClass = isRed ? 'card-red' : 'card-black'
  return `<span class="card-pill ${suitClass}">${rank}${suit}</span>`
}

function formatCardsHtml(text) {
  if (!text) return ''
  return text.split(' ').map(formatCardHtml).join(' ')
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
}

.premium-collapse {
  border: none;
  --el-collapse-border-color: transparent;
  --el-collapse-header-bg-color: transparent;
  --el-collapse-content-bg-color: rgba(255, 255, 255, 0.02);
}

:deep(.el-collapse-item) {
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  margin-bottom: 0.5rem;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.015);
  transition: all 0.25s ease;
}

:deep(.el-collapse-item:hover) {
  border-color: rgba(241, 199, 106, 0.2);
  background-color: rgba(255, 255, 255, 0.03);
}

:deep(.el-collapse-item__header) {
  border-bottom: none;
  height: auto;
  line-height: inherit;
  padding: 0.6rem 0.75rem;
  font-family: inherit;
  color: var(--text-secondary);
}

:deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background-color: rgba(0, 0, 0, 0.2);
}

:deep(.el-collapse-item__content) {
  padding: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.hand-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 0.5rem;
}

.hand-badge {
  font-size: 0.7rem;
  color: var(--accent-turn);
  font-weight: 800;
  letter-spacing: 0.05em;
  background-color: rgba(241, 199, 106, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

.hand-summary {
  font-size: 0.74rem;
  color: var(--text-secondary);
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-live-badge {
  color: var(--accent-primary);
  font-weight: 700;
  font-size: 0.7rem;
  background-color: rgba(217, 173, 88, 0.12);
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
}

.hand-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.street-group {
  border-left: 2px solid rgba(255, 255, 255, 0.08);
  padding-left: 0.65rem;
}

.street-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.3rem;
}

.street-name {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
}

.action-line {
  line-height: 1.5;
  padding: 0.15rem 0;
}

.action-line.is-ai {
  background-color: rgba(217, 173, 88, 0.04);
  border-left: 2px solid rgba(217, 173, 88, 0.25);
  padding-left: 0.35rem;
  margin: 0.25rem 0;
  border-radius: 0 4px 4px 0;
}

:deep(.ai-thought-text) {
  color: var(--text-tertiary);
  font-style: italic;
}

.empty-log {
  color: var(--text-tertiary);
  text-align: center;
  margin-top: 2rem;
  font-size: 0.82rem;
}

/* Card rendering styles */
:deep(.card-pill) {
  display: inline-block;
  padding: 0px 4px;
  border-radius: 3px;
  font-weight: 800;
  font-size: 0.76rem;
  margin: 0 1px;
  line-height: 1.35;
}
:deep(.card-red) {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.2);
}
:deep(.card-black) {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

:deep(.log-pot) {
  color: var(--accent-turn);
  font-weight: 850;
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
  font-size: 0.72rem;
}
</style>
