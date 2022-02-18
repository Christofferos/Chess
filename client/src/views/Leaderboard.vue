<template>
  <div class="text-box col-md-4 col-md-offset-4" style="text-align: center">
    <h1 style="color: white">Leaderboard</h1>
    <div
      class="row well button"
      v-for="(playerData, index) in playerLeaderboard"
      :key="playerData[0]"
      style="margin: auto auto 5px auto"
    >
      <div class="row" style="text-align: center;">
        <h4>
          <span v-if="index === 0">🥇 {{ playerData[0] }} - {{ playerData[1] }}</span>
          <span v-else-if="index === 1">🥈 {{ playerData[0] }} - {{ playerData[1] }}</span>
          <span v-else-if="index === 2">🥉 {{ playerData[0] }} - {{ playerData[1] }}</span>
          <span v-else>{{ index + 1 }}. {{ playerData[0] }} - {{ playerData[1] }}</span>
        </h4>
      </div>
    </div>

    <div
      class="modal"
      v-bind:style="{
        display: this.isInviteModalUp ? 'flex' : 'none',
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
export default {
  name: 'Leaderboard',
  components: {},
  data() {
    return {
      playerLeaderboard: [],
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
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then(({ sortedLeaderboard }) => {
        this.playerLeaderboard = sortedLeaderboard?.slice(0, 20);
      })
      .catch(console.error);
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
    capitalizeFirstLetter(inputStr) {
      return inputStr.charAt(0).toUpperCase() + inputStr.slice(1);
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
