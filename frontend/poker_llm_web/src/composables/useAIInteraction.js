import { ref, watch, computed, onScopeDispose } from 'vue'

/**
 * Manages the "Perceptual State Machine" for AI interactions.
 * Translates instantaneous backend state changes into human-friendly 
 * paced experiences (e.g., adding artificial delays for AI actions).
 */
export function useAIInteraction(onlineStore) {
  const perceptualState = ref('idle')
  // 'idle' | 'waiting_for_ai' | 'player_turn' | 'submitting_action' | 'ai_thinking' | 'ai_action_revealed' | 'hand_resolved'

  const latestAIAction = ref(null)
  let actionRevealTimeout = null

  // Helper computed properties
  const isMyTurnTrue = computed(() => onlineStore.isMyTurn)
  const currentTurnPlayerId = computed(() => onlineStore.publicState?.current_turn_player_id)
  const isGameOver = computed(() => onlineStore.isGameOver)
  const connectionStatus = computed(() => onlineStore.connectionStatus)
  const currentStage = computed(() => onlineStore.publicState?.stage)
  const handNumber = computed(() => onlineStore.publicState?.hand_number)
  const eventCount = computed(() => onlineStore.rawEventLog.length)

  watch([
    isMyTurnTrue,
    currentTurnPlayerId,
    isGameOver,
    connectionStatus,
    currentStage,
    handNumber,
    eventCount
  ], ([isMine, turnId, over, conn]) => {
    // If not connected, default to idle or waiting
    if (conn !== 'connected') {
      perceptualState.value = 'idle'
      return
    }

    if (over) {
      perceptualState.value = 'hand_resolved'
      return
    }

    if (!turnId) {
      perceptualState.value = 'idle'
      return
    }

    if (isMine) {
      perceptualState.value = 'player_turn'
    } else if (turnId === 'ai_seat' || turnId.startsWith('ai')) {
      // AI's turn
      if (perceptualState.value !== 'ai_action_revealed') {
        perceptualState.value = 'ai_thinking'
      }
    } else {
      // Opponent human turn
      perceptualState.value = 'waiting_for_ai' // or opponent
    }
  }, { immediate: true })

  // Method to be called by ActionPanel when user submits
  const submitHeroAction = async (action, amount) => {
    if (perceptualState.value !== 'player_turn') return
    
    perceptualState.value = 'submitting_action'
    try {
      await onlineStore.submitAction(action, amount)
      // The watch will automatically transition to ai_thinking once backend updates turn
    } catch (e) {
      perceptualState.value = 'player_turn' // Revert on error
      throw e
    }
  }

  // Intercept the AI action from the raw event log to trigger 'ai_action_revealed'
  watch(() => onlineStore.rawEventLog.length, () => {
    const newLogs = onlineStore.rawEventLog
    if (!newLogs || newLogs.length === 0) return
    
    const lastEvent = newLogs[newLogs.length - 1]
    
    // If the last event is an action from the AI
    if (lastEvent.type === 'player_action_applied' && 
        (lastEvent.payload?.player_id === 'ai_seat' || lastEvent.payload?.player_id?.startsWith('ai'))) {
      
      latestAIAction.value = {
        action: lastEvent.payload.action,
        amount: lastEvent.payload.amount,
        reasoning: null
      }

      // Transition to revealing state
      perceptualState.value = 'ai_action_revealed'

      // Clear any existing timeout
      if (actionRevealTimeout) clearTimeout(actionRevealTimeout)

      // Hold the revealed state for 1.5 seconds before letting it go back to player_turn or hand_resolved
      actionRevealTimeout = setTimeout(() => {
        if (onlineStore.isGameOver) {
          perceptualState.value = 'hand_resolved'
        } else if (onlineStore.isMyTurn) {
          perceptualState.value = 'player_turn'
        } else if (onlineStore.publicState?.current_turn_player_id) {
           perceptualState.value = 'ai_thinking'
        } else {
          perceptualState.value = 'idle'
        }
      }, 1500)
    }
  })

  onScopeDispose(() => {
    if (actionRevealTimeout) {
      clearTimeout(actionRevealTimeout)
      actionRevealTimeout = null
    }
  })

  return {
    perceptualState,
    latestAIAction,
    submitHeroAction
  }
}
