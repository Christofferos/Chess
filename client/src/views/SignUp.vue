<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <h1 class="login-title">Register account</h1>
    <div id="statusSuccess" class="badge green"></div>
    <h4 class="login-status"></h4>
    <form class="account-form" v-on:submit.prevent="signUp()">
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
      <div id="statusFail" v-if="success === false" class="badge red">Username already taken!</div>
      <input
        class="btn btn-default login-button"
        type="submit"
        value="Sign up"
        style="margin-top: 20px"
      />
    </form>
  </div>
</template>

<script>
import { setIsAuthenticatedKey, setUsernameKey } from '../store/index';
import { preFetchSocket } from '../utils/preFetchSocket';

export default {
  name: 'SignUp',
  components: {},
  data: () => ({
    username: '',
    password: '',
    success: true,
    socket: preFetchSocket(true),
  }),
  methods: {
    signUp() {
      fetch('/api/signUp', {
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
            this.$router.push({
              path: 'signUp',
            });
            throw new Error(resp.text);
          }
          return resp.json();
        })
        .then((data) => {
          if (!data.success) {
            this.success = false;
            return;
          }
          this.socket.emit('signInAuthenticate', this.username);
          this.$store.commit(setIsAuthenticatedKey, true);
          this.$store.commit(setUsernameKey, this.username);
          this.$router.push({
            path: 'profile',
          });
        })
        .catch((error) => {
          throw new Error(`Authentication failed unexpectedly ${error}`);
        });
    },
  },
};
</script>

<style>
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
