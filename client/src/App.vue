<template>
  <div id="app">
    <button class="add-button" v-if="showInstallBtn" v-on:click="installPWA()">
      Add to home screen
    </button>
    <nav class="navbar navbar-default navbar-inverse navbar-static-top" role="navigation">
      <div class="navbar-collapse" id="navbar-brand-centered" style="text-align: center">
        <ul class="nav navbar-nav">
          <li @click="() => {}">
            <a style="cursor: pointer"
              ><img src="../public/logoNavbar.png" style="height: 27px"
            /></a>
          </li>
          <li v-on:click="redirect('/profile')" v-if="this.$store.state.isAuthenticated">
            <a style="cursor: pointer; line-height: 2">Profile</a>
          </li>
          <li v-on:click="redirect('/leaderboard')" v-if="this.$store.state.isAuthenticated">
            <a style="cursor: pointer; line-height: 2">Leaderboard</a>
          </li>
          <li v-on:click="redirect('/list')" v-if="this.$store.state.isAuthenticated">
            <a style="cursor: pointer; line-height: 2">Play Chess</a>
          </li>
        </ul>
      </div>
    </nav>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  data() {
    return {
      deferredPrompt: null,
      showInstallBtn: false,
    };
  },
  created() {
    this.showInstallBtn = false;
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBtn = true;
    });
  },
  methods: {
    redirect(target) {
      this.$router.push(target).catch(() => {});
    },
    installPWA() {
      this.showInstallBtn = false;
      if (!this.deferredPrompt) return;
      console.log('deferredPrompt not null', deferredPrompt);
      // Show the prompt
      this.deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        this.deferredPrompt = null;
      });
    },
  },
};
</script>

<style>
.add-button {
  position: absolute;
  bottom: 1px;
  left: 1px;
}

.html,
body {
  margin: 0;
  padding: 0;
  border: 0;
  background: #464541;
}

span.text-blue {
  color: #387eff;
}

button:focus {
  outline: 0;
}

.navbar .container {
  margin-left: 0;
  margin-right: 0;
  padding-left: 0;
  width: 100%;
}

.navbar > .container .navbar-brand-centered,
.navbar > .container-fluid .navbar-brand-centered {
  margin-left: -80px;
}

.navbar-brand-centered {
  position: absolute;
  left: 50%;
  display: block;
  width: 160px;
  text-align: center;
  background-color: transparent;
}

.navbar {
  border-bottom: 0;
}

.navbar-default .navbar-nav > li:not(.active) > a:not(.unresponsive):hover {
  background-color: #0e0e0e;
}

.navbar-default .navbar-nav > .active > a,
.navbar-default .navbar-nav > .active > a:focus {
  background-color: #3873ff;
  color: #ffffff;
}

.navbar-default .navbar-nav > .active > a:hover {
  background-color: #1c65eb;
}

.nav.navbar-nav.navbar-right > li > .unresponsive:hover {
  color: #777777;
  cursor: default;
}

div.light-blue-background {
  background-color: #c5e7ff;
}
</style>
