<style scoped>
</style>

<template>
  <div>
    <ooc-util></ooc-util>
    <ooc-menu v-if="state === 'NO_LOBBY'"
      title="Invalid Lobby"
      subtitle="This lobby does not exist">
      <div>
        <sui-button-group vertical basic>
          <router-link is="sui-button"
            to="/">
            Home
          </router-link>
          <sui-button
            color="green"
            :loading="creatingLobby"
            @click="createLobby">
            Create Lobby
          </sui-button>
          <a is="sui-button"
            href="https://github.com/meshiest/out-of-context/issues"
            target="_blank"
            rel="noopener noreferrer">
            Bug Report
          </a>
        </sui-button-group>
      </div>
    </ooc-menu>
    <div v-else-if="state === 'JOIN_LOBBY'">
      create name
    </div>
    <sui-dimmer :active="loading">
      <sui-loader />
    </sui-dimmer>
  </div>
</template>

<script>

export default {
  data() {
    return {
      loading: true,
      creatingLobby: false,
      state: 'LOADING',
    };
  },
  methods: {
    createLobby() {
      this.creatingLobby = true;
      this.$socket.emit('lobby:create');
    },
    testLobby() {
      this.loading = true;
      const lobbyId = this.$route.params.id;
      fetch(`/api/v1/lobby/${lobbyId}`)
        .then(resp => {
          if(resp.status === 200) {
            this.state = 'JOIN_LOBBY';
          } else {
            this.state = 'NO_LOBBY';
          }
          this.loading = false;
        })
        .catch(() => {
          this.state = 'NO_LOBBY';
          this.loading = false;
        });
    },
  },
  sockets: {
    'lobby:join': function(code) {
      this.creatingLobby = false;
      this.state = 'JOIN_LOBBY';
      this.$router.push(`/lobby/${code}`);
    },
    'lobby:leave': function(code) {
      this.state = 'NO_LOBBY';
    },
    connect() {
      this.testLobby();
    }
  },
  created() {
    const lobbyId = this.$route.params.id;
    if(!lobbyId || lobbyId.length !== 4) {
      this.loading = false;
      this.state = 'NO_LOBBY';
    } else {
      this.testLobby();
    }
  }
};
</script>