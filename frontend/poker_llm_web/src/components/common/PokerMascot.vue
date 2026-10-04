<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mascotConfig as config } from '@/mascot.config.js'
import { MascotEngine } from '@/mascot/engine/player.js'
import { createMascotSenses } from '@/mascot/engine/senses.js'
import '@/mascot/mascot.css'
const route=useRoute(),button=ref(null),theme=ref('dark'),view=ref({mode:'rest',behavior:null,xPercent:78,transitionMs:700,actionMs:0});let interval,senses;const queue=[];
const emit=signal=>queue.push(signal);
const anchor=()=>{const box=button.value?.getBoundingClientRect();return box?(box.left+box.width/2)/window.innerWidth*100:view.value.xPercent;};
const dockStyle=computed(()=>({left:'50%',bottom:'0px','--poker-mobile-width':config.motion.stage.mobile.width+'px','--poker-mobile-height':config.motion.stage.mobile.height+'px','--poker-desktop-width':config.motion.stage.desktop.width+'px','--poker-desktop-height':config.motion.stage.desktop.height+'px','--poker-mobile-rest':config.motion.restOffsetPx.mobile+'px','--poker-desktop-rest':config.motion.restOffsetPx.desktop+'px','--poker-mobile-peek':config.motion.peekOffsetPx.mobile+'px','--poker-desktop-peek':config.motion.peekOffsetPx.desktop+'px','--poker-mobile-hidden':config.motion.hiddenOffsetPx.mobile+'px','--poker-desktop-hidden':config.motion.hiddenOffsetPx.desktop+'px','--poker-hover-ms':config.scheduler.hoverMs+'ms','--poker-click-ms':config.scheduler.clickMs+'ms','--poker-lift':config.motion.companionLiftPx+'px','--poker-x':(view.value.xPercent-50)+'vw','--poker-transition-ms':view.value.transitionMs+'ms','--poker-action-ms':view.value.actionMs+'ms','--poker-breath-ms':config.animation.breathMs+'ms','--poker-blink-ms':config.animation.blinkMs+'ms','--poker-sprout-angle':config.animation.sproutDegrees+'deg'}));
const slotStyle=slot=>({left:slot.left,right:slot.right,top:slot.top,width:slot.width,zIndex:slot.zIndex,transform:slot.transform,transformOrigin:slot.pivot});
watch(()=>route.name,()=>senses?.refreshBusy());
onMounted(()=>{let storage=null;try{storage=localStorage}catch{}const engine=new MascotEngine(storage,Date.now());view.value=engine.snapshot();const motion=matchMedia('(prefers-reduced-motion: reduce)');senses=createMascotSenses(()=>button.value,emit,value=>theme.value=value,()=>route.name!=='Home');interval=setInterval(()=>{engine.tick(Date.now(),queue.splice(0),motion.matches);if(engine.consumeChanged())view.value=engine.snapshot();},config.scheduler.tickMs);});
onUnmounted(()=>{clearInterval(interval);senses?.dispose();queue.length=0;});
</script>
<template>
 <div v-show="route.name === 'Home'" class="poker-mascot-boundary">
  <div class="poker-mascot-dock" :style="dockStyle" :data-mode="view.mode" :data-behavior="view.behavior" :data-theme="theme" @transitionend="event => {if(event.target===event.currentTarget && event.propertyName==='transform') emit({type:'transition_end'})}">
   <button ref="button" class="poker-mascot-button" aria-label="PostSoma mascot" @click="emit({type:'tap',at:Date.now(),anchorX:anchor()})" @pointerenter="event => {if(event.pointerType!=='touch')emit({type:'hover',anchorX:anchor()})}" @pointerleave="emit({type:'hover_leave'})">
    <span class="poker-mascot-stage"><span class="poker-mascot-core">
     <img class="poker-mascot-plate" :src="config.core[theme]" alt="" draggable="false" />
     <span class="poker-mascot-sprout" :style="{left:config.core.sprout.left,top:config.core.sprout.top,width:config.core.sprout.displayWidth,transformOrigin:config.core.sprout.pivot}"><img :src="config.core.sprout[theme]" alt="" draggable="false" /></span>
     <span v-for="(slot,key) in config.slots" :key="key" class="poker-mascot-slot" :class="'poker-mascot-'+key" :style="slotStyle(slot)"><img :src="slot[theme]" :style="{transformOrigin:slot.pivot}" alt="" draggable="false" /></span>
     <svg class="poker-mascot-eyes" viewBox="0 0 1122 1228" aria-hidden="true"><g v-for="(eye,index) in config.core.eyes" :key="index" class="poker-mascot-eye" :style="{transformOrigin:eye.x+'px '+eye.y+'px'}"><circle class="poker-mascot-eye-halo" :cx="eye.x" :cy="eye.y" :r="eye.haloRadius"/><circle class="poker-mascot-eye-moon" :cx="eye.x" :cy="eye.y" :r="eye.moonRadius"/></g></svg>
     <span class="poker-mascot-cheek poker-mascot-cheek-left"/><span class="poker-mascot-cheek poker-mascot-cheek-right"/>
    </span></span>
   </button>
  </div>
 </div>
</template>
