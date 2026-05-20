import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ItemsView from '../views/ItemsView.vue'
import ItemFormView from '../views/ItemFormView.vue'
import ItemDetailView from '../views/ItemDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/items',
      name: 'items',
      component: ItemsView,
    },
    {
      path: '/items/new',
      name: 'item-new',
      component: ItemFormView,
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
    },
  ],
})

export default router