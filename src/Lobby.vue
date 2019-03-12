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
              <sui-form-field v-for="(opt, name) in currGame.config" v-if="!opt.hidden" :key="name">
                <label>{{opt.name}}</label>
                <div v-if="opt.type === 'int'" style="display: flex">
                  <sui-input
                    type="number"
                    @input="val => updateConfig(name, val)"
                    :value="deriveConfigValue(name)"
                    :min="opt.min"
                    :max="opt.max || 256"
                    autocomplete="off"/>
                  <sui-button v-if="opt.defaults === '#numPlayers'"
                    type="button"
                    :primary="configVal(name) === '#numPlayers'"
                    @click="updateConfig(name, '#numPlayers')"
                    style="margin-left: 8px"
                    icon="users"/>
                </div>
                <sui-dropdown v-else-if="opt.type === 'bool'"
                  :value="deriveConfigValue(name)"
                  :options="[{text: 'Enabled', value: 'true'}, {text: 'Disabled', value: 'false'}]"
                  @input="val => updateConfig(name, val)"
                  selection>
                </sui-dropdown>
                <sui-dropdown v-else-if="opt.type === 'list'"
                  :value="deriveConfigValue(name)"
                  :options="opt.options.map(o => ({text: o.text, value: o.name}))"
                  @input="val => updateConfig(name, val)"
                  selection>
                </sui-dropdown>
              </sui-form-field>
              <div style="margin: 1em 0; text-align: center">
                <sui-button
                  type="button"
                  :disabled="lobbyInfo.players.length < currGame.config.players.min"
                  @click="$socket.emit('game:start')"
                  primary>
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
              <div v-for="(opt, name) in currGame.config"
                v-if="!opt.hidden"
                :key="name"
                style="margin: 8px;">
                <sui-statistic>
                  <sui-statistic-value>
                    {{deriveConfigText(name)}}
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
      <ooc-player-list
        :admin="lobbyInfo.admin"
        :players="lobbyInfo.players"
        :spectators="lobbyInfo.spectators"
        :isSpectator="isSpectator"
        :gameState="gameState"
        :lobbyState="state"
        :canJoinPlayers="canJoinPlayers">
      </ooc-player-list>
    </ooc-menu>
    <ooc-menu v-else-if="state === 'PLAYING'"
      :title="currGame.title"
      :subtitle="currGame.subtitle">
      <ooc-game :game="lobbyInfo.game">
      </ooc-game>
      <ooc-player-list
        :admin="lobbyInfo.admin"
        :players="lobbyInfo.players"
        :spectators="lobbyInfo.spectators"
        :isSpectator="isSpectator"
        :lobbyState="state"
        :gameState="gameState"
        :canJoinPlayers="canJoinPlayers">
      </ooc-player-list>
    </ooc-menu>
    <sui-dimmer :active="loading || state === 'LOADING'">
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
      gameState: { icons: {} },
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
    isSpectator() {
      return this.lobbyInfo.spectators.find(p => p.id === this.$root.playerId);
    },
    canJoinPlayers() {
      const confPlayers = this.lobbyInfo.config.players;
      const currGame = gameInfo[this.lobbyInfo.game];
      const maxPlayers = Math.min(currGame ? currGame.config.players.max : 0, confPlayers);
      const playerCount = this.lobbyInfo.players.length;
      const isSpectator = this.lobbyInfo.spectators.find(p => p.id === this.$root.playerId);

      // There is an available place for this player
      const openSpot = (!maxPlayers || playerCount < maxPlayers);

      const notMaxPlayers = (
        // The amount of players is flexible
        !confPlayers || confPlayers === '#numPlayers' ||

        // There are no players
        playerCount === 0
      ) && openSpot;

      return notMaxPlayers || !currGame;
    },
    currGame() {
      return gameInfo[this.lobbyInfo.game];
    }
  },
  methods: {
    configVal(name) {
      const confVal = this.lobbyInfo.config[name];
      const defVal = gameInfo[this.lobbyInfo.game].config[name].defaults;
      return typeof confVal !== 'undefined' ? confVal : defVal;
    },
    deriveConfigText(name) {
      const val = this.configVal(name);
      const conf = gameInfo[this.lobbyInfo.game].config[name];

      switch(conf.type) {
      case 'int':      
        return this.deriveConfigValue(name);
      case 'bool':
        return val === 'true' ? 'Yes' : 'No';
      case 'list':
        const entry = conf.options.find(v => v.name === val);
        return entry ? entry.text : '???';
      }
    },
    deriveConfigValue(name) {
      const val = this.configVal(name);
      const conf = gameInfo[this.lobbyInfo.game].config[name];

      switch(conf.type) {
      case 'int':      
        switch(val) {
        case '#numPlayers':
          return Math.max(Math.min(this.lobbyInfo.players.length, conf.max), conf.min);
        default:
          return val;
        }
      case 'bool':
        return val;
      case 'list':
        return val
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
            if(this.state === 'NO_LOBBY' || this.state === 'LOADING')
              this.state = 'JOIN_LOBBY';
            this.$socket.emit('lobby:join', lobbyCode);
            this.validLobby = true;
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
        this.state = this.lobbyInfo && this.lobbyInfo.state === 'PLAYING' ? 'PLAYING' : 'LOBBY_WAITING';
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
    'game:info': function(state) {
      this.gameState = state;
    },
    'lobby:info': function(info) {
      this.changeGame = false;
      // TODO implement spectators on server

      // Remove gameState if we are not playing
      if(info.state !== 'PLAYING')
        this.gameState = { icons: {} };

      // Start playing if the lobby is playing
      if(info.state === 'PLAYING' && this.state === 'LOBBY_WAITING')
        this.state = 'PLAYING';

      // If the lobby says we're not playing, we're probably not playing
      if(this.state === 'PLAYING' && info.state === 'WAITING')
        this.state = 'LOBBY_WAITING';

      this.lobbyInfo = info;
    },
    disconnect(code) {
      this.validLobby = false;
      this.state = 'NO_LOBBY';
    },
    connect() {
      const lobbyCode = this.$route.params.code;
      if(this.loading) {
        return;
      }
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