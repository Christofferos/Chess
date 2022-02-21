<template>
  <div class="container">
    <section class="col-md-10 col-md-offset-1">
      <div class="row" style="text-align: center;">
        <h1 style="color: white">Play Chess</h1>
      </div>

      <div class="row">
        <div class="row" style="text-align: center;">
          <input
            class="well btn btn-default button"
            v-on:click="newGame()"
            type="button"
            value="Normal Chess"
          />
        </div>
        <div class="row" style="text-align: center;">
          <!-- :disabled="matchHistoryLen < 5" -->
          <input
            class="well btn btn-warning button"
            v-on:click="newGameCrazyChess()"
            type="button"
            value="Crazy Chess"
          />
        </div>

        <h4 style="text-align: center; color: white">OR</h4>

        <form v-on:submit.prevent="join()">
          <div class="row" style="text-align: center;">
            <input
              class="well"
              type="text"
              placeholder="Enter Game Code"
              style="width: 350px; font-size: 22px; text-align: center; border-radius: 5px;"
              pattern="[A-Za-z0-9]{3}"
              title="Three letter code"
              v-model="gameCode"
            />
          </div>
          <div class="row" style="text-align: center;">
            <input class="well btn btn-default button" type="submit" value="Join Game" />
          </div>
          <div class="row" style="text-align: center;">
            <input
              class="well btn btn-default button"
              v-on:click="newGameLocalGame()"
              type="button"
              value="Split Screen"
            />
          </div>
        </form>

        <!-- <div class="row" style="text-align: center;">
          <h1 style="color: white">Challenge Player</h1>
        </div> -->

        <div class="row" style="text-align: center; margin-top: 10px;">
          <h1 style="color: white">Challenge Players</h1>
          <div
            v-for="userOnline in usersOnline"
            @click="
              () => {
                isInviteModalUp = true;
                isChallengeBtnVisible = true;
                selectedOpponent = userOnline;
              }
            "
            :key="userOnline"
            class="row well button"
            style="margin: auto auto 5px auto; cursor: pointer"
          >
            <div class="row" style="text-align: center;">
              <h4>
                <span>{{ userOnline }}</span>
              </h4>
            </div>
          </div>
          <div
            v-on:click="newGameStockfish()"
            class="row well button"
            style="margin: auto auto 5px auto; cursor: pointer"
          >
            <div class="row" style="text-align: center;">
              <h4>
                <span>Stockfish (AI)</span>
              </h4>
            </div>
          </div>
        </div>

        <div class="row" style="text-align: center; margin-top: 10px;">
          <h3 style="color: white">Continue Games:</h3>
        </div>
        <div
          class="row well button"
          v-for="room in roomsList"
          @click="
            () => {
              gameCode = room.id;
              join();
            }
          "
          :key="room.id"
          style="margin: auto auto 5px auto; cursor: pointer"
        >
          <div class="row" style="text-align: center;">
            <h4>
              <span>{{
                username === room.player1
                  ? `${room.player2} (${room.id})`
                  : `${room.player1} (${room.id})`
              }}</span>
            </h4>
          </div>
        </div>
      </div>

      <div
        class="modal"
        v-bind:style="{
          display: this.isInviteModalUp ? 'flex' : 'none',
        }"
        type="text"
      >
        <input
          v-if="isChallengeBtnVisible"
          v-bind:value="'Challenge ' + selectedOpponent"
          class="well btn btn-default button"
          @click="
            () => {
              isGameSettingsModal = true;
              isChallengeBtnVisible = false;
            }
          "
          type="button"
        />
        <div v-if="isGameSettingsModal">
          <div
            v-for="timeOption in minuteOptions"
            :key="timeOption"
            @click="
              () => {
                isGameModeSelection = true;
                isGameSettingsModal = false;
                timeSelected = timeOption;
              }
            "
          >
            <input
              class="well btn btn-default button"
              type="button"
              v-bind:value="timeOption + ' minutes'"
            />
          </div>
        </div>
        <div
          v-if="isGameModeSelection"
          @click="
            () => {
              isGameModeSelection = false;
              isInviteModalUp = false;
              newGame(timeSelected, selectedOpponent);
            }
          "
        >
          <input class="well btn btn-default button" type="button" value="Normal Chess" />
        </div>
        <div
          v-if="isGameModeSelection"
          @click="
            () => {
              isGameModeSelection = false;
              isInviteModalUp = false;
              newGameCrazyChess(timeSelected, selectedOpponent);
            }
          "
        >
          <input class="well btn btn-default button" type="button" value="Crazy Chess" />
        </div>
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
    </section>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { addOnlineUser, removeOnlineUser } from '../store';

export default {
  name: 'List',
  components: {},
  data: () => ({
    rooms: [],
    gameCode: '',
    username: '',
    isInviteModalUp: false,
    isChallengeBtnVisible: false,
    isGameSettingsModal: false,
    isGameModeSelection: false,
    selectedOpponent: null,
    minuteOptions: [10, 5, 3, 1],
    timeSelected: undefined,
    isJoinGameModalVisible: false,
    matchHistoryLen: 0,
    socket: null,
  }),
  computed: {
    roomsList: function() {
      return this.rooms.filter((room, index) => index < 3);
    },
    ...mapState({
      usersOnline: 'usersOnline',
    }),
  },
  mounted() {
    this.username = this.$store.state.cookie.username;
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
  created() {
    this.socket = this.$store.state.socket;
    this.$store.state.socket.on('newRoom', (newRoom) => {
      const isUserPartOfNewRoom =
        newRoom.player1 === this.$store.state.cookie.username ||
        newRoom.player2 === this.$store.state.cookie.username;
      if (isUserPartOfNewRoom) {
        this.rooms = [...Object.values(this.rooms), newRoom];
      }
    });
    this.$store.state.socket.on('remainingRooms', (remainingRooms) => {
      this.rooms = Object.values(remainingRooms).filter((room) => {
        const isUserPartOfRoom =
          room.player1 === this.$store.state.cookie.username ||
          room.player2 === this.$store.state.cookie.username;
        return isUserPartOfRoom;
      });
    });
    this.$store.state.socket.on('userOnlineUpdate', (userId, isNewUser) => {
      const isClientUsername = this.$store.state.cookie.username === userId;
      if (isNewUser && !isClientUsername) {
        this.$store.commit(addOnlineUser, userId);
        return;
      }
      this.$store.commit(removeOnlineUser, userId);
    });
    fetch('/api/userOnlineInitialize')
      .then((res) => res.json())
      .then(({ onlineUsers }) => {
        onlineUsers.forEach(({ userId }) => {
          const isClientUsername = this.$store.state.cookie.username === userId;
          if (!isClientUsername) this.$store.commit(addOnlineUser, userId);
        });
      })
      .catch(console.error);
    fetch('/api/userRoomList')
      .then((res) => res.json())
      .then((data) => {
        this.rooms = data.list;
      })
      .catch(console.error);
    fetch(`/api/matchHistory/${this.$store.state.cookie.username}`, {
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
        const matchList = data.matchHistory;
        this.matchHistoryLen = matchList.length;
      })
      .catch((error) => {
        throw new Error(`Match History request failed ${error}`);
      });
  },
  beforeDestroy() {
    this.socket.off('newRoom');
    this.socket.off('remainingRooms');
    this.socket.off('userOnlineUpdate');
    this.socket.off('inviteToGame');
  },
  methods: {
    debug(msg) {
      console.log('MSG', msg);
    },
    redirect(roomName) {
      this.$router.push(`/room/${roomName}`);
    },
    stockfishRedirect(roomName) {
      this.$router.push(`/stockfish/${roomName}`);
    },
    localGameRedirect(roomName) {
      this.$router.push(`/localroom/${roomName}`);
    },
    crazyChessRedirect(roomName) {
      this.$router.push(`/crazyroom/${roomName}`);
    },
    newGame(minuteTimeLimit = undefined, userToInvite = undefined) {
      fetch('/api/newGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          minuteTimeLimit,
          userToInvite,
        }),
      })
        .then((resp) => {
          if (!resp.ok) throw new Error(resp.text);
          return resp.json();
        })
        .then((data) => {
          this.gameCode = data.gameId;
          this.redirect(data.gameId);
        })
        .catch((error) => {
          alert('Failed to create game. Please try to sign out, sign in and try again.');
          this.$router.go();
          throw new Error(`Failed to create game ${error}.`);
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
    newGameStockfish(minuteTimeLimit = 10) {
      fetch('/api/newGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          minuteTimeLimit,
        }),
      })
        .then((resp) => {
          if (!resp.ok) throw new Error(resp.text);
          return resp.json();
        })
        .then((data) => {
          this.gameCode = data.gameId;
          this.stockfishRedirect(data.gameId);
        })
        .catch((error) => {
          alert('Failed to create game. Please try to sign out, sign in and try again.');
          this.$router.go();
          throw new Error(`Failed to create game ${error}.`);
        });
    },
    newGameLocalGame(minuteTimeLimit = 10) {
      fetch('/api/newGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          minuteTimeLimit,
        }),
      })
        .then((resp) => {
          if (!resp.ok) throw new Error(resp.text);
          return resp.json();
        })
        .then((data) => {
          this.gameCode = data.gameId;
          this.localGameRedirect(data.gameId);
        })
        .catch((error) => {
          alert('Failed to create game. Please try to sign out, sign in and try again.');
          this.$router.go();
          throw new Error(`Failed to create game ${error}.`);
        });
    },
    newGameCrazyChess(minuteTimeLimit = 10, userToInvite = undefined) {
      fetch('/api/newGame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          minuteTimeLimit,
          userToInvite,
          crazyChess: true,
        }),
      })
        .then((resp) => {
          if (!resp.ok) throw new Error(resp.text);
          return resp.json();
        })
        .then((data) => {
          this.gameCode = data.gameId;
          this.crazyChessRedirect(data.gameId);
        })
        .catch((error) => {
          alert('Failed to create game. Please try to sign out, sign in and try again.');
          this.$router.go();
          throw new Error(`Failed to create game ${error}.`);
        });
    },
  },
};
</script>

<style>
.button {
  background: #7fa650;
  font-size: 2.2rem;
  font-weight: 600;
  line-height: 1.2;
  color: white;
  width: 350px;
  border: none;
}
.button:hover {
  background: #95bb4a;
  color: white;
}
.modal {
  position: absolute;
  flex-direction: column;
  top: 0%;
  right: 0%;
  width: 100%;
  height: 100%;
  background-color: rgba(205, 133, 63, 0.6);
  z-index: 11;
  align-items: center;
  justify-content: center;
}
</style>
