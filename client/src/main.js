import Vue from 'vue';
import io from 'socket.io-client';

import App from './App.vue';
import router from './router';
import store, { setIsAuthenticatedKey, setUsernameKey } from './store';
import {
  APP_ID,
  IO_RECONNECTION_URL,
  IS_RECONNECTION_ENABLED,
  RECONNECT_DELAY_MIN,
  RECONNECT_DELAY_MAX,
} from './constants';

Vue.config.productionTip = false;

const connectWhenAuthenticated = () => {
  if (!isAuthenticated) return '';

  return io().connect(IO_RECONNECTION_URL, {
    reconnection: IS_RECONNECTION_ENABLED,
    reconnectionDelay: RECONNECT_DELAY_MIN,
    reconnectionDelayMax: RECONNECT_DELAY_MAX,
    reconnectionAttempts: Infinity,
  });
};

(async () => {
  const { isAuthenticated, username } = await fetch('/api/isAuthenticated')
    .then((resp) => {
      if (!resp.ok) return;
      return resp.json();
    })
    .catch((err) => {
      const errorMsg = `Error when checking authentication ${err}`;
      throw new Error(errorMsg);
    });
  store.commit(setIsAuthenticatedKey, isAuthenticated);
  store.commit(setUsernameKey, username);

  new Vue({
    router,
    store,
    render: (createApp) => {
      if (!createApp) throw new Error(`Unable to render application`);
      return createApp(App);
    },
    data: {
      socket: connectWhenAuthenticated,
    },
  }).$mount(APP_ID);
})();
