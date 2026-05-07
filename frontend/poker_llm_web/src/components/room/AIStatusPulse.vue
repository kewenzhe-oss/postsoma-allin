<template>
  <div class="ai-status-pulse">
    <div class="pulse-ring"></div>
    <div class="pulse-ring delay"></div>
    <div class="status-content">
      <span class="text">AI is thinking</span>
      <span class="dots"><span>.</span><span>.</span><span>.</span></span>
    </div>
  </div>
</template>

<style scoped>
.ai-status-pulse {
  position: absolute;
  top: -44px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(18, 27, 33, 0.92);
  border: 1px solid rgba(217, 173, 88, 0.35);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-pill);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 50;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  border-radius: var(--radius-pill);
  border: 2px solid var(--accent-primary);
  opacity: 0;
  animation: pulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  pointer-events: none;
}

.pulse-ring.delay {
  animation-delay: 1s;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent-turn);
  font-weight: 850;
  font-size: 0.9rem;
}

.dots span {
  animation: blink 1.4s infinite both;
}

.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

@keyframes blink {
  0%, 100% { opacity: 0.2; }
  20% { opacity: 1; }
}
</style>
