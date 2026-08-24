<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useRoute } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
import en from 'element-plus/es/locale/lang/en'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { isZh, locale } from '@/i18n/locale.js'
import { getPageSeo } from '@/seo/siteMetadata.js'
import { usePageSeo } from '@/composables/usePageSeo.js'

const route = useRoute()
const elementLocale = computed(() => isZh.value ? zhCn : en)
const showAppLocaleSwitcher = computed(() => route.name !== 'Room')
const pageSeo = computed(() => getPageSeo({ routeName: route.name, locale: locale.value }))
const utilityLink = computed(() => route.name === 'About'
  ? { to: '/', label: isZh.value ? '首页' : 'Home' }
  : { to: '/about', label: isZh.value ? '方法与边界' : 'Method & limits' })

usePageSeo(pageSeo)
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <div class="app-container">
      <div v-if="showAppLocaleSwitcher" class="app-locale-slot">
        <RouterLink class="app-utility-link" :to="utilityLink.to">
          {{ utilityLink.label }}
        </RouterLink>
        <LocaleSwitcher />
      </div>
      <RouterView />
      <div class="global-signature">POSTSOMA-2050</div>
    </div>
  </el-config-provider>
</template>

<style>
.app-container {
  min-height: 100vh;
  overflow-x: hidden;
}

.app-locale-slot {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  right: max(20px, env(safe-area-inset-right));
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-utility-link {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0 0.72rem;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  text-decoration: none;
  background: rgba(7, 5, 4, 0.72);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
}

.app-utility-link:hover {
  color: var(--accent-primary-strong);
  border-color: var(--border-strong);
}

.app-utility-link:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
}

@media (max-width: 520px) {
  .app-locale-slot {
    top: max(10px, env(safe-area-inset-top));
    right: max(12px, env(safe-area-inset-right));
  }
}

.global-signature {
  position: fixed;
  right: 14px;
  bottom: 10px;
  z-index: 9999;
  pointer-events: none;
  font-family: var(--font-family-mono);
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.14em;
  color: #9C7330;
  opacity: 1;
  user-select: none;
}

/* 全局过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Element Plus 样式优化 */
.el-message {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.el-notification {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* 优化弹窗样式 */
.el-dialog {
  border-radius: 1rem !important;
  overflow: hidden;
}

.el-dialog__header {
  padding: 1.5rem !important;
  border-bottom: 1px solid #f0f0f0;
}

.el-dialog__body {
  padding: 1.5rem !important;
}

/* 优化标签样式 */
.el-tag {
  border-radius: 0.375rem !important;
  font-weight: 500;
}

/* 优化滑块样式 */
.el-slider__runway {
  background-color: #f0f0f0 !important;
}

.el-slider__bar {
  background: linear-gradient(90deg, var(--accent-primary-strong) 0%, var(--accent-primary) 100%) !important;
}

.el-slider__button {
  border: 2px solid var(--accent-primary) !important;
}

/* 优化折叠面板样式 */
.el-collapse {
  border: none !important;
}

.el-collapse-item__header {
  font-weight: 500 !important;
}

/* 优化上传组件样式 */
.el-upload-dragger {
  border-radius: 1rem !important;
}

/* 优化空状态样式 */
.el-empty {
  padding: 2rem !important;
}

/* 优化结果页样式 */
.el-result {
  padding: 2rem !important;
}
</style>
