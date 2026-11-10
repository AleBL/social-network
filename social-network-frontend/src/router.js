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
  },
  {
    path: '/users/:id',
    name: 'user',
    component: () => import('./views/UserProfileView.vue'),
    // Passes :id to the view as the `id` prop.
    props: true
  },
  {
    // Accepts ?a=<id>&b=<id> to pre-select both users.
    path: '/common-friends',
    name: 'common-friends',
    component: () => import('./views/CommonFriendsView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
