import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '../stores/authStores'
import HomeView from '../views/HomeView.vue'
import ItemsView from '../views/ItemsView.vue'
import ItemFormView from '../views/ItemFormView.vue'
import ItemDetailView from '../views/ItemDetailView.vue'
import ImprintView from '../views/ImprintView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import MapView from '../views/MapView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminContactRequestsView from '../views/AdminContactRequestsView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminCategoriesView from '../views/AdminCategoriesView.vue'
import LoginView from '../views/LoginView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}

function redirectToLogin(to: RouteLocationNormalized) {
  return {
    path: '/login',
    query: {
      redirect: to.fullPath,
    },
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }

    return {
      top: 0,
      behavior: 'smooth',
    }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/items', name: 'items', component: ItemsView },
    { path: '/map', name: 'map', component: MapView },

    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/contact-requests',
      name: 'admin-contact-requests',
      component: AdminContactRequestsView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: AdminCategoriesView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/items/new',
      name: 'item-new',
      component: ItemFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/items/:id',
      name: 'item-detail',
      component: ItemDetailView,
    },
    {
      path: '/items/:id/edit',
      name: 'item-edit',
      component: ItemFormView,
      meta: { requiresAuth: true },
    },
    { path: '/impressum', name: 'imprint', component: ImprintView },
    { path: '/datenschutz', name: 'privacy', component: PrivacyView },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return redirectToLogin(to)
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return redirectToLogin(to)
  }

  return true
})

export default router