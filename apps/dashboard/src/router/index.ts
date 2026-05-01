import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/entries' },
    {
      path: '/entries',
      component: () => import('@/pages/EntriesPage.vue'),
    },
  ],
})

export default router
