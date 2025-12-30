import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/materials',
      name: 'materials',
      component: () => import('../views/MaterialsView.vue')
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/database-test',
      name: 'database-test',
      component: () => import('../views/DatabaseTestView.vue')
    },
    {
      path: '/unit-converter-test',
      name: 'unit-converter-test',
      component: () => import('../views/UnitConverterTestView.vue')
    },
    {
      path: '/bom-editor',
      name: 'bom-editor',
      component: () => import('../views/BomEditorView.vue')
    },
    {
      path: '/calculator',
      name: 'calculator',
      component: () => import('../views/CalculatorView.vue')
    }
  ]
})

export default router
