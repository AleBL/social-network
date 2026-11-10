import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/users',
    name: 'users',
    // Loaded on demand: keeps the first page small.
    component: () => import('./views/UsersView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
