<template>
  <div class="header-section">
    <div class="eyebrow">POSTSOMA · ALLIN</div>
    <h1 class="main-title">
      Online Poker 1v1
    </h1>
    <p class="subtitle">Start a quick hand with a friend, or practice against an AI opponent with your own key.</p>
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

defineEmits(['back'])
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
</style>
