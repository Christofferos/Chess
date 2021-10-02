<template>
  <div id="app">
    <nav class="navbar navbar-default navbar-inverse navbar-static-top" role="navigation">
      <div class="navbar-collapse" id="navbar-brand-centered" style="text-align: center">
        <ul class="nav navbar-nav">
          <li v-on:click="redirect('/login')">
            <a style="cursor: pointer"
              ><img src="../public/logoNavbar.png" style="height: 27px"
            /></a>
          </li>
          <li v-on:click="redirect('/login')">
            <a style="cursor: pointer; line-height: 2">Profile</a>
          </li>
          <li v-on:click="redirect('/leaderboard')">
            <a style="cursor: pointer; line-height: 2">Leaderboard</a>
          </li>
          <li v-on:click="redirect('/list')">
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
  methods: {
    redirect(target) {
      this.$router.push(target);
    },
  },
};
</script>

<style>
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
