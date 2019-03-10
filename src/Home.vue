<template>
  <ooc-page>
    <ooc-menu
      title="Out of Context"
      subtitle="Party games fueled by your insanity!">
      <div>
        <sui-divider horizontal>
          Lobby
        </sui-divider>
        <sui-button-group>
          <sui-button
            color="green"
            :loading="!connected || creatingLobby"
            @click="createLobby">
            Create
          </sui-button>
          <sui-button-or/>
          <sui-button
            primary
            @click="showJoinLobby = true"
            :loading="!connected">
            Join
          </sui-button>
        </sui-button-group>
        <sui-divider horizontal>
          Info
        </sui-divider>
        <sui-button-group vertical basic>
          <sui-button disabled>
            Playable Games
          </sui-button>
          <sui-button disabled>
            Screenshots
          </sui-button>
          <a is="sui-button"
            href="https://github.com/meshiest/out-of-context"
            target="_blank"
            rel="noopener noreferrer">
            Read the Code
          </a>
          <sui-button disabled>
            About
          </sui-button>
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
    createLobby() {
      this.creatingLobby = true;
      this.$socket.emit('lobby:create');
    },
  },
  created() {
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