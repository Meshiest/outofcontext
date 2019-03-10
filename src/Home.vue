<template>
  <div>
    <ooc-util></ooc-util>
    <div class="menu">
      <header>
        <div class="title">
          Out of Context
        </div>
        <div class="subtitle">
          Party games fueled by your insanity!
        </div>
      </header>
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
    </div>
    <sui-dimmer :active="showJoinLobby">
      <sui-form
        @submit="testLobby"
        :error="lobbyError"
        :loading="testingLobby">
        <sui-card>
          <sui-card-content>
            <sui-card-header>
              Join a Lobby
            </sui-card-header>
            <sui-card-meta>
              Enter the code for an existing lobby
            </sui-card-meta>
          </sui-card-content>
          <sui-card-content>
              <sui-form-field
                :error="lobbyError">
                <label>Lobby Code</label>
                <input name="lobbyCode"
                  required
                  @input="lobbyError = false"
                  autocomplete="off" 
                  placeholder="c0d3">
              </sui-form-field>
              <sui-button
                primary
                type="submit">
                Join
              </sui-button>
              <sui-button
                type="button"
                @click="showJoinLobby = false">
                Cancel
              </sui-button>
          </sui-card-content>
        </sui-card>
        <sui-message
          error
          header="Invalid Lobby Code"
          content="This lobby does not exist"/>
      </sui-form>
    </sui-dimmer>
  </div>
</template>

<style>

.menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  padding: 4px;
  width: 300px;
  text-align: center;
}

.menu header {
  margin: 32px 16px 16px 16px;
}

.menu .subtitle {
  color: #666;
  font-family: Lato, sans-serif;
  font-style: italic;
}

.menu .title {
  font-family: 'Lora', serif;
  font-size: 30px;
  margin: 8px 0;
}

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
    'lobby:join': function(code) {
      this.creatingLobby = false;
      this.$router.push(`/lobby/${code}`);
    },
  },
  methods: {
    createLobby() {
      this.creatingLobby = true;
      this.$socket.emit('lobby:create');
    },
    testLobby(event) {
      event.preventDefault();
      const form = event.target;
      const code = form.lobbyCode.value.replace(/\W/g, '');

      this.testingLobby = true;

      // Determine if the lobby exists
      fetch(`/api/v1/lobby/${code}`)
        .then(resp => {
          if(resp.status === 200) {
            this.$router.push(`/lobby/${code}`);
          } else {
            this.testingLobby = false;
            this.lobbyError = true;  
          }
        })
        .catch(() => {
          this.testingLobby = false;
          this.lobbyError = true;
        });
    }
  },
  created() {
    this.$socket.emit('lobby:leave');
  },
  data() {
    return {
      connected: this.$root.connected,
      creatingLobby: false,
      testingLobby: false,
      showJoinLobby: false,
      lobbyError: false,
    };
  },
};
</script>