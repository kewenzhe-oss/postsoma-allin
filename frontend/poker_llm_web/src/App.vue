<script setup>
import { RouterView } from 'vue-router'
import { ElConfigProvider } from 'element-plus'
// import { zhCn } from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <el-config-provider >
    <div class="app-container">
      <RouterView />
      <div class="global-signature">postsoma-2050</div>
    </div>
  </el-config-provider>
</template>

<style>
.app-container {
  min-height: 100vh;
  overflow-x: hidden;
}

.global-signature {
  position: fixed;
  right: 14px;
  bottom: 10px;
  z-index: 9999;
  pointer-events: none;
  font-family: var(--font-family-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  opacity: 0.22;
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
