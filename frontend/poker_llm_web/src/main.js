import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { initAnalytics, trackPageView } from './services/analyticsService'
import './style.css'

const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

initAnalytics()

router.afterEach((to) => {
  nextTick(() => {
    trackPageView(to.fullPath, typeof document !== 'undefined' ? document.title : undefined)
  })
})

app.mount('#app')
