import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useOnlineStore = defineStore('online', () => {
  const roomId = ref('')
  const playerId = ref('')
  const playerToken = ref('')

  const publicState = ref(null)
  const privateState = ref(null)
  const availableActions = ref([])
  const rawEventLog = ref([])
  const aiThoughts = ref([])  // ai_thought events for HandLog / DebugPanel

  /**
   * Decoupled Hand History state:
   * - activeHand: Real-time ongoing hand
   * - archivedHands: Completed past hands (newest first)
   * - userReviewHandNumber: Tracks if user intentionally locked view on a past hand
   */
  const activeHand = ref(null)
  const archivedHands = ref([])
  const userReviewHandNumber = ref(null)

  const connectionStatus = ref('disconnected') // disconnected, connecting, connected, error
  const errorMessage = ref('')

  /**
   * latestHandResult — populated from hand_finished engine_event.
   * Cleared on hand_started.
   */
  const latestHandResult = ref(null)

  /**
   * latestGameResult — populated from game_over engine_event.
   * Cleared on leaveRoom / createRoom / joinRoom.
   * Shape:
   * {
   *   winner: { player_id, display_name, chips },
   *   final_stacks: [{ player_id, display_name, chips }]
   * }
   */
  const latestGameResult = ref(null)
  const isGameOverPending = ref(false)
  let gameOverTimer = null

  /**
   * revealedCards — map of player_id -> [cardStr, ...]
   * Populated from public_state.players[].revealed_hole_cards at showdown.
   * Cleared when new hand starts.
   */
  const revealedCards = ref({})

  let socket = null

  const roomMode = ref('')
  const lastAiConfig = ref(null)

  function initFromSession() {
    roomId.value = sessionStorage.getItem('roomId') || ''
    playerId.value = sessionStorage.getItem('playerId') || ''
    playerToken.value = sessionStorage.getItem('playerToken') || ''
    roomMode.value = sessionStorage.getItem('roomMode') || ''
    const savedAiConfig = sessionStorage.getItem('aiConfig')
    if (savedAiConfig) {
      try { lastAiConfig.value = JSON.parse(savedAiConfig) } catch (e) {}
    }
  }

  function saveToSession(rId, pId, pToken) {
    roomId.value = rId
    playerId.value = pId
    playerToken.value = pToken
    sessionStorage.setItem('roomId', rId)
    sessionStorage.setItem('playerId', pId)
    sessionStorage.setItem('playerToken', pToken)
  }

  async function createRoom(mode, displayName, aiConfig = null) {
    try {
      const payload = { mode, display_name: displayName }
      if (aiConfig) {
        payload.ai_config = aiConfig
      }
      const baseUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${baseUrl}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create room')
      const data = await res.json()
      
      // Save config for rematches
      roomMode.value = mode
      sessionStorage.setItem('roomMode', mode)
      if (aiConfig) {
        lastAiConfig.value = aiConfig
        sessionStorage.setItem('aiConfig', JSON.stringify(aiConfig))
      }
      
      saveToSession(data.room_id, data.player_id, data.player_token)
      return data.room_id
    } catch (e) {
      errorMessage.value = e.message
      throw e
    }
  }

  async function joinRoom(rId, displayName) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${baseUrl}/api/rooms/${rId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to join room')
      }
      const data = await res.json()
      saveToSession(rId, data.player_id, data.player_token)
      return rId
    } catch (e) {
      errorMessage.value = e.message
      throw e
    }
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

  function getPlayerDisplayName(pId, explicitName) {
    if (explicitName) return explicitName
    const p = publicState.value?.players?.find(pl => pl.player_id === pId)
    if (p && p.display_name) return p.display_name
    return pId?.substring(0, 8) || 'Player'
  }

  function handleEngineEventForHistory(ev) {
    if (!ev || !ev.type) return

    switch (ev.type) {
      case 'hand_started': {
        const handNum = ev.payload.hand_number
        if (activeHand.value && activeHand.value.hand_number !== handNum) {
          activeHand.value.status = 'finished'
          const existingIdx = archivedHands.value.findIndex(h => h.hand_number === activeHand.value.hand_number)
          if (existingIdx >= 0) {
            archivedHands.value[existingIdx] = { ...activeHand.value }
          } else {
            archivedHands.value.unshift({ ...activeHand.value })
          }
        }
        activeHand.value = {
          hand_number: handNum,
          status: 'active',
          dealer_player_id: ev.payload.dealer_player_id || '',
          streets: [
            { name: 'Preflop', cards: '', actions: [] }
          ],
          result_summary: null
        }
        break
      }

      case 'blinds_posted': {
        if (!activeHand.value) {
          activeHand.value = {
            hand_number: 1,
            status: 'active',
            dealer_player_id: ev.payload.dealer_player_id || '',
            streets: [{ name: 'Preflop', cards: '', actions: [] }],
            result_summary: null
          }
        }
        const preflop = activeHand.value.streets[0]
        const sbName = getPlayerDisplayName(ev.payload.small_blind_player_id)
        const bbName = getPlayerDisplayName(ev.payload.big_blind_player_id)
        preflop.actions.push({
          text: `<b>${sbName}</b> posts small blind <span class="log-pot">${ev.payload.small_blind}</span>`,
          isWager: true
        })
        preflop.actions.push({
          text: `<b>${bbName}</b> posts big blind <span class="log-pot">${ev.payload.big_blind}</span>`,
          isWager: true
        })
        break
      }

      case 'player_action_applied': {
        if (!activeHand.value) {
          activeHand.value = {
            hand_number: 1,
            status: 'active',
            streets: [{ name: 'Preflop', cards: '', actions: [] }],
            result_summary: null
          }
        }
        const currentStreet = activeHand.value.streets[activeHand.value.streets.length - 1]
        const name = getPlayerDisplayName(ev.payload.player_id, ev.payload.display_name)
        const act = ev.payload.action
        const amt = ev.payload.amount || 0
        const betInRound = ev.payload.bet_in_round || 0

        let text = ''
        let isWager = false
        if (act === 'FOLD') {
          text = `<b>${name}</b> folds`
        } else if (act === 'CHECK') {
          text = `<b>${name}</b> checks`
        } else if (act === 'CALL') {
          text = `<b>${name}</b> calls <span class="log-pot">${amt}</span>`
        } else if (act === 'RAISE') {
          const hasWagers = currentStreet.actions.some(a => a.isWager)
          if (!hasWagers && currentStreet.name !== 'Preflop') {
            text = `<b>${name}</b> bets <span class="log-pot">${betInRound}</span>`
          } else {
            text = `<b>${name}</b> raises to <span class="log-pot">${betInRound}</span>`
          }
          isWager = true
        } else if (act === 'ALL_IN' || act === 'ALL-IN') {
          text = `<b>${name}</b> goes all-in for <span class="log-pot">${betInRound}</span>`
          isWager = true
        } else {
          text = `<b>${name}</b> ${act.toLowerCase()}`
        }

        currentStreet.actions.push({ text, isWager })
        break
      }

      case 'community_cards_dealt': {
        if (!activeHand.value) return
        const stage = ev.payload.stage
        const stageMap = {
          FLOP: 'Flop',
          TURN: 'Turn',
          RIVER: 'River',
          SHOWDOWN: 'Showdown'
        }
        const stageLabel = stageMap[stage] || stage
        const cardsFormatted = formatCardsHtml((ev.payload.cards || []).join(' '))
        const exists = activeHand.value.streets.some(s => s.name === stageLabel)
        if (!exists) {
          activeHand.value.streets.push({
            name: stageLabel,
            cards: cardsFormatted,
            actions: []
          })
        }
        break
      }

      case 'ai_thought': {
        if (!activeHand.value) return
        const currentStreet = activeHand.value.streets[activeHand.value.streets.length - 1]
        const rawSummary = ev.payload.thought_summary || ''
        const summary = rawSummary.replace(/^Thinking:\s*/i, '').trim()
        if (summary) {
          currentStreet.actions.push({
            text: `<span class="log-accent">AI Note:</span> <span class="ai-thought-text">${summary}</span>`,
            isAi: true
          })
        }
        break
      }

      case 'hand_finished': {
        const handNum = ev.payload.hand_number
        if (!activeHand.value) {
          activeHand.value = {
            hand_number: handNum,
            status: 'active',
            streets: [{ name: 'Preflop', cards: '', actions: [] }],
            result_summary: null
          }
        }
        const winners = ev.payload.winners || []
        const endedBy = ev.payload.ended_by || ''
        const showdownInfo = ev.payload.showdown_info || null

        let text = ''
        if (winners.length === 0) {
          text = `Hand finished with no winners.`
        } else {
          const lines = winners.map(w => {
            const name = getPlayerDisplayName(w.player_id, w.display_name)
            return `<b>${name}</b> wins <span class="log-success">+${w.amount}</span>`
          })
          const how = endedBy === 'fold' ? ' (by fold)' : endedBy === 'showdown' ? ' (at showdown)' : ''
          const reason = showdownInfo?.winning_reason || showdownInfo?.winningHandName || ''
          const winningCards = (showdownInfo?.winning_cards && showdownInfo.winning_cards.length > 0)
            ? ` [${showdownInfo.winning_cards.join(' ')}]`
            : ''
          const desc = reason ? `<br><span class="log-accent small">Winning hand: ${reason}${winningCards}</span>` : ''
          text = lines.join('<br>') + `<span class="log-muted small">${how}</span>` + desc
        }

        activeHand.value.streets.push({
          name: 'Result',
          actions: [{ text }]
        })
        activeHand.value.status = 'finished'
        activeHand.value.result_summary = text

        const finishedCopy = JSON.parse(JSON.stringify(activeHand.value))
        const existingIdx = archivedHands.value.findIndex(h => h.hand_number === finishedCopy.hand_number)
        if (existingIdx >= 0) {
          archivedHands.value[existingIdx] = finishedCopy
        } else {
          archivedHands.value.unshift(finishedCopy)
        }
        break
      }
    }
  }

  function connectWebSocket() {
    if (!roomId.value || !playerToken.value) {
      errorMessage.value = 'Missing room ID or token'
      return
    }

    if (socket) {
      socket.close()
    }

    connectionStatus.value = 'connecting'

    const baseUrl = import.meta.env.VITE_API_URL || ''
    let wsUrl
    if (baseUrl) {
      const wsBaseUrl = baseUrl.replace(/^http/, 'ws')
      wsUrl = `${wsBaseUrl}/ws/rooms/${roomId.value}?token=${playerToken.value}`
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsHost = import.meta.env.DEV ? 'localhost:8000' : window.location.host
      wsUrl = `${wsProtocol}//${wsHost}/ws/rooms/${roomId.value}?token=${playerToken.value}`
    }

    socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      connectionStatus.value = 'connected'
      errorMessage.value = ''
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'state_sync') {
        publicState.value = data.payload.state.public_state
        privateState.value = data.payload.state.private_player_state
        availableActions.value = data.payload.available_actions

        // Extract revealed_hole_cards from public_state players (set at showdown)
        const newRevealed = {}
        const players = data.payload.state.public_state?.players || []
        for (const p of players) {
          if (p.revealed_hole_cards && p.revealed_hole_cards.length > 0) {
            newRevealed[p.player_id] = p.revealed_hole_cards
          }
        }
        if (Object.keys(newRevealed).length > 0) {
          revealedCards.value = { ...revealedCards.value, ...newRevealed }
        }

        // Fallback: if state says game_over but latestGameResult not yet set,
        // synthesize from public_state.match_winner
        const gs = data.payload.state.public_state?.game_status
        if (gs === 'game_over' && !latestGameResult.value) {
          const mw = data.payload.state.public_state?.match_winner
          if (mw) {
            latestGameResult.value = {
              winner: mw,
              final_stacks: (data.payload.state.public_state?.players || []).map(p => ({
                player_id: p.player_id,
                display_name: p.display_name,
                chips: p.chips
              }))
            }
          }
        }

      } else if (data.type === 'engine_event') {
        const ev = data.event
        rawEventLog.value.push(ev)
        handleEngineEventForHistory(ev)

        // ── game_over ─────────────────────────────────────
        if (ev.type === 'game_over') {
          const p = ev.payload || {}
          latestGameResult.value = {
            winner: p.winner || null,
            final_stacks: p.final_stacks || [],
            deciding_hand: p.deciding_hand || null
          }

          // If a hand just concluded, defer the game over modal popup by 3.5 seconds
          // so the decisive showdown and chip movements can be appreciated by the player.
          if (latestHandResult.value) {
            isGameOverPending.value = true
            if (gameOverTimer) clearTimeout(gameOverTimer)
            gameOverTimer = setTimeout(() => {
              isGameOverPending.value = false
            }, 3500)
          } else {
            isGameOverPending.value = false
          }
        }

        // ── hand_finished ─────────────────────────────────
        if (ev.type === 'hand_finished') {
          const p = ev.payload || {}
          const winners = p.winners || []
          const endedBy = p.ended_by || (publicState.value?.stage === 'showdown' ? 'showdown' : 'fold')
          const finalStage = publicState.value?.stage || 'river'

          latestHandResult.value = {
            hand_number: p.hand_number,
            winners,
            awarded_pot: p.awarded_pot ?? 0,
            ended_by: endedBy,
            stage: finalStage,
            showdown_info: p.showdown_info || null
          }
        }

        // ── ai_thought ─────────────────────────────────────
        if (ev.type === 'ai_thought') {
          aiThoughts.value.push(ev.payload)
        }

        // ── hand_started: clear per-hand state ───────────
        if (ev.type === 'hand_started') {
          latestHandResult.value = null
          revealedCards.value = {}
          // Do NOT clear aiThoughts — keep across hands so player can see history
          // Do NOT clear latestGameResult here — game_over persists until leaveRoom
        }

      } else if (data.type === 'error') {
        errorMessage.value = data.message
      }
    }

    socket.onclose = () => {
      connectionStatus.value = 'disconnected'
      socket = null
    }

    socket.onerror = () => {
      connectionStatus.value = 'error'
      errorMessage.value = 'WebSocket connection error'
    }
  }

  function submitAction(action, amount = null) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      errorMessage.value = 'Not connected'
      return
    }
    const payload = { action }
    if (amount !== null) {
      payload.amount = amount
    }
    socket.send(JSON.stringify(payload))
  }

  /**
   * leaveRoom — clean up all session state and close socket.
   * Call before navigating away. Does NOT clear sessionStorage player name
   * (so rematch can pre-fill it).
   */
  function leaveRoom() {
    if (socket) {
      socket.close()
      socket = null
    }
    connectionStatus.value = 'disconnected'
    sessionStorage.removeItem('roomId')
    sessionStorage.removeItem('playerId')
    sessionStorage.removeItem('playerToken')
    roomId.value = ''
    playerId.value = ''
    playerToken.value = ''
    publicState.value = null
    privateState.value = null
    availableActions.value = []
    rawEventLog.value = []
    latestHandResult.value = null
    latestGameResult.value = null
    revealedCards.value = {}
    aiThoughts.value = []
    activeHand.value = null
    archivedHands.value = []
    userReviewHandNumber.value = null
    if (gameOverTimer) {
      clearTimeout(gameOverTimer)
      gameOverTimer = null
    }
    isGameOverPending.value = false
  }

  /** Alias kept for backward compat */
  function disconnect() {
    leaveRoom()
  }

  // ── Computed getters ──────────────────────────────────

  const heroPlayer = computed(() => {
    if (!publicState.value?.players) return null
    return publicState.value.players.find(p => p.player_id === playerId.value) || null
  })

  const opponentPlayer = computed(() => {
    if (!publicState.value?.players) return null
    return publicState.value.players.find(p => p.player_id !== playerId.value) || null
  })

  const isMyTurn = computed(() => {
    if (!publicState.value) return false
    return publicState.value.current_turn_player_id === playerId.value
  })

  const isHandInProgress = computed(() => {
    if (!publicState.value) return false
    const stage = publicState.value.stage
    if (!stage) return false
    if (latestHandResult.value !== null) return false
    if (latestGameResult.value !== null) return false
    return true
  })

  /**
   * isGameOver — true when backend says game_status=game_over
   * OR latestGameResult is set (from game_over event).
   * Frontend reads this; never infers from chips independently.
   */
  const isGameOver = computed(() => {
    if (latestGameResult.value !== null) return true
    if (publicState.value?.game_status === 'game_over') return true
    return false
  })

  const allHands = computed(() => {
    if (activeHand.value && activeHand.value.status === 'active') {
      const archived = archivedHands.value.filter(h => h.hand_number !== activeHand.value.hand_number)
      return [activeHand.value, ...archived]
    }
    return archivedHands.value
  })

  const activeHandNumber = computed(() => activeHand.value?.hand_number || null)

  const isReviewingPastHand = computed(() => {
    return (
      userReviewHandNumber.value !== null &&
      activeHand.value !== null &&
      activeHand.value.status === 'active' &&
      userReviewHandNumber.value !== activeHand.value.hand_number
    )
  })

  function lockReviewHand(handNum) {
    userReviewHandNumber.value = handNum
  }

  function returnToLiveHand() {
    userReviewHandNumber.value = null
  }

  return {
    roomId,
    playerId,
    playerToken,
    publicState,
    privateState,
    availableActions,
    rawEventLog,
    aiThoughts,
    latestHandResult,
    latestGameResult,
    isGameOverPending,
    revealedCards,
    activeHand,
    archivedHands,
    userReviewHandNumber,
    allHands,
    activeHandNumber,
    isReviewingPastHand,
    lockReviewHand,
    returnToLiveHand,
    connectionStatus,
    errorMessage,
    heroPlayer,
    opponentPlayer,
    isMyTurn,
    isHandInProgress,
    isGameOver,
    roomMode,
    lastAiConfig,
    initFromSession,
    createRoom,
    joinRoom,
    connectWebSocket,
    submitAction,
    leaveRoom,
    disconnect
  }
})
