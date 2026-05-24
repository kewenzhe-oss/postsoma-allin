<template>
  <div class="header-section">
    <div class="eyebrow">POSTSOMA · ALLIN</div>
    <h1 class="main-title">
      Online Poker 1v1
    </h1>
    <p class="subtitle">Start a quick hand with a friend, or practice against an AI opponent with your own key.</p>
    
    <!-- GTO Entrance Button -->
    <div class="gto-entry-wrapper" v-if="currentMode === 'select'">
      <button class="gto-entry-btn" @click="$emit('open-ranges')">
        <svg class="gto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        1v1 Tactical Handbook
      </button>
    </div>

    <div class="mode-navigation">
      <transition name="fade">
        <el-button 
          v-if="currentMode !== 'select'" 
          @click="$emit('back')" 
          class="back-btn" 
          text
        >
          <el-icon><ArrowLeft /></el-icon> Back to modes
        </el-button>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'

defineProps({
  currentMode: {
    type: String,
    required: true
  }
})

defineEmits(['back', 'open-ranges'])
</script>

<style scoped>
.header-section {
  text-align: center;
  margin: 0 auto clamp(2rem, 5vw, 3.5rem);
  position: relative;
  max-width: 780px;
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
  font-size: var(--font-size-title);
  color: var(--text-primary);
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 850;
  letter-spacing: 0;
  line-height: 0.95;
}

.subtitle {
  color: var(--text-secondary);
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.65;
  max-width: 620px;
  margin: 0 auto;
}

.mode-navigation {
  height: 40px;
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.back-btn {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.9rem;
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
  border-radius: var(--radius-pill);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
