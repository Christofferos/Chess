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
            value="Create Game"
          />
        </div>

        <!-- Find Opponent, Invite Opponent, Play Locally, Crazy Chess -->
        <!-- <div class="row" style="text-align: center; ">
            <input class="well btn btn-default button" type="button" value="Find Opponent" />
          </div> -->
        <h3 style="text-align: center; color: white">OR</h3>

        <form v-on:submit.prevent="join()">
          <div class="row" style="text-align: center;">
            <input
              class="well"
              type="text"
              placeholder="Enter Game Code"
              style="width: 350px; font-size: 22px; text-align: center; border-radius: 5px;"
              pattern="[A-Za-z0-9]{8}"
              title="Eight letter code"
              v-model="gameCode"
            />
          </div>
          <div class="row" style="text-align: center;">
            <input class="well btn btn-default button" type="submit" value="Join Game" />
          </div>
        </form>

        <div class="row" style="text-align: center; margin-top: 10px;">
          <h3 style="color: white">Players Online: {{ usersOnline.length }}</h3>
          <div
            v-for="userOnline in usersOnline"
            @click="
              () => {
                isInviteModalUp = true;
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
        </div>

        <div class="row" style="text-align: center; margin-top: 10px;">
          <h3 style="color: white">Active Games:</h3>
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
              <span>{{ room.id }}</span>
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
          class="well btn btn-default button"
          @click="
            () => {
              isGameSettingsModal = true;
            }
          "
          type="button"
          v-bind:value="'Challenge ' + selectedOpponent"
          v-if="!isGameSettingsModal"
        />
        <div v-if="isGameSettingsModal">
          <div
            v-for="timeOption in minuteOptions"
            :key="timeOption"
            @click="
              () => {
                isGameSettingsModal = false;
                isInviteModalUp = false;
                newGame(timeOption);
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
        <input
          class="well btn btn-default button"
          @click="
            () => {
              isInviteModalUp = false;
              isGameSettingsModal = false;
              selectedOpponent = null;
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
    isInviteModalUp: false,
    isGameSettingsModal: false,
    selectedOpponent: null,
    minuteOptions: [10, 5, 3, 1],
  }),
  computed: {
    roomsList: function() {
      return this.rooms.filter((room, index) => index < 3);
    },
    ...mapState({
      usersOnline: 'usersOnline',
    }),
  },
  created() {
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
  },
  methods: {
    redirect(roomName) {
      this.$router.push(`/room/${roomName}`);
    },
    newGame(minuteTimeLimit = undefined) {
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
          this.redirect(data.gameId);
        })
        .catch((error) => {
          alert('Failed to create game. Please try to sign out, sign in and try again.');
          throw new Error(`Failed to create game ${error}.`);
        });
    },
    join() {
      fetch(`/api/room/${this.gameCode}/authorizedToJoin`)
        .then((resp) => {
          if (!resp.ok) throw new Error(`Unexpected failure when joining room: ${this.gameCode}`);
          return resp.json();
        })
        .then((data) => {
          if (data.success) this.redirect(this.gameCode);
        })
        .catch(console.error);
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
