<template>
  <div class="mode-selector">
    <button class="mode-card hvh-card" @click="$emit('select-mode', 'hvh')">
      <div class="card-content">
        <div class="icon-wrapper">
          <span class="mode-icon">2P</span>
        </div>
        <span class="mode-kicker">Private room</span>
        <h2>Play with a Friend</h2>
        <p>Create or join a cozy 1v1 table and send the invite.</p>
        <span class="mode-cta">Host or join</span>
      </div>
    </button>
    
    <button class="mode-card ai-card" @click="$emit('select-mode', 'hva')">
      <div class="card-content">
        <div class="icon-wrapper ai-icon">
          <span class="mode-icon">AI</span>
        </div>
        <span class="mode-kicker">Practice table</span>
        <h2>Play against AI <span class="beta-badge">BYOK</span></h2>
        <p>Bring your own key and play a few hands against an LLM opponent.</p>
        <span class="mode-cta">Set up AI match</span>
      </div>
    </button>
  </div>
</template>

<script setup>
defineEmits(['select-mode'])
</script>

<style scoped>
.mode-selector {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  justify-content: center;
  gap: clamp(1rem, 3vw, 1.5rem);
  max-width: 920px;
  margin: 0 auto;
  width: 100%;
}

.mode-card {
  min-height: 300px;
  background:
    linear-gradient(180deg, rgba(217, 173, 88, 0.08), rgba(255, 255, 255, 0.018)),
    var(--bg-panel-solid);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: clamp(1.4rem, 4vw, 2rem);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  position: relative;
  overflow: hidden;
  color: inherit;
}

.mode-card::before {
  content: '';
  position: absolute;
  inset: auto -20% -55% -20%;
  height: 70%;
  background: radial-gradient(ellipse at center, rgba(217, 173, 88, 0.16), transparent 62%);
  transition: transform 0.35s ease, opacity 0.35s ease;
  opacity: 0.75;
}

.mode-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-strong);
}

.mode-card:hover::before {
  transform: translateY(-8px);
  opacity: 1;
}

.hvh-card:hover {
  border-color: rgba(180, 69, 63, 0.42);
}

.ai-card:hover {
  border-color: rgba(217, 173, 88, 0.42);
}

.hvh-card::before {
  background: radial-gradient(ellipse at center, rgba(101, 28, 32, 0.3), transparent 62%);
}

.ai-card::before {
  background: radial-gradient(ellipse at center, rgba(217, 173, 88, 0.2), transparent 62%);
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 1.4rem;
  border: 1px solid var(--border-subtle);
  transition: transform 0.3s ease;
}

.mode-card:hover .icon-wrapper {
  transform: translateY(-2px) rotate(-2deg);
  background: rgba(255, 255, 255, 0.1);
}

.mode-icon {
  color: var(--text-primary);
  font-size: 1.2rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.mode-kicker {
  color: var(--text-tertiary);
  font-size: var(--font-size-meta);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.45rem;
}

h2 {
  font-size: clamp(1.45rem, 3vw, 1.75rem);
  color: var(--text-primary);
  margin: 0 0 0.85rem 0;
  font-weight: 820;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  flex-wrap: wrap;
}

p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-size: 1rem;
  max-width: 30ch;
}

.beta-badge {
  font-size: 0.75rem;
  background: rgba(217, 173, 88, 0.12);
  color: var(--accent-turn);
  padding: 0.22rem 0.5rem;
  border-radius: var(--radius-pill);
  font-weight: 800;
  vertical-align: middle;
  border: 1px solid rgba(217, 173, 88, 0.26);
}

.mode-cta {
  margin-top: auto;
  color: var(--text-primary);
  font-size: 0.94rem;
  font-weight: 800;
  padding-top: 2rem;
}

@media (max-width: 760px) {
  .mode-selector {
    grid-template-columns: 1fr;
  }

  .mode-card {
    min-height: 240px;
  }
}
</style>
