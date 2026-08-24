<template>
  <div class="header-section">
    <div class="brand-signature">POSTSOMA-2050</div>
    <div class="eyebrow">{{ headerContent.eyebrow }}</div>
    <h1 class="main-title">{{ headerContent.title }}</h1>
    <p class="subtitle">{{ headerContent.subtitle }}</p>
    
    <!-- Primary learning CTA -->
    <div class="gto-entry-wrapper" v-if="currentMode === 'select'">
      <button class="gto-entry-btn" @click="$emit('open-ranges')">
        <svg class="gto-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        {{ copy.primaryCta }}
      </button>
    </div>

    <transition name="fade">
      <div v-if="currentMode !== 'select'" class="mode-navigation">
        <el-button 
          @click="$emit('back')" 
          class="back-btn" 
          text
        >
          <el-icon><ArrowLeft /></el-icon> {{ copy.back }}
        </el-button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { isZh } from '@/i18n/locale.js'

const props = defineProps({
  currentMode: {
    type: String,
    required: true
  }
})

defineEmits(['back', 'open-ranges'])

const copy = computed(() => isZh.value
  ? {
      primaryCta: '查看五问流程',
      back: '返回首页'
    }
  : {
      primaryCta: 'Explore the five-question flow',
      back: 'Back to home'
    })

const headerContent = computed(() => {
  if (props.currentMode === 'hvh') {
    return isZh.value
      ? {
          eyebrow: '应用 · 私人房间',
          title: '和朋友对局',
          subtitle: '把五问带进私人单挑牌桌。这里是自由对局，不提供已验证的训练评分。'
        }
      : {
          eyebrow: 'APPLY · PRIVATE ROOM',
          title: 'Play with a Friend',
          subtitle: 'Take the five questions to a private heads-up table. This is free play with no verified training score.'
        }
  }

  if (props.currentMode === 'hva') {
    return isZh.value
      ? {
          eyebrow: '应用 · BYOK AI',
          title: '和自己的 AI 练习',
          subtitle: '使用自己的 API Key 在 LLM 牌桌中自由实验。AI 不是范围或数学真值的裁判。'
        }
      : {
          eyebrow: 'APPLY · BYOK AI',
          title: 'Practice with your AI',
          subtitle: 'Experiment at an LLM-powered table with your own key. AI does not define range or math truth.'
        }
  }

  return isZh.value
      ? {
        eyebrow: 'ALLIN · 扑克决策思考工具',
        title: '先看懂局面，再寻找答案。',
        subtitle: '用 Hand、Context、Range、Price、Risk 五个问题，建立每次扑克决定前的思考习惯。'
      }
      : {
        eyebrow: 'ALLIN · DECISION THINKING TOOL',
        title: 'Understand the spot before searching for an answer.',
        subtitle: 'Use Hand, Context, Range, Price, and Risk to build a repeatable thinking habit before every poker decision.'
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

.brand-signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: fit-content;
  margin: 0 auto 0.55rem;
  color: #D4A54A;
  font-family: var(--font-family-mono);
  font-size: 10px;
  font-weight: 760;
  letter-spacing: 0.16em;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
}

.brand-signature::after {
  content: '';
  width: 48px;
  height: 1px;
  margin-top: 0.5rem;
  background: #F0CD7A;
}

.eyebrow {
  color: var(--accent-primary);
  font-size: max(var(--font-size-meta), 11px);
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

/* Primary learning CTA */
.gto-entry-wrapper {
  margin-top: 1.4rem;
  display: flex;
  justify-content: center;
}

.gto-entry-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: var(--text-inverse);
  font-weight: 800;
  font-size: 0.82rem;
  padding: 0.7rem 1.25rem;
  min-height: 48px;
  border-radius: var(--radius-pill);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  touch-action: manipulation;
}

.gto-entry-btn:hover {
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border-color: var(--accent-primary);
  transform: translateY(-2px);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.4),
    0 0 16px rgba(217, 173, 88, 0.16);
  color: var(--text-inverse);
}

.gto-entry-btn:active {
  transform: translateY(-0.5px);
  filter: brightness(0.96);
}

.gto-entry-btn:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 3px;
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
