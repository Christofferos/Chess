import Vue from 'vue';

import App from './App.vue';
import router from './router';
import store, { setIsAuthenticatedKey, setUsernameKey } from './store';
import { APP_ID } from './constants';

Vue.config.productionTip = false;

(async () => {
  fetch('/api/isAuthenticated')
    .then((res) => {
      if (!res.ok) return;
      return res.json();
    })
    .then(({ isAuthenticated, username }) => {
      store.commit(setIsAuthenticatedKey, isAuthenticated);
      store.commit(setUsernameKey, username);
      return;
    })
    .then(() => {
      new Vue({
        router,
        store,
        render: (createApp) => {
          if (!createApp) throw new Error(`Unable to render application`);
          return createApp(App);
        },
      }).$mount(APP_ID);
    });
})();
