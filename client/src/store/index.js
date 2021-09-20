import Vue from 'vue';
import Vuex from 'vuex';
import Clipboard from 'v-clipboard';
import VueHead from 'vue-head';

Vue.use(Vuex);
Vue.use(Clipboard);
Vue.use(VueHead);

export const setIsAuthenticatedKey = 'setIsAuthenticated';
export const setUsernameKey = 'setUsername';

export default new Vuex.Store({
  state: {
    isAuthenticated: false,
    cookie: {
      username: '',
    },
  },
  mutations: {
    setIsAuthenticated(store, isAuthenticated) {
      store.isAuthenticated = isAuthenticated;
    },
    setUsername(store, username) {
      store.cookie.username = username;
    },
  },
  actions: {},
  modules: {},
});
