import Vue from 'vue';
import VueRouter from 'vue-router';

import ListView from '../views/List.vue';
import RoomView from '../views/Room.vue';
import LoginView from '../views/Login.vue';
import ProfileView from '../views/Profile.vue';
import SignUp from '../views/SignUp.vue';
import store, { setIsAuthenticatedKey, setSocket } from '../store';
import { preFetchSocket } from '../utils/preFetchSocket.js';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/list' },
  { path: '/list', component: ListView },
  { path: '/room/:roomName', component: RoomView },
  { path: '/login', component: LoginView },
  { path: '/profile', component: ProfileView },
  { path: '/signUp', component: SignUp },
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
});

// Setup Authentication Guard
router.beforeEach(async (to, from, next) => {
  const { isAuthenticated } = await fetch('/api/isAuthenticated')
    .then((resp) => {
      if (!resp.ok) return;
      return resp.json();
    })
    .catch((err) => {
      throw new Error(`Authentication Middleware Error: ${err}`);
    });
  store.commit(setSocket, preFetchSocket(isAuthenticated));
  store.commit(setIsAuthenticatedKey, isAuthenticated);
  const isUserAuthenticated = store.state.isAuthenticated;
  if (!isUserAuthenticated && to.path !== '/login' && to.path !== '/signUp') {
    next('/login');
  } else if (isUserAuthenticated && to.path === '/login') {
    next('/profile');
  } else {
    next();
  }
});

export default router;
