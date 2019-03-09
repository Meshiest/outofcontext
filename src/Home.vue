<template>
  <div>
    <portal-target name="semantic-ui-vue">
    </portal-target>
    <div class="main-menu">
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
          <sui-button color="green" :loading="!connected">
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
            Games
          </sui-button>
          <sui-button disabled>
            Screenshots
          </sui-button>
          <a is="sui-button"
            href="https://github.com/meshiest/out-of-context"
            target="_blank"
            rel="noopener noreferrer">
            Source
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

.main-menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  padding: 4px;
  width: 300px;
  text-align: center;
}

.main-menu header {
  margin: 32px 16px 16px 16px;
}

.main-menu .subtitle {
  color: #666;
  font-family: Lato, sans-serif;
  font-style: italic;
}

.main-menu .title {
  font-family: 'Lora', sans-serif;
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
  },
  methods: {
    testLobby(event) {
      event.preventDefault();
      const form = event.target;
      const code = form.lobbyCode.value;

      this.testingLobby = true;

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
  data() {
    return {
      connected: this.$root.connected,
      testingLobby: false,
      showJoinLobby: false,
      lobbyError: false,
    };
  },
};
</script>