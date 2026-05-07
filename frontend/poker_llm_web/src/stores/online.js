import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { buildShowdownResult } from '@/utils/pokerEvaluator'

export const useOnlineStore = defineStore('online', () => {
  const roomId = ref('')
  const playerId = ref('')
  const playerToken = ref('')

  const publicState = ref(null)
  const privateState = ref(null)
  const availableActions = ref([])
  const rawEventLog = ref([])
  const aiThoughts = ref([])  // ai_thought events for HandLog / DebugPanel

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
      const res = await fetch('/api/rooms', {
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
      const res = await fetch(`/api/rooms/${rId}/join`, {
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

  function connectWebSocket() {
    if (!roomId.value || !playerToken.value) {
      errorMessage.value = 'Missing room ID or token'
      return
    }

    if (socket) {
      socket.close()
    }

    connectionStatus.value = 'connecting'

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = import.meta.env.DEV ? 'localhost:8000' : window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws/rooms/${roomId.value}?token=${playerToken.value}`

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

        // ── game_over ─────────────────────────────────────
        if (ev.type === 'game_over') {
          const p = ev.payload || {}
          latestGameResult.value = {
            winner: p.winner || null,
            final_stacks: p.final_stacks || []
          }
        }

        // ── hand_finished ─────────────────────────────────
        if (ev.type === 'hand_finished') {
          const p = ev.payload || {}
          const winners = p.winners || []
          const endedBy = p.ended_by || (publicState.value?.stage === 'showdown' ? 'showdown' : 'fold')
          
          let showdownResult = null
          if (endedBy === 'showdown') {
            // Determine hero/villain IDs
            const hId = playerId.value
            const opPlayer = publicState.value?.players?.find(pl => pl.player_id !== hId)
            const vId = opPlayer ? opPlayer.player_id : null
            
            if (hId && vId) {
              const heroHoles = privateState.value?.hole_cards || []
              // Use newly extracted revealedCards
              const newRevealedMap = revealedCards.value || {}
              const villainHoles = newRevealedMap[vId] || []
              const boardCards = publicState.value?.community_cards || []
              
              showdownResult = buildShowdownResult(hId, heroHoles, vId, villainHoles, boardCards)
              ev.payload.showdown_info = showdownResult
            }
          }

          latestHandResult.value = {
            hand_number: p.hand_number,
            winners,
            awarded_pot: p.awarded_pot ?? 0,
            ended_by: endedBy,
            showdown_info: showdownResult
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
    revealedCards,
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
