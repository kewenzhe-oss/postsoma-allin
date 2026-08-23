<template>
  <div class="header-section">
    <div class="eyebrow">{{ headerContent.eyebrow }}</div>
    <h1 class="main-title">{{ headerContent.title }}</h1>
    <p class="subtitle">{{ headerContent.subtitle }}</p>
    <p v-if="currentMode === 'select'" class="subtitle-cn">看懂范围，算清赔率，在短决策中建立扑克直觉。</p>
    
    <!-- GTO Entrance Button -->
    <div class="gto-entry-wrapper" v-if="currentMode === 'select'">
      <button class="gto-entry-btn" @click="$emit('open-ranges')">
        <svg class="gto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Decision Guide · 决策指南
      </button>
    </div>

    <transition name="fade">
      <div v-if="currentMode !== 'select'" class="mode-navigation">
        <el-button 
          @click="$emit('back')" 
          class="back-btn" 
          text
        >
          <el-icon><ArrowLeft /></el-icon> Back to training home
        </el-button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const props = defineProps({
  currentMode: {
    type: String,
    required: true
  }
})

defineEmits(['back', 'open-ranges'])

const headerContent = computed(() => {
  if (props.currentMode === 'hvh') {
    return {
      eyebrow: 'APPLY · PRIVATE ROOM',
      title: 'Play with a Friend',
      subtitle: 'Take your ideas to a private heads-up table. Free play is preserved and does not provide verified training scores.'
    }
  }

  if (props.currentMode === 'hva') {
    return {
      eyebrow: 'APPLY · BYOK AI',
      title: 'Play against AI',
      subtitle: 'Experiment at an LLM-powered table with your own key. AI play is optional and does not define range or math truth.'
    }
  }

  return {
    eyebrow: 'POSTSOMA · ALLIN · DECISION TRAINER',
    title: 'Build poker intuition, one decision at a time.',
    subtitle: 'See the range, price the risk, and learn how strong decisions compound into long-term EV—then apply them at a table.'
  }
})
</script>

<style scoped>
.header-section {
  text-align: center;
  margin: 0 auto clamp(1.35rem, 3vw, 2rem);
  position: relative;
  max-width: 920px;
  z-index: 1;
}

.eyebrow {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.7rem;
}

.main-title {
  font-size: clamp(2.15rem, 5.8vw, 4.35rem);
  color: var(--text-primary);
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 850;
  letter-spacing: 0;
  line-height: 1.02;
}

.subtitle {
  color: var(--text-secondary);
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.65;
  max-width: 620px;
  margin: 0 auto;
}

.subtitle-cn {
  color: var(--accent-primary-strong);
  font-size: clamp(0.9rem, 1.8vw, 1.02rem);
  line-height: 1.55;
  margin: 0.45rem auto 0;
}

.mode-navigation {
  height: 40px;
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

@media (max-width: 520px) {
  .main-title {
    font-size: clamp(2rem, 12vw, 3rem);
  }

  .subtitle {
    font-size: 0.95rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gto-entry-btn,
  .gto-icon,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }

  .gto-entry-btn:hover,
  .gto-entry-btn:active,
  .gto-entry-btn:hover .gto-icon {
    transform: none;
  }
}

.back-btn {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.9rem;
  min-height: 44px;
}
.back-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-muted);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* GTO Entry Button Styles */
.gto-entry-wrapper {
  margin-top: 1.4rem;
  display: flex;
  justify-content: center;
}

.gto-entry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(217, 173, 88, 0.03);
  border: 1px solid rgba(217, 173, 88, 0.16);
  color: var(--accent-primary-strong);
  font-weight: 800;
  font-size: 0.82rem;
  padding: 0.5rem 1.15rem;
  min-height: 44px;
  border-radius: var(--radius-pill);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  touch-action: manipulation;
}

.gto-entry-btn:hover {
  background: rgba(217, 173, 88, 0.1);
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 0 16px rgba(217, 173, 88, 0.16);
  color: var(--text-primary);
}

.gto-entry-btn:active {
  transform: translateY(-0.5px);
  background: rgba(217, 173, 88, 0.14);
}

.gto-icon {
  width: 14px;
  height: 14px;
  opacity: 0.8;
  transition: transform 0.2s ease;
}

.gto-entry-btn:hover .gto-icon {
  opacity: 1;
  transform: rotate(15deg) scale(1.08);
}
</style>
