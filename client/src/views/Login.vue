<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <h1 class="login-title">Sign in</h1>
    <div id="statusSuccess" class="badge green"></div>
    <h4 class="login-status"></h4>

    <form class="account-form" v-on:submit.prevent="done()">
      <input
        class="form-control"
        type="text"
        v-model="username"
        required
        autofocus
        placeholder="Username"
      />
      <input
        class="form-control"
        type="password"
        v-model="password"
        required
        autofocus
        placeholder="Password"
      />
      <div id="statusFail" class="badge red"></div>
      <input class="btn btn-default login-button" type="submit" value="Sign in" />
    </form>
    <input
      class="btn btn-default login-button"
      type="button"
      value="Register account"
      style="margin-top: 20px"
      v-on:click="redirect('/signUp')"
    />

    <div
      class="modal"
      v-bind:style="{
        display: this.isSignInFail ? 'flex' : 'none',
      }"
      type="text"
    >
      <input
        v-bind:value="'Create Account'"
        class="well btn btn-default button"
        @click="
          () => {
            redirectSignUp();
          }
        "
        type="button"
        style="margin-top:20px"
      />
      <input
        class="well btn btn-default button"
        @click="
          () => {
            this.isSignInFail = false;
          }
        "
        type="button"
        value="Cancel"
      />
    </div>
  </div>
</template>

<script>
import store, {
  addOnlineUser,
  removeOnlineUser,
  setIsAuthenticatedKey,
  setSocket,
  setUsernameKey,
} from '../store/index';
import { preFetchSocket } from '../utils/preFetchSocket';

export default {
  name: 'Login',
  components: {},
  data: () => ({
    username: '',
    password: '',
    socket: preFetchSocket(true),
    isSignInFail: false,
  }),
  methods: {
    redirect(target) {
      this.$router.push(target);
    },
    redirectSignUp() {
      this.$router.push('/signUp');
    },
    done() {
      fetch('/api/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      })
        .then((resp) => {
          if (!resp.ok) {
            this.$store.commit(setIsAuthenticatedKey, false);
            /* this.$router.push({
              path: 'login',
            }); */
            this.isSignInFail = true;
            throw new Error(resp.text);
          }
          return resp;
        })
        .then(() => {
          this.socket.emit('signInAuthenticate', this.username);
          this.$store.commit(setIsAuthenticatedKey, true);
          this.$store.commit(setUsernameKey, this.username);
          this.$router.push({
            path: 'profile',
          });
        })
        .catch(() => {
          console.log(`Sign in authentication failed`);
        });
    },
  },
};
</script>

<style>
.modal {
  position: absolute;
  flex-direction: column;
  top: 0%;
  right: 0%;
  width: 100%;
  height: 50vw;
  background-color: rgba(205, 133, 63, 0.6);
  z-index: 11;
  align-items: center;
  justify-content: center;
}
.login-title {
  color: white;
}

.form-control {
  margin-bottom: 20px;
  width: 200px;
  padding: 5px;
  line-height: 20px;
  font-weight: bold;
  font-size: 2rem;
  text-align: center;
}

.account-form {
  display: flex;
  flex-direction: column;
  margin: 0;
  align-items: center;
  justify-content: center;
}

.login-button {
  background: #7fa650;
  font-size: 2.2rem;
  font-weight: 600;
  line-height: 1.2;
  color: white;
  width: 200px;
  border: none;
}
.login-button:hover {
  background: #95bb4a;
  color: white;
}
</style>
