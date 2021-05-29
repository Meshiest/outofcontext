<template>
  <ooc-page>
    <ooc-menu
      title="Out of Context"
      subtitle="Party games fueled by your insanity!">
      <div>
        <sui-divider horizontal :inverted="darkMode">
          Lobby
        </sui-divider>
        <sui-button-group>
          <sui-button
            color="green"
            :inverted="darkMode"
            :loading="!connected || creatingLobby"
            @click="createLobby">
            Create
          </sui-button>
          <sui-button-or/>
          <sui-button
            color="blue"
            :inverted="darkMode"
            @click="showJoinLobby = true"
            :loading="!connected || showJoinLobby">
            Join
          </sui-button>
        </sui-button-group>
        <sui-divider horizontal :inverted="darkMode">
          Info
        </sui-divider>
        <sui-button-group vertical :inverted="darkMode" :basic="!darkMode">
          <router-link
            is="sui-button"
            :basic="darkMode"
            :inverted="darkMode"
            to="/games">
            Game Info
          </router-link>
          <a is="sui-button"
            href="https://github.com/meshiest/outofcontext"
            target="_blank"
            :basic="darkMode"
            :inverted="darkMode"
            rel="noopener noreferrer">
            Read the Code
          </a>
          <a is="sui-button"
            href="https://github.com/Meshiest/outofcontext/issues/new"
            target="_blank"
            :basic="darkMode"
            :inverted="darkMode"
            rel="noopener noreferrer">
            Request a Game
          </a>
        </sui-button-group>
      </div>
    </ooc-menu>
    <ooc-join-lobby :active="showJoinLobby" @close="showJoinLobby = false">
    </ooc-join-lobby>
    <ooc-util></ooc-util>
  </ooc-page>
</template>

<style>

</style>


<script>
export default {
  sockets: {
    connect() {
      this.connected = true;
    },
    disconnect() {
      this.connected = false;
    },
  },
  methods: {
    update() { this.$forceUpdate(); },
    createLobby() {
      this.creatingLobby = true;
      this.$socket.emit('lobby:create');
    },
  },
  beforeDestroy() {
    this.bus.$off('toggle-dark-mode', this.update);
  },
  created() {
    this.bus.$on('toggle-dark-mode', this.update);
    this.$socket.emit('lobby:leave');
  },
  data() {
    return {
      connected: this.$root.connected,
      creatingLobby: false,
      showJoinLobby: false,
    };
  },
};
</script>