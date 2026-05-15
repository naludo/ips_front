import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue')
  },
  {
    path: '/upload',
    name: 'PacketUpload',
    component: () => import('@/views/PacketUpload.vue')
  },
  {
    path: '/workflows',
    name: 'WorkflowList',
    component: () => import('@/views/WorkflowList.vue')
  },
  {
    path: '/rules/:workflowId',
    name: 'RuleList',
    component: () => import('@/views/RuleList.vue')
  },
  {
    path: '/test/:workflowId',
    name: 'TestResult',
    component: () => import('@/views/TestResult.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router