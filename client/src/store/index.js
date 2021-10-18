import Vue from 'vue';
import Vuex from 'vuex';
import Clipboard from 'v-clipboard';
import VueHead from 'vue-head';

Vue.use(Vuex);
Vue.use(Clipboard);
Vue.use(VueHead);

export const setExtraSoundEffectsKey = 'setExtraSoundEffects';
export const setIsAuthenticatedKey = 'setIsAuthenticated';
export const setUsernameKey = 'setUsername';
export const setSocket = 'setSocket';
export const addOnlineUser = 'addOnlineUser';
export const removeOnlineUser = 'removeOnlineUser';

export default new Vuex.Store({
  state: {
    isAuthenticated: false,
    cookie: {
      username: '',
    },
    socket: null,
    usersOnline: [],
    extraSoundEffects: false,
  },
  mutations: {
    setIsAuthenticated(store, isAuthenticated) {
      store.isAuthenticated = isAuthenticated;
    },
    setUsername(store, username) {
      store.cookie.username = username;
    },
    setSocket(store, socket) {
      store.socket = socket;
    },
    setExtraSoundEffects(store, extraSoundEffects) {
      store.extraSoundEffects = extraSoundEffects;
    },
    addOnlineUser(store, userId) {
      const isNewOnlineUser = store.usersOnline.indexOf(userId) === -1;
      if (isNewOnlineUser) store.usersOnline.push(userId);
    },
    removeOnlineUser(store, userId) {
      const index = store.usersOnline.indexOf(userId);
      const isUserFound = index > -1;
      if (isUserFound) store.usersOnline.splice(index, 1);
      userId;
    },
  },
  actions: {},
  modules: {},
});
