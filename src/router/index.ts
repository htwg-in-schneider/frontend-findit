import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '@auth0/auth0-vue'
import { AUTH_ENABLED } from '../config/auth'
import { useAuthStore } from '../stores/authStores'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ItemsView from '../views/ItemsView.vue'
import ItemDetailView from '../views/ItemDetailView.vue'
import ItemFormView from '../views/ItemFormView.vue'
import MapView from '../views/MapView.vue'
import ProfileView from '../views/ProfileView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminCategoriesView from '../views/AdminCategoriesView.vue'
import AdminContactRequestsView from '../views/AdminContactRequestsView.vue'
import ImprintView from '../views/ImprintView.vue'
import PrivacyView from '../views/PrivacyView.vue'

const authGuardConfig = AUTH_ENABLED
  ? {
      beforeEnter: authGuard,
    }
  : {}

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
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: {
        requiresAuth: true,
      },
      ...authGuardConfig,
    },
    {
      path: '/items',
      name: 'items',
      component: ItemsView,
    },
    {
      path: '/items/new',
      name: 'item-create',
      component: ItemFormView,
      meta: {
        requiresAuth: true,
      },
      ...authGuardConfig,
    },
    {
      path: '/items/:id',
      name: 'item-detail',
      component: ItemDetailView,
      props: true,
    },
    {
      path: '/items/:id/edit',
      name: 'item-edit',
      component: ItemFormView,
      props: true,
      meta: {
        requiresAuth: true,
      },
      ...authGuardConfig,
    },
    {
      path: '/map',
      name: 'map',
      component: MapView,
    },
    {
      path: '/admin',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
      ...authGuardConfig,
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: AdminUsersView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
      ...authGuardConfig,
    },
    {
      path: '/admin/categories',
      name: 'admin-categories',
      component: AdminCategoriesView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
      ...authGuardConfig,
    },
    {
      path: '/admin/contact-requests',
      name: 'admin-contact-requests',
      component: AdminContactRequestsView,
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
      ...authGuardConfig,
    },
    {
      path: '/impressum',
      name: 'imprint',
      component: ImprintView,
    },
    {
      path: '/datenschutz',
      name: 'privacy',
      component: PrivacyView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)

  if (AUTH_ENABLED) {
    return true
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (requiresAdmin && !authStore.isAdmin) {
    return {
      path: '/items',
    }
  }

  return true
})

export default router