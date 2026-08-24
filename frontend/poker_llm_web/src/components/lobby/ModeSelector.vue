<template>
  <div
    class="mode-selector"
    :class="{ compact, 'with-quick-practice': showQuickPractice }"
  >
    <button
      v-if="showQuickPractice"
      type="button"
      class="mode-card quick-card"
      :aria-label="copy.quickAria"
      disabled
    >
      <div class="card-content">
        <div class="icon-wrapper quick-icon">
          <span class="mode-icon">BOT</span>
        </div>
        <span class="mode-kicker">{{ copy.quickKicker }}</span>
        <span class="mode-title" role="heading" :aria-level="headingLevel">{{ copy.quickTitle }}</span>
        <p>{{ copy.quickDetail }}</p>
        <span class="mode-cta coming-soon">{{ copy.comingSoon }}</span>
      </div>
    </button>

    <button class="mode-card hvh-card" :aria-label="copy.friendAria" @click="$emit('select-mode', 'hvh')">
      <div class="card-content">
        <div class="icon-wrapper">
          <span class="mode-icon">2P</span>
        </div>
          <span class="mode-kicker">{{ copy.friendKicker }}</span>
          <span class="mode-title" role="heading" :aria-level="headingLevel">{{ copy.friendTitle }}</span>
        <p>{{ copy.friendDetail }}</p>
        <span class="mode-cta">{{ copy.friendCta }}</span>
      </div>
    </button>
    
    <button class="mode-card ai-card" :aria-label="copy.aiAria" @click="$emit('select-mode', 'hva')">
      <div class="card-content">
        <div class="icon-wrapper ai-icon">
          <span class="mode-icon">AI</span>
        </div>
          <span class="mode-kicker">{{ copy.aiKicker }}</span>
        <span class="mode-title" role="heading" :aria-level="headingLevel">{{ copy.aiTitle }} <span class="beta-badge">BYOK</span></span>
        <p>{{ copy.aiDetail }}</p>
        <span class="mode-cta">{{ copy.aiCta }}</span>
      </div>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isZh } from '@/i18n/locale.js'

defineProps({
  compact: {
    type: Boolean,
    default: false
  },
  showQuickPractice: {
    type: Boolean,
    default: false
  },
  headingLevel: {
    type: Number,
    default: 3,
    validator: (value) => [3, 4, 5].includes(value)
  }
})

defineEmits(['select-mode'])

const copy = computed(() => isZh.value
  ? {
      quickAria: '规则 Bot 快速练习即将推出',
      quickKicker: '规则 Bot · 快速练习',
      quickTitle: '快速练习',
      quickDetail: '当前版本没有可复用的轻量本地规则 Bot。这条无需 API 的练习路径即将推出。',
      comingSoon: '即将推出',
      friendAria: '打开私人房间设置',
      friendKicker: '自由对局 · 无已验证训练评分',
      friendTitle: '和朋友对局',
      friendDetail: '在私人 1v1 牌桌中应用五问。朋友意见和单手结果都不是训练裁判。',
      friendCta: '创建或加入房间',
      aiAria: '打开 BYOK AI 对局设置',
      aiKicker: '自由对局 · AI 实验台 · BYOK',
      aiTitle: '和自己的 AI 练习',
      aiDetail: '使用自己的 API Key 与 LLM 对手自由实验。这里不提供已验证训练评分，AI 不是训练裁判。',
      aiCta: '设置 AI 对局'
    }
  : {
      quickAria: 'Quick Practice rule bot is coming soon',
      quickKicker: 'RULE BOT · QUICK PRACTICE',
      quickTitle: 'Quick Practice',
      quickDetail: 'No lightweight local rule bot exists in this build. This no-API practice path is coming soon.',
      comingSoon: 'Coming soon',
      friendAria: 'Open private room setup',
      friendKicker: 'FREE PLAY · NO VERIFIED TRAINING SCORE',
      friendTitle: 'Play with a Friend',
      friendDetail: 'Use the five questions at a private 1v1 table. Your friend and one hand result are not training judges.',
      friendCta: 'Host or join',
      aiAria: 'Open BYOK AI match setup',
      aiKicker: 'FREE PLAY · AI SANDBOX · BYOK',
      aiTitle: 'Practice with your AI',
      aiDetail: 'Bring your own key and experiment against an LLM opponent. No verified training score; AI is not the training judge.',
      aiCta: 'Set up AI match'
    })
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

.mode-selector.with-quick-practice {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.mode-card {
  min-height: 220px;
  background:
    linear-gradient(180deg, rgba(217, 173, 88, 0.08), rgba(255, 255, 255, 0.018)),
    var(--bg-panel-solid);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: clamp(1.2rem, 3vw, 1.6rem);
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
  touch-action: manipulation;
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

.mode-card:disabled {
  cursor: not-allowed;
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

.quick-card {
  border-style: dashed;
  box-shadow: none;
  opacity: 0.78;
}

.quick-card::before {
  background: radial-gradient(ellipse at center, rgba(31, 122, 79, 0.18), transparent 62%);
}

.quick-card:hover {
  transform: none;
  border-color: var(--border-subtle);
  box-shadow: none;
}

.quick-card:hover::before,
.quick-card:hover .icon-wrapper {
  transform: none;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
  flex: 1;
}

.icon-wrapper {
  width: 52px;
  height: 52px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 1rem;
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

.mode-title {
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
  padding-top: 1.35rem;
}

.coming-soon {
  color: var(--text-tertiary);
}

.mode-selector.compact .mode-card {
  min-height: 188px;
  padding: 1rem;
}

.mode-selector.compact .icon-wrapper {
  width: 44px;
  height: 44px;
  margin-bottom: 0.75rem;
  border-radius: 12px;
}

.mode-selector.compact .mode-icon {
  font-size: 0.95rem;
}

.mode-selector.compact .mode-title {
  margin-bottom: 0.6rem;
  font-size: 1.08rem;
}

.mode-selector.compact p {
  max-width: none;
  font-size: 0.8rem;
  line-height: 1.5;
}

.mode-selector.compact .mode-cta {
  padding-top: 0.9rem;
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .mode-selector.with-quick-practice {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .mode-selector {
    grid-template-columns: 1fr;
  }

  .mode-card {
    min-height: 200px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mode-card,
  .mode-card::before,
  .icon-wrapper {
    transition: none;
  }

  .mode-card:hover,
  .mode-card:hover::before,
  .mode-card:hover .icon-wrapper {
    transform: none;
  }
}
</style>
