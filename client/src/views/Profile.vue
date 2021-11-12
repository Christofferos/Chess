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

    <div style="display:flex; flex-direction: column">
      <h4 style="color: white">
        Bonus Features:
      </h4>
      <label v-if="this.matches.length < 5" style="color: white">Unlocked after 5 games 🔒</label>
      <span v-else-if="this.matches.length >= 5" style="color: white"
        >Crazy Chess Available ✔️
        <div style="height: 5px" />
      </span>

      <label v-if="this.matches.length < 10" style="color: white"
        >Unlocked after 10 games 🔒</label
      >
      <span v-else-if="this.matches.length >= 10" style="color: white"
        >Extra Sound Effects ✔️</span
      >
      <label v-if="this.matches.length >= 10" class="ios-switch">
        <input
          type="checkbox"
          :checked="isExtraSoundEffectsEnabled ? true : false"
          @click="
            {
              isExtraSoundEffectsEnabled = !isExtraSoundEffectsEnabled;
              debug();
            }
          "
        />
        <i></i>
      </label>
    </div>

    <div
      style="border: 2px solid black; width: 350px; margin: 25px auto 25px auto;
           background: #504F4C; border-radius: 5px; padding-bottom: 20px;"
    >
      <h1 style="color: white">Match History:</h1>
      <table style="width:95%; margin: auto; text-align: center">
        <tr>
          <th style="text-align: center;">Result</th>
          <th style="text-align: center">Opponent</th>
          <th style="text-align: center">Nr of Moves</th>
          <th style="text-align: center">Date</th>
        </tr>
        <template v-for="(match, id) in matches">
          <tr
            :key="id"
            v-bind:style="{
              color: '#AFAEA7',
              backgroundColor: id % 2 === 0 ? '#444340' : '#54534F',
            }"
          >
            <td
              v-bind:style="{
                fontWeight: 800,
                color: match.winner === currentlyLoggedIn ? '#20bf11' : '#FF262D',
              }"
            >
              {{ match.winner === currentlyLoggedIn ? 'Win' : 'Loss' }}
            </td>
            <td>{{ match.opponent }}</td>
            <td>{{ match.nrMoves }}</td>
            <td>{{ match.date }}</td>
          </tr>
        </template>
      </table>
    </div>

    <div
      class="modal"
      v-bind:style="{
        display: this.isInviteModalUp ? 'flex' : 'none',
        justifyContent: 'flex-start',
      }"
      type="text"
    >
      <h2 v-if="isJoinGameModalVisible">{{ selectedOpponent }}</h2>
      <h2 v-if="isJoinGameModalVisible">has invited you</h2>
      <input
        v-if="isJoinGameModalVisible"
        v-bind:value="'Join Game'"
        class="well btn btn-default button"
        @click="
          () => {
            isJoinGameModalVisible = false;
            isInviteModalUp = false;
            join();
          }
        "
        type="button"
      />
      <input
        class="well btn btn-default button"
        @click="
          () => {
            isInviteModalUp = false;
            isChallengeBtnVisible = false;
            isGameSettingsModal = false;
            isJoinGameModalVisible = false;
            gameCode = '';
            selectedOpponent = null;
            isGameModeSelection = false;
          }
        "
        type="button"
        value="Cancel"
      />
    </div>
  </div>
</template>

<script>
import { setExtraSoundEffectsKey } from '../store';
import { preFetchSocket } from '../utils/preFetchSocket';

export default {
  name: 'Profile',
  components: {},
  data() {
    return {
      isExtraSoundEffectsEnabled: this.$store.state.extraSoundEffects,
      currentlyLoggedIn: '',
      success: true,
      matches: [],
      socket: null,
      gameCode: null,
      isJoinGameModalVisible: false,
      isInviteModalUp: false,
      selectedOpponent: '',
    };
  },
  mounted() {
    this.socket = this.$store.state.socket;
    this.currentlyLoggedIn = this.$store.state.cookie.username;
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
        const matchList = data.matchHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (matchList.length > 50) {
          this.matches = matchList.slice(0, 49);
        } else this.matches = matchList;
      })
      .catch((error) => {
        throw new Error(`Match History request failed ${error}`);
      });
    this.$store.state.socket.on('inviteToGame', (userToInvite, gameCode, opponentName) => {
      const isInvitedUser = userToInvite === this.$store.state.cookie.username;
      if (isInvitedUser) {
        this.selectedOpponent = opponentName;
        this.gameCode = gameCode;
        this.isJoinGameModalVisible = true;
        this.isInviteModalUp = true;
      }
    });
  },
  beforeDestroy() {
    this.socket.off('inviteToGame');
  },
  methods: {
    debug() {
      this.$store.commit(setExtraSoundEffectsKey, this.isExtraSoundEffectsEnabled);
    },
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
        .then((res) => {
          if (res.status === 404) this.$store.state.socket.emit('closeClientSocket');
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
    join() {
      fetch(`/api/room/${this.gameCode}/authorizedToJoin`)
        .then((resp) => {
          if (resp.status === 401) {
            alert('Your session is expired. Log in again');
            this.$router.go();
          }
          if (!resp.ok)
            throw new Error(`Unexpected failure when authorizing joining room: ${this.gameCode}`);
          return resp.json();
        })
        .then((data) => {
          if (data.success && !data.isCrazyChess) this.redirect(this.gameCode);
          else if (data.success && data.isCrazyChess) this.crazyChessRedirect(this.gameCode);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    redirect(roomName) {
      this.$router.push(`/room/${roomName}`);
    },
    crazyChessRedirect(roomName) {
      this.$router.push(`/crazyroom/${roomName}`);
    },
  },
};
</script>

<style>
.ios-switch {
  display: inline-block;
  cursor: pointer;
}

.ios-switch input {
  display: none;
}

.ios-switch i {
  position: relative;
  display: inline-block;
  margin-right: 0.5rem;
  width: 46px;
  height: 26px;
  background-color: #6d6b6c;
  border-radius: 23px;
  vertical-align: text-bottom;
  transition: all 0.3s;
}

.ios-switch i::before {
  content: '';
  position: absolute;
  left: 0;
  width: 42px;
  height: 22px;
  background-color: #6d6b6c;
  border-radius: 11px;
  transform: translate3d(2px, 2px, 0) scale3d(1, 1, 1);
  transition: all 0.3;
}

.ios-switch i::after {
  content: '';
  position: absolute;
  left: 0;
  width: 22px;
  height: 22px;
  background-color: #fff;
  border-radius: 11px;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.24);
  transform: translate3d(2px, 2px, 0);
  transition: all 0.2s ease-in-out;
}

.ios-switch:active i::after {
  width: 28px;
  transform: translate3d(2px, 2px, 0);
}
.ios-switch:active input:checked + i::after {
  transform: translate3d(16px, 2px, 0);
}

.ios-switch input:checked + i {
  background-color: #83a954;
}

.ios-switch input:checked + i::before {
  transform: translate3d(18px, 2px, 0) scale3d(0, 0, 0);
}
.ios-switch input:checked + i::after {
  transform: translate3d(22px, 2px, 0);
}
</style>
