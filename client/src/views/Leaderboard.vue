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
  </div>
</template>

<script>
export default {
  name: 'Leaderboard',
  components: {},
  data() {
    return {
      playerLeaderboard: [],
    };
  },
  created() {
    this.currentlyLoggedIn = this.$store.state.cookie.username;
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then(({ sortedLeaderboard }) => {
        this.playerLeaderboard = sortedLeaderboard;
      })
      .catch(console.error);
  },
  methods: {
    capitalizeFirstLetter(inputStr) {
      return inputStr.charAt(0).toUpperCase() + inputStr.slice(1);
    },
  },
};
</script>
