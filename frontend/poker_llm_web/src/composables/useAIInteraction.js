import { ref, watch } from 'vue'

/** Action feedback follows the authoritative turn, without delayed turn overrides. */
export function useAIInteraction(onlineStore) {
  const perceptualState = ref('idle')
  const latestAIAction = ref(null)
  let pendingSignature = null
  const turnSignature = () => [onlineStore.activeHand?.hand_number, onlineStore.publicState?.stage, onlineStore.publicState?.current_turn_player_id, onlineStore.heroPlayer?.chips, onlineStore.heroPlayer?.bet_in_round].join(':')
  const isAI = id => typeof id === 'string' && id.startsWith('ai')
  const resolveState = () => {
    if (onlineStore.connectionStatus !== 'connected') return 'idle'
    if (onlineStore.isGameOver || onlineStore.latestHandResult) return 'hand_resolved'
    if (onlineStore.publicState?.game_status !== 'in_hand' ||
        Object.keys(onlineStore.absentPlayers || {}).length) return 'idle'
    const turnId = onlineStore.publicState?.current_turn_player_id
    if (!turnId) return 'idle'
    if (onlineStore.isMyTurn) return 'player_turn'
    return isAI(turnId) ? 'ai_thinking' : 'waiting_for_ai'
  }

  watch(() => [onlineStore.isMyTurn, onlineStore.publicState,
    onlineStore.isGameOver, onlineStore.latestHandResult,
    onlineStore.connectionStatus, onlineStore.absentPlayers,
    onlineStore.rawEventLog.length], () => {
    const next = resolveState()
    if (next !== 'player_turn' || turnSignature() !== pendingSignature) pendingSignature = null
    perceptualState.value = pendingSignature === null ? next : 'submitting_action'
  }, { immediate: true, deep: true })

  // Error recovery: reset submitting_action if server reports an error
  watch(() => onlineStore.errorMessage, (err) => {
    if (err && perceptualState.value === 'submitting_action') {
      console.warn('Action rejected or connection error, restoring player_turn:', err)
      pendingSignature = null
      perceptualState.value = resolveState()
    }
  })


  // Method to be called by ActionPanel when user submits
  const submitHeroAction = async (action, amount) => {
    if (perceptualState.value !== 'player_turn') return
    
    onlineStore.errorMessage = ''
    pendingSignature = turnSignature()
    perceptualState.value = 'submitting_action'

    // Keep submission locked until the authoritative turn changes or an error arrives.
    // A timeout alone cannot prove that the action was rejected.
    try {
      await onlineStore.submitAction(action, amount)
      // The watch will automatically transition to ai_thinking once backend updates turn
    } catch (e) {
      pendingSignature = null
      perceptualState.value = resolveState() // Restore the current authoritative turn
      throw e
    }
  }

  // Keep the latest action for display, never let an animation override whose turn it is.
  watch(() => onlineStore.rawEventLog.length, (length, previous = 0) => {
    const events = onlineStore.rawEventLog.slice(length < previous ? 0 : previous)
    for (const event of events) {
      if (event.type === 'player_action_applied' && isAI(event.payload?.player_id)) {
        latestAIAction.value = {
          action: event.payload.action,
          amount: event.payload.action === 'RAISE' ? event.payload.bet_in_round : event.payload.amount,
          reasoning: null
        }
      }
    }
  })

  return {
    perceptualState,
    latestAIAction,
    submitHeroAction
  }
}
