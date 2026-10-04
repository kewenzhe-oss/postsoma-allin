import assert from 'node:assert/strict'
import { reactive, effectScope, nextTick } from 'vue'
import { useAIInteraction } from '../src/composables/useAIInteraction.js'
const calls=[]
const store=reactive({playerId:'hero',activeHand:{hand_number:1},heroPlayer:{chips:100,bet_in_round:10},connectionStatus:'connected',isMyTurn:true,isGameOver:false,latestHandResult:null,absentPlayers:{},errorMessage:'',rawEventLog:[],publicState:{stage:'preflop',game_status:'in_hand',current_turn_player_id:'hero'},submitAction:(...args)=>calls.push(args)})
const scope=effectScope();const ui=scope.run(()=>useAIInteraction(store))
await ui.submitHeroAction('RAISE',50)
assert.equal(ui.perceptualState.value,'submitting_action')
store.publicState={...store.publicState};await nextTick()
assert.equal(ui.perceptualState.value,'submitting_action')
await ui.submitHeroAction('RAISE',50);assert.equal(calls.length,1)
store.isMyTurn=false;store.publicState.current_turn_player_id='ai_seat';await nextTick()
assert.equal(ui.perceptualState.value,'ai_thinking')
store.latestHandResult={winners:[]};await nextTick();assert.equal(ui.perceptualState.value,'hand_resolved')
store.latestHandResult=null;store.isMyTurn=true;store.publicState.current_turn_player_id='hero';await nextTick()
await ui.submitHeroAction('CHECK');store.errorMessage='Action rejected';await nextTick()
assert.equal(ui.perceptualState.value,'player_turn')
store.isMyTurn=false;store.publicState.current_turn_player_id='friend';await nextTick()
assert.equal(ui.perceptualState.value,'waiting_for_ai')
store.absentPlayers={friend:'left'};await nextTick();assert.equal(ui.perceptualState.value,'idle')
assert.deepEqual(calls[0],['RAISE',50])
scope.stop();console.log('PASS: no duplicate submission, equivalent refresh, AI/human turns, settlement, rejection, absence')
