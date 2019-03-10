<template>
  <ooc-page>
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
            :loading="creatingLobby"
            @click="createLobby">
            Create Lobby
          </sui-button>
          <sui-button
            :loading="showJoinLobby"
            @click="showJoinLobby = true">
            Join Lobby
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
    <ooc-menu v-else-if="state === 'JOIN_LOBBY'"
      title="Enter a Name"
      subtitle="Try to be creative">
      <sui-form
        @submit="e => enterName(e)"
        :error="!validName"
        :loading="loadingName">
        <sui-form-field>
          <label>Name</label>
          <input name="playerName"
            required
            @input="validName = true"
            minlength="1"
            maxlength="15" 
            autocomplete="on"
            placeholder="Ethan">
        </sui-form-field>
        <sui-button primary type="submit">
          Join
        </sui-button>
        <router-link
          is="sui-button"
          to="/">
          Leave
        </router-link>
      </sui-form>
    </ooc-menu>
    <ooc-menu v-else-if="state === 'LOBBY_WAITING'"
      :title="lobbyInfo.currGame || 'No Game Selected'"
      subtitle="Waiting for a game to be selected">
      <!-- <pre>{{JSON.stringify(lobbyInfo, 0, 2)}}</pre> -->
      <sui-table basic="very" class="player-table">
        <thead>
          <tr>
            <th>Players</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in lobbyInfo.players">
            <td :negative="!p.connected">
              {{p.name}}
              <sui-icon
                v-if="lobbyInfo.admin === p.id"
                color="grey"
                name="shield">
              </sui-icon>
            </td>
          </tr>
          <tr v-if="!lobbyInfo.players.length">
            <td>
              <i>No Players</i>
            </td>
          </tr>
        </tbody>
      </sui-table>
      <sui-table basic="very" class="player-table">
        <thead>
          <tr>
            <th>Spectators</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in lobbyInfo.spectators">
            <td v-if="p.name">
              {{p.name}}
            </td>
            <td v-else>
              <i>Pending</i>
            </td>
          </tr>
          <tr v-if="!lobbyInfo.spectators.length">
            <td>
              <i>No Spectators</i>
            </td>
          </tr>
        </tbody>

      </sui-table>
    </ooc-menu>
    <sui-dimmer :active="loading">
      <sui-loader />
    </sui-dimmer>
    <sui-label
      v-if="validLobby"
      class="lobby-code"
      attached="top left">
      <code>
        {{$route.params.code}}
      </code>
    </sui-label>
    <ooc-util></ooc-util>
    <ooc-join-lobby :active="showJoinLobby" @close="showJoinLobby = false">
    </ooc-join-lobby>
  </ooc-page>
</template>

<style>

.player-table td {
  font-weight: normal !important;
}

.lobby-code {
  left: 0 !important;
  position: fixed !important;
  top: 0 !important;
}

</style>


<script>

export default {
  data() {
    return {
      loading: true,
      creatingLobby: false,
      showJoinLobby: false,
      validLobby: false,
      loadingName: false,
      validName: true,
      lobbyInfo: {
        admin: '',
        players: [],
        members: [],
        spectators: [],
        currGame: '',
      },
      state: 'LOADING',
    };
  },
  methods: {
    enterName(event) {
      event.preventDefault();
      const name = event.target.playerName.value;
      this.loadingName = true;
      this.$socket.emit('member:name', name);
    },
    createLobby() {
      this.creatingLobby = true;
      this.validLobby = true;
      this.$socket.emit('lobby:create');
    },
    testLobby() {
      this.loading = true;
      const lobbyCode = this.$route.params.code;
      fetch(`/api/v1/lobby/${lobbyCode}`)
        .then(resp => {
          if(resp.status === 200) {
            this.state = 'JOIN_LOBBY';
            this.$socket.emit('lobby:join', lobbyCode);
          } else {
            this.state = 'NO_LOBBY';
            this.validLobby = false;
          }
          this.loading = false;
        })
        .catch(() => {
          this.validLobby = false;
          this.state = 'NO_LOBBY';
          this.loading = false;
        });
    },
  },
  sockets: {
    'member:nameOk': function(ok) {
      this.loadingName = false;
      if(!ok) {
        this.validName = false;
      } else {
        this.validLobby = true;
        this.state = 'LOBBY_WAITING';
      }
    },
    'lobby:join': function(code) {
      this.creatingLobby = false;
      this.state = 'JOIN_LOBBY';
      this.validLobby = true;
      this.showJoinLobby = false;
      this.lobbyInfo = {
        admin: '',
        players: [],
        members: [],
        spectators: [],
        currGame: '',
      };
      const lobbyCode = this.$route.params.code;
      if(lobbyCode !== code)
        this.$router.push(`/lobby/${code}`);
    },
    'lobby:leave': function(code) {
      this.validLobby = false;
      this.state = 'NO_LOBBY';
    },
    'lobby:info': function(info) {
      this.lobbyInfo = info;
    },
    connect() {
    const lobbyCode = this.$route.params.code;
      if(this.loading)
        return;
      if(!lobbyCode || lobbyCode.length !== 4) {
        this.loading = false;
        this.state = 'NO_LOBBY';
      } else {
        this.testLobby();
      }
    }
  },
  created() {
    const lobbyCode = this.$route.params.code;
    if(!lobbyCode || lobbyCode.length !== 4) {
      this.loading = false;
      this.state = 'NO_LOBBY';
    } else {
      this.testLobby();
    }
  }
};
</script>