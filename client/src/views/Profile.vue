<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <h1 style="color: white">Welcome</h1>
    <img src="../assets/default-profile.jpg" style="width: 150px" />
    <h2 style="color: white">
      {{ capitalizeFirstLetter(currentlyLoggedIn) }}
    </h2>
    <h4 style="color: white">
      Experience Score: {{ matches !== undefined ? matches.length : '' }}
    </h4>

    <input
      class="btn btn-default login-button"
      type="button"
      value="Sign out"
      style="margin-top: 10px; margin-bottom: 10px"
      v-on:click="signOut()"
    />

    <div
      style="border: 2px solid black; width: 350px; margin: 75px auto 25px auto;
           background: #504F4C; border-radius: 5px; padding-bottom: 20px;"
    >
      <h1 style="color: white">Match History:</h1>
      <table style="width:95%; margin: auto; text-align: center">
        <!-- Map over history with table rows -->
        <tr>
          <th>Result</th>
          <th>Opponent</th>
          <th>Nr of Moves</th>
          <th>Date</th>
        </tr>
        <template v-for="(match, id) in matches">
          <tr
            :key="id"
            v-bind:style="{ color: match.winner === currentlyLoggedIn ? 'green' : 'red' }"
          >
            <td>
              {{ match.winner === currentlyLoggedIn ? 'Win' : 'Loss' }}
            </td>
            <td>{{ match.opponent }}</td>
            <td>{{ match.nrMoves }}</td>
            <td>{{ match.date }}</td>
          </tr>
        </template>
      </table>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

import {
  IO_RECONNECTION_URL,
  IS_RECONNECTION_ENABLED,
  RECONNECT_DELAY_MIN,
  RECONNECT_DELAY_MAX,
} from '../constants';

export default {
  name: 'Profile',
  components: {},
  data() {
    return {
      currentlyLoggedIn: '',
      success: true,
      matches: [],
      socket: null,
    };
  },
  created() {
    this.currentlyLoggedIn = this.$store.state.cookie.username;
    this.$root.socket = this.$store.state.isAuthenticated
      ? io().connect(IO_RECONNECTION_URL, {
          reconnection: IS_RECONNECTION_ENABLED,
          reconnectionDelay: RECONNECT_DELAY_MIN,
          reconnectionDelayMax: RECONNECT_DELAY_MAX,
          reconnectionAttempts: Infinity,
        })
      : '';
    this.socket = this.$root.socket;

    fetch(`/api/matchHistory/${this.currentlyLoggedIn}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error('Match history response failed');
        }
        return resp.json();
      })
      .then((data) => {
        this.matches = data.matchHistory;
      })
      .catch((error) => {
        throw new Error(`Match History request failed ${error}`);
      });
  },
  methods: {
    capitalizeFirstLetter(inputStr) {
      return inputStr.charAt(0).toUpperCase() + inputStr.slice(1);
    },
    signOut() {
      fetch('/api/signOut', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(() => {
          this.$store.commit('setIsAuthenticated', false);
          this.$store.commit('setUsername', '');
          this.$router.push({
            path: 'login',
          });
        })
        .catch((error) => {
          throw new Error(`SignOut request failed ${error}`);
        });
    },
  },
};
</script>
