<template>
  <div
    class="locale-switcher"
    role="group"
    :aria-label="copy.groupLabel"
  >
    <button
      type="button"
      class="locale-option"
      :class="{ active: isZh }"
      :aria-pressed="isZh"
      :aria-label="copy.zhLabel"
      @click="setLocale('zh-CN')"
    >
      中文
    </button>
    <span class="locale-divider" aria-hidden="true">|</span>
    <button
      type="button"
      class="locale-option"
      :class="{ active: !isZh }"
      :aria-pressed="!isZh"
      :aria-label="copy.enLabel"
      @click="setLocale('en')"
    >
      EN
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isZh, setLocale } from '@/i18n/locale.js'

const copy = computed(() => isZh.value
  ? {
      groupLabel: '界面语言',
      zhLabel: '使用简体中文',
      enLabel: 'Switch to English'
    }
  : {
      groupLabel: 'Interface language',
      zhLabel: '切换到简体中文',
      enLabel: 'Use English'
    })
</script>

<style scoped>
.locale-switcher {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 2px;
  color: var(--text-tertiary);
  background: rgba(8, 11, 15, 0.72);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  backdrop-filter: blur(14px);
}

.locale-option {
  min-width: 44px;
  min-height: 44px;
  padding: 0 0.7rem;
  color: var(--text-tertiary);
  background: transparent;
  border: 0;
  border-radius: var(--radius-pill);
  font: inherit;
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0.04em;
  cursor: pointer;
  touch-action: manipulation;
}

.locale-option:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}

.locale-option.active {
  color: var(--text-inverse);
  background: var(--accent-primary-strong);
}

.locale-option:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 2px;
}

.locale-divider {
  color: var(--border-strong);
  user-select: none;
}

@media (prefers-reduced-motion: reduce) {
  .locale-option {
    transition: none;
  }
}
</style>
