import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/about',
    alias: '/about/',
    name: 'About',
    component: () => import('@/views/About.vue')
  },
  {
    path: '/room/:id',
    name: 'Room',
    meta: { robots: 'noindex' },
    component: () => import('@/views/Room.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
