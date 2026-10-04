<template>
  <div class="hand-result-center" role="status" aria-live="polite">
    <strong>{{ summary }}</strong>
    <span>{{ amounts }}</span>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { isZh } from '@/i18n/locale.js'
const props=defineProps({result:{type:Object,required:true}})
const summary=computed(()=>{
 const winners=props.result.winners || []
 if(winners.length>1) return isZh.value ? '分池' : 'Split pot'
 const name=winners[0]?.display_name || winners[0]?.player_id || ''
 return `${name} ${isZh.value ? '获胜' : 'wins'}`
})
const amounts=computed(()=>(props.result.winners || []).map(w=>`${w.display_name || w.player_id} +${w.amount}`).join(' · '))
</script>
<style scoped>
.hand-result-center { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.2rem; color:var(--accent-primary); text-align:center; font-size:.9rem; line-height:1.35; }
span { color:var(--text-secondary); font-size:.8rem; }
</style>
