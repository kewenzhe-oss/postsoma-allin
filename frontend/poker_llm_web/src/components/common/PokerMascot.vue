<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { mascotConfig as config } from '@/mascot.config.js'
import { MascotEngine } from '@/mascot/engine/player.js'
import { createMascotSenses } from '@/mascot/engine/senses.js'
import { isZh } from '@/i18n/locale.js'
import '@/mascot/mascot.css'
const route=useRoute(),button=ref(null),dock=ref(null),renderPaused=ref(false),theme=ref('dark'),view=ref({mode:'rest',behavior:null,xPercent:78,transitionMs:700,actionMs:0});let interval,senses,visibilityHandler,intersection;const queue=[];
const emit=signal=>queue.push(signal);
const isFocusedMatchView=computed(()=>route.name!=='Home'||route.query.mode==='hvh'||route.query.mode==='hva');
const statusBubble=computed(()=>{
 if(isFocusedMatchView.value)return '';
 if(view.value.mode==='shy')return isZh.value?'害羞躲起来了…':'Getting shy…';
 if(view.value.mode==='shock')return isZh.value?'吓一跳！':'Whoa!';
 if(view.value.behavior==='cards_review')return isZh.value?'先看清五问，再决定行动':'Check the 5 questions first';
 if(view.value.mode==='companion')return isZh.value?'手牌 · 局面 · 范围 · 价格 · 风险':'Hand · Context · Range · Price · Risk';
 return '';
});
const anchor=()=>{const box=button.value?.getBoundingClientRect();return box?(box.left+box.width/2)/window.innerWidth*100:view.value.xPercent;};
const dockStyle=computed(()=>({left:'50%',bottom:'0px','--poker-mobile-width':config.motion.stage.mobile.width+'px','--poker-mobile-height':config.motion.stage.mobile.height+'px','--poker-desktop-width':config.motion.stage.desktop.width+'px','--poker-desktop-height':config.motion.stage.desktop.height+'px','--poker-mobile-rest':config.motion.restOffsetPx.mobile+'px','--poker-desktop-rest':config.motion.restOffsetPx.desktop+'px','--poker-mobile-peek':config.motion.peekOffsetPx.mobile+'px','--poker-desktop-peek':config.motion.peekOffsetPx.desktop+'px','--poker-mobile-hidden':config.motion.hiddenOffsetPx.mobile+'px','--poker-desktop-hidden':config.motion.hiddenOffsetPx.desktop+'px','--poker-hover-ms':config.scheduler.hoverMs+'ms','--poker-click-ms':config.scheduler.clickMs+'ms','--poker-lift':config.motion.companionLiftPx+'px','--poker-x':(view.value.xPercent-50)+'vw','--poker-transition-ms':view.value.transitionMs+'ms','--poker-action-ms':view.value.actionMs+'ms','--poker-breath-ms':config.animation.breathMs+'ms','--poker-blink-ms':config.animation.blinkMs+'ms','--poker-sprout-angle':config.animation.sproutDegrees+'deg'}));
const slotStyle=slot=>({left:slot.left,right:slot.right,top:slot.top,width:slot.width,zIndex:slot.zIndex,transform:slot.transform,transformOrigin:slot.pivot});
watch(isFocusedMatchView,()=>{senses?.refreshBusy();});
const eyeStyle=eye=>{const extent=eye.haloRadius+6.5;return {left:(eye.x-extent)/config.core.width*100+'%',top:(eye.y-extent)/config.core.height*100+'%',width:extent*2/config.core.width*100+'%',height:extent*2/config.core.height*100+'%'}};
const eyeExtent=eye=>eye.haloRadius+6.5;
onMounted(()=>{
 let storage=null;try{storage=localStorage}catch{}
 const engine=new MascotEngine(storage,Date.now());view.value=engine.snapshot();
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 senses=createMascotSenses(()=>button.value,emit,value=>theme.value=value,()=>isFocusedMatchView.value);
 const step=()=>{engine.tick(Date.now(),queue.splice(0),motion.matches);if(engine.consumeChanged())view.value=engine.snapshot();};
 let intersecting=true;
 visibilityHandler=()=>{renderPaused.value=document.hidden||!intersecting;emit({type:'document_hidden',value:document.hidden});step();clearInterval(interval);interval=document.hidden?undefined:setInterval(step,config.scheduler.tickMs);};
 intersection=new IntersectionObserver(([entry])=>{intersecting=entry.isIntersecting;renderPaused.value=document.hidden||!intersecting;});
 if(dock.value)intersection.observe(dock.value);
 document.addEventListener('visibilitychange',visibilityHandler);visibilityHandler();
});
onUnmounted(()=>{clearInterval(interval);document.removeEventListener('visibilitychange',visibilityHandler);intersection?.disconnect();senses?.dispose();queue.length=0;});
</script>
<template>
 <div class="poker-mascot-boundary" :aria-hidden="isFocusedMatchView ? 'true' : 'false'">
  <div ref="dock" :data-render-paused="renderPaused || view.mode === 'guarded' || view.mode === 'shy_wait' ? 'true' : 'false'" class="poker-mascot-dock" :style="dockStyle" :data-mode="view.mode" :data-behavior="view.behavior" :data-theme="theme" @transitionend="event => {if(event.target===event.currentTarget && event.propertyName==='transform') emit({type:'transition_end'})}">
   <transition name="fade">
    <span v-if="statusBubble" class="poker-mascot-bubble" role="status" aria-live="polite">{{ statusBubble }}</span>
   </transition>
   <button ref="button" class="poker-mascot-button" :tabindex="isFocusedMatchView || view.mode === 'guarded' ? -1 : 0" aria-label="PostSoma mascot" @click="emit({type:'tap',at:Date.now(),anchorX:anchor()})" @pointerenter="event => {if(event.pointerType!=='touch')emit({type:'hover',anchorX:anchor()})}" @pointerleave="emit({type:'hover_leave'})">
    <span class="poker-mascot-stage"><span class="poker-mascot-core">
     <img class="poker-mascot-plate" :src="config.core[theme]" alt="" draggable="false" />
     <span class="poker-mascot-sprout" :style="{left:config.core.sprout.left,top:config.core.sprout.top,width:config.core.sprout.displayWidth,transformOrigin:config.core.sprout.pivot}"><img :src="config.core.sprout[theme]" alt="" draggable="false" /></span>
     <span v-for="(slot,key) in config.slots" :key="key" class="poker-mascot-slot" :class="'poker-mascot-'+key" :style="slotStyle(slot)"><img :src="slot[theme]" :style="{transformOrigin:slot.pivot}" alt="" draggable="false" /></span>
     <span class="poker-mascot-eyes" aria-hidden="true">
      <span v-for="(eye,index) in config.core.eyes" :key="index" class="poker-mascot-eye" :style="eyeStyle(eye)">
       <svg :viewBox="`0 0 ${eyeExtent(eye)*2} ${eyeExtent(eye)*2}`"><circle class="poker-mascot-eye-halo" :cx="eyeExtent(eye)" :cy="eyeExtent(eye)" :r="eye.haloRadius"/><circle class="poker-mascot-eye-moon" :cx="eyeExtent(eye)" :cy="eyeExtent(eye)" :r="eye.moonRadius"/></svg>
      </span>
     </span>
     <span class="poker-mascot-cheek poker-mascot-cheek-left"/><span class="poker-mascot-cheek poker-mascot-cheek-right"/>
    </span></span>
   </button>
  </div>
 </div>
</template>
