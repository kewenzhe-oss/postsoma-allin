<template>
  <div class="home-container">
    <LobbyHeader 
      :currentMode="currentMode" 
      @back="currentMode = 'select'" 
      @open-ranges="showRangeViewer = true"
    />

    <div class="lobby-main">
      <transition name="fade-slide" mode="out-in">
        <!-- Layer 1: Mode Selection -->
        <ModeSelector 
          v-if="currentMode === 'select'" 
          @select-mode="handleModeSelection" 
        />

        <!-- Layer 2A: Human vs Human -->
        <HumanMatchPanel 
          v-else-if="currentMode === 'hvh'" 
        />

        <!-- Layer 2B: Human vs AI -->
        <AIMatchPanel 
          v-else-if="currentMode === 'hva'" 
        />
      </transition>
    </div>

    <!-- Teleportable Tactical Tool Modal -->
    <RangeViewerModal v-model="showRangeViewer" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LobbyHeader from '@/components/lobby/LobbyHeader.vue'
import ModeSelector from '@/components/lobby/ModeSelector.vue'
import HumanMatchPanel from '@/components/lobby/HumanMatchPanel.vue'
import AIMatchPanel from '@/components/lobby/AIMatchPanel.vue'
import RangeViewerModal from '@/components/tools/RangeViewerModal.vue'

const showRangeViewer = ref(false)

const route = useRoute()
const router = useRouter()

const currentMode = computed({
  get: () => {
    const mode = route.query.mode
    return mode === 'hvh' || mode === 'hva' ? mode : 'select'
  },
  set: (mode) => {
    if (mode === 'select') {
      router.push({ name: 'Home' })
    } else {
      router.push({ name: 'Home', query: { mode } })
    }
  }
})

const handleModeSelection = (mode) => {
  currentMode.value = mode
}
</script>

<style scoped>
.home-container {
  width: 100%;
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 3.5rem);
  font-family: var(--font-family);
  background:
    radial-gradient(circle at 50% 18%, rgba(15, 74, 50, 0.56), transparent 28rem),
    radial-gradient(circle at 16% 18%, rgba(101, 28, 32, 0.26), transparent 22rem),
    radial-gradient(circle at 84% 18%, rgba(217, 173, 88, 0.14), transparent 22rem),
    linear-gradient(180deg, rgba(0, 0, 0, 0.38), transparent 42%),
    var(--bg-app);
  color: var(--text-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.home-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(217, 173, 88, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(217, 173, 88, 0.022) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(circle at 50% 16%, black, transparent 78%);
  pointer-events: none;
}

.lobby-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  z-index: 1;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
