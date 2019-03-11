<template>
  <ooc-page>
    <ooc-menu v-if="state === 'NO_LOBBY'"
      title="Invalid Lobby"
      subtitle="This lobby does not exist">
      <div>
        <sui-divider horizontal>
          Lobby
        </sui-divider>
        <sui-button-group>
          <sui-button
            color="green"
            :loading="creatingLobby"
            @click="createLobby">
            Create
          </sui-button>
          <sui-button-or/>
          <sui-button
            primary
            :loading="showJoinLobby"
            @click="showJoinLobby = true">
            Join
          </sui-button>
        </sui-button-group>
        <sui-divider horizontal>
          Redirect
        </sui-divider>
        <sui-button-group vertical basic>
          <router-link is="sui-button"
            to="/">
            Home
          </router-link>
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
            v-default-value="oldName"
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
      :title="currGame ? currGame.title : 'No Game Selected'"
      :subtitle="currGame ? currGame.subtitle : 'Waiting for a game to be selected'">
      <!-- <pre>{{JSON.stringify(lobbyInfo, 0, 2)}}</pre> -->
      <div>
        <div v-if="currGame">
          <sui-divider horizontal>
            Game Info
          </sui-divider>
          <sui-card>
            <sui-card-content>
              <sui-card-header>
                {{currGame.title}}
              </sui-card-header>
              <sui-card-description>
                {{currGame.description}}
              </sui-card-description>
            </sui-card-content>
            <sui-card-content extra>
              <sui-icon name="clock"/> {{currGame.playTime}}
              <span style="padding-left: 20px"/>
              <sui-icon name="users"/> {{
                `${currGame.config.players.min}${currGame.config.players.max != 256 ? '-' + currGame.config.players.max : '+'}`
              }}
            </sui-card-content>
          </sui-card>
        </div>
        <div v-if="lobbyInfo.admin === $root.playerId" style="text-align: left">
          <sui-divider horizontal>
            Game Settings
          </sui-divider>
          <sui-form @submit="event => event.preventDefault()">
            <sui-form-field>
              <label>Game</label>
              <sui-dropdown
                placeholder="Select a Game"
                :value="lobbyInfo.game"
                :loading="changeGame"
                @input="tryChangeGame"
                :options="gameOptions"
                selection>
              </sui-dropdown>
            </sui-form-field>
            <div v-if="currGame">
              <sui-form-field v-for="(opt, name) in currGame.config">
                <label>{{opt.name}}</label>
                <div style="display: flex">
                  <sui-input
                    v-if="opt.type === 'int'"
                    type="number"
                    required
                    @input="val => updateConfig(name, val)"
                    :value="deriveConfigValue(name)"
                    :min="opt.min"
                    :max="opt.max || 256"
                    autocomplete="off"/>
                  <pre v-else>
                    {{name}}: {{JSON.stringify(opt, 0, 2)}}
                  </pre>
                  <sui-button v-if="opt.defaults === '#numPlayers'"
                    type="button"
                    :primary="configVal(name) === '#numPlayers'"
                    @click="updateConfig(name, '#numPlayers')"
                    style="margin-left: 8px"
                    icon="users"/>
                </div>
              </sui-form-field>
              <div style="margin: 1em 0; text-align: center">
                <sui-button
                  type="button"
                  :disabled="lobbyInfo.players.length < currGame.config.players.min"
                  primary>
                  <!-- TODO: actually start the game -->
                  Start Game
                </sui-button>
              </div>
            </div>
          </sui-form>
        </div>
        <div v-else-if="currGame">
          <sui-divider horizontal>
            Game Setup
          </sui-divider>
          <sui-card>
            <div style="display: flex; flex-flow: row wrap; align-items: center; justify-content: center;">
              <div v-for="(opt, name) in currGame.config" style="margin: 8px;">
                <sui-statistic>
                  <sui-statistic-value>
                    {{deriveConfigValue(name)}}
                  </sui-statistic-value>
                  <sui-statistic-label>
                    {{opt.text}}
                  </sui-statistic-label>
                </sui-statistic>
              </div>
            </div>
          </sui-card>
        </div>
      </div>
      <div>
        <sui-divider horizontal>
          Lobby Members
        </sui-divider>
        <sui-table basic class="player-table">
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
        <sui-table basic class="player-table">
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
      </div>
    </ooc-menu>
    <sui-dimmer :active="loading">
      <sui-loader />
    </sui-dimmer>
    <sui-label
      v-if="validLobby"
      class="lobby-code left"
      attached="top left">
      <code>
        {{$route.params.code}}
      </code>
    </sui-label>
    <sui-label
      v-if="lobbyInfo.admin === $root.playerId"
      class="lobby-code right"
      color="green"
      attached="top right">
      <sui-icon name="shield"/>
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
  position: fixed !important;
  top: 0 !important;
}

.lobby-code.left {
  left: 0 !important;
}

.lobby-code.right {
  right: 0 !important;
}

</style>

<script>

import gameInfo from '../gameInfo';
import _ from 'lodash';

const emptyInfo = () => ({
  admin: '',
  players: [],
  members: [],
  spectators: [],
  game: '',
  config: {},
});

export default {
  data() {
    return {
      oldName: localStorage.oocName || '',
      loading: true,
      creatingLobby: false,
      showJoinLobby: false,
      validLobby: false,
      loadingName: false,
      validName: true,
      changeGame: false,
      lobbyInfo: emptyInfo(),
      state: 'LOADING',
      gameInfo,
      gameOptions: _.map(gameInfo, (v, k) => ({value: k, text: v.title})),
    };
  },
  computed:  {
    currGame() {
      return gameInfo[this.lobbyInfo.game];
    }
  },
  methods: {
    configVal(name) {
      const confVal = this.lobbyInfo.config[name];
      const defVal = gameInfo[this.lobbyInfo.game].config[name].defaults;
      return confVal || defVal;
    },
    deriveConfigValue(name) {
      const val = this.configVal(name);
      const conf = gameInfo[this.lobbyInfo.game].config[name];

      switch(val) {
      case '#numPlayers':
        return Math.max(Math.min(this.lobbyInfo.players.length, conf.max), conf.min);
      default:
        return val;
      }
    },
    updateConfig(name, val) {
      this.$socket.emit('lobby:game:config', name, val);
    },
    tryChangeGame(game) {
      if(!game)
        return;
      this.changeGame = true;
      this.$socket.emit('lobby:game:set', game);
    },
    enterName(event) {
      event.preventDefault();
      const name = event.target.playerName.value;
      localStorage.oocName = name;
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
            this.validLobby = true;
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
      this.lobbyInfo = emptyInfo();
      const lobbyCode = this.$route.params.code;
      if(lobbyCode !== code)
        this.$router.push(`/lobby/${code}`);
    },
    'lobby:leave': function(code) {
      this.validLobby = false;
      this.state = 'NO_LOBBY';
    },
    'lobby:info': function(info) {
      this.changeGame = false;
      this.lobbyInfo = info;
    },
    disconnect(code) {
      this.validLobby = false;
      this.state = 'NO_LOBBY';
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