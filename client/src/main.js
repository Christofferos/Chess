import Vue from 'vue';

import App from './App.vue';
import router from './router';
import store, { setIsAuthenticatedKey, setSocket, setUsernameKey } from './store';
import { APP_ID } from './constants';
import './registerServiceWorker';

Vue.config.productionTip = false;

/* STORE.COMMIT SEEMS TO BE UNECESSARY WHEN USING: router.beforeEach in router/index  */
(async () => {
  fetch('/api/isAuthenticated')
    .then((res) => {
      if (!res.ok) return;
      return res.json();
    })
    .then(({ isAuthenticated, username }) => {
      const vueInstance = new Vue({
        router,
        store,
        render: (createApp) => {
          if (!createApp) throw new Error(`Unable to render application`);
          return createApp(App);
        },
      }).$mount(APP_ID);
      return { vueInstance, isAuthenticated, username };
    })
    .then(({ vueInstance, isAuthenticated, username }) => {
      store.commit(setIsAuthenticatedKey, isAuthenticated);
      store.commit(setUsernameKey, username);
      return;
    });
})();
