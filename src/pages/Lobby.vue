<template>
  <ooc-page>
    <ooc-menu v-if="state === 'NO_LOBBY'"
      title="Invalid Lobby"
      subtitle="This lobby does not exist">
      <div>
        <sui-divider horizontal :inverted="darkMode">
          Lobby
        </sui-divider>
        <sui-button-group>
          <sui-button
            color="green"
            :inverted="darkMode"
            :loading="creatingLobby"
            @click="createLobby">
            Create
          </sui-button>
          <sui-button-or/>
          <sui-button
            color="blue"
            :inverted="darkMode"
            :loading="showJoinLobby"
            @click="showJoinLobby = true">
            Join
          </sui-button>
        </sui-button-group>
        <sui-divider horizontal :inverted="darkMode">
          Redirect
        </sui-divider>
        <sui-button-group vertical :basic="!darkMode" :inverted="darkMode">
          <router-link is="sui-button" :basic="darkMode" :inverted="darkMode"
            to="/">
            Home
          </router-link>
          <a is="sui-button"
            href="https://github.com/meshiest/outofcontext/issues"
            target="_blank"
            :basic="darkMode"
            :inverted="darkMode"
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
        :inverted="darkMode"
        @submit="e => enterName(e)"
        :error="!validName"
        :loading="loadingName">
        <sui-form-field>
          <label>Name</label>
          <input name="playerName"
            required
            @input="validName = true"
            v-model="name"
            minlength="1"
            maxlength="15"
            autocomplete="on"
            placeholder="Ethan">
        </sui-form-field>
        <sui-button color="blue" :inverted="darkMode" type="submit">
          Join
        </sui-button>
        <router-link
          is="sui-button"
          :basic="darkMode"
          :inverted="darkMode"
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
          <sui-divider horizontal :inverted="darkMode">
            Game Info
          </sui-divider>
          <sui-card :inverted="darkMode">
            <sui-card-content>
              <sui-card-header>
                {{currGame.title}}
              </sui-card-header>
              <sui-card-description>
                {{currGame.description}}
              </sui-card-description>
            </sui-card-content>
            <sui-card-content>
              <sui-card-content style="text-align: left;">
                <sui-accordion exclusive styled :inverted="darkMode">
                  <sui-accordion-title>
                    <sui-icon name="dropdown"/>More Info
                  </sui-accordion-title>
                  <sui-accordion-content>
                    {{currGame.more}}
                  </sui-accordion-content>
                  <sui-accordion-title>
                    <sui-icon name="dropdown"/>How to Play
                  </sui-accordion-title>
                  <sui-accordion-content>
                    <ul style="padding-left: 20px; margin: 0">
                      <li v-for="(step, i) in currGame.howTo" :key="i">{{step}}</li>
                    </ul>
                  </sui-accordion-content>
                  <sui-accordion-title>
                    <sui-icon name="dropdown"/>Configurations
                  </sui-accordion-title>
                  <sui-accordion-content>
                    <div v-for="(opt, name) in currGame.config" :key="name">
                      <b>{{opt.name}}</b>: {{opt.info}}
                    </div>
                  </sui-accordion-content>
                </sui-accordion>
              </sui-card-content>
            </sui-card-content>
            <sui-card-content extra>
              <sui-icon name="clock"/> {{currGame.playTime}}
              <span style="padding-left: 20px"/>
              <sui-icon name="users"/> {{
                `${currGame.config.players.min}${currGame.config.players.max != 256 ? '-' + currGame.config.players.max : '+'}`
              }}
              <span style="padding-left: 20px"/>
              <sui-icon name="fire"/> {{currGame.difficulty}}
            </sui-card-content>
          </sui-card>
        </div>
        <div v-else-if="!hideLobbyCode">
          <sui-divider horizontal :inverted="darkMode">
            Lobby Code
          </sui-divider>
          <sui-statistic :inverted="darkMode" style="margin-bottom: 14px; margin-top: 0;">
            <sui-statistic-value>
              {{$route.params.code}}
            </sui-statistic-value>
            <sui-statistic-label>
              {{phonetic}}
            </sui-statistic-label>
          </sui-statistic>
        </div>
        <div v-if="lobbyInfo.admin === $root.playerId" style="text-align: left">
          <sui-divider horizontal :inverted="darkMode">
            Game Settings
          </sui-divider>
          <sui-form @submit="event => event.preventDefault()" :inverted="darkMode">
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
              <sui-form-field v-for="(opt, name) in currGame.config" :key="name">
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
                    :color="configVal(name) === '#numPlayers' ? 'blue' : undefined"
                    :inverted="darkMode"
                    @click="updateConfig(name, '#numPlayers')"
                    style="margin-left: 8px"
                    icon="users"/>
                </div>
                <div class="char-count" v-if="typeof opt.max !== 'undefined'  && deriveConfigValue(name) > opt.max">
                  Maximum: {{opt.max}}
                </div>
                <div class="char-count" v-if="typeof opt.min !== 'undefined' &&
                (deriveConfigValue(name) < opt.min || configVal(name) === '#numPlayers' && lobbyInfo.players.length < opt.min)">
                  Minimum: {{opt.min}}
                </div>
                <sui-dropdown v-else-if="opt.type === 'bool'"
                  :value="deriveConfigValue(name)"
                  :options="[{text: 'Enabled', value: 'true'}, {text: 'Disabled', value: 'false'}]"
                  @input="val => updateConfig(name, val)"
                  selection>
                </sui-dropdown>
                <sui-dropdown v-else-if="opt.type === 'list'"
                  :value="deriveConfigValue(name)"
                  :options="opt.options.map(o => ({
                    text: o.more || o.text,
                    value: o.name,
                  }))"
                  @input="val => updateConfig(name, val)"
                  selection>
                </sui-dropdown>
              </sui-form-field>
              <div style="margin: 1em 0; text-align: center">
                <sui-button
                  type="button"
                  :inverted="darkMode"
                  :disabled="invalidConfig"
                  @click="$socket.emit('game:start')"
                  color="blue">
                  Start Game
                </sui-button>
              </div>
            </div>
          </sui-form>
        </div>
        <div v-else-if="currGame">
          <sui-divider horizontal :inverted="darkMode">
            Game Setup
          </sui-divider>
          <sui-card>
            <div style="display: flex; flex-flow: row wrap; align-items: center; justify-content: center;">
              <div v-for="(opt, name) in currGame.config"
                :key="name"
                style="margin: 8px;">
                <sui-statistic :inverted="darkMode">
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
      <sui-loader :inverted="darkMode" />
    </sui-dimmer>
    <sui-label
      v-if="validLobby && !rocketcrab && !hideLobbyCode"
      class="lobby-code left"
      attached="top left">
      <code>
        {{$route.params.code.toUpperCase()}}
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

import gameInfo from '../../gameInfo';
import converter, { NATO_PHONETIC_ALPHABET } from 'phonetic-alphabet-converter'

const alphabet = {
  ...NATO_PHONETIC_ALPHABET,
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
}

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
      name: localStorage.oocName || '',
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
      gameOptions: Object.entries(gameInfo)
        .map(([k, v]) => ({value: k, text: v.title, h: v.hidden}))
        .filter(o => !o.h),
    };
  },
  computed:  {
    phonetic() {
      return converter(this.$route.params.code, alphabet).join(' - ');
    },
    isSpectator() {
      return this.lobbyInfo.spectators.find(p => p.id === this.$root.playerId);
    },
    invalidConfig() {
      const numPlayers = this.lobbyInfo.players.length;
      for (const key in this.currGame.config) {
        if (this.lobbyInfo.config[key] === '#numPlayers' &&
          numPlayers < this.currGame.config[key].min)
          return true;
      }
      return false;
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
    update() { this.$forceUpdate(); },
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
          return Math.min(this.lobbyInfo.players.length, conf.max);
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
      if(lobbyCode !== code) {
        this.$router.replace({ query: 'foo' });
        this.$router.push(`/lobby/${code}`);
      }
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
      if(info.state === 'PLAYING' && this.state === 'LOBBY_WAITING') {
        this.state = 'PLAYING';
        gtag('event', 'playing_game', {
          game_name: info.game,
          player_count: info.players.length,
          lobby_code: this.$route.params.code,
        });
      }

      // If the lobby says we're not playing, we're probably not playing
      if (this.state === 'PLAYING' && info.state === 'WAITING')
        this.state = 'LOBBY_WAITING';

      let name = localStorage.oocName;
      const target = info.players.find(p => !p.connected && p.name === name);

      if (this.state === 'JOIN_LOBBY' && this.rocketcrab && this.$route.params.code.startsWith('rc')) {
        localStorage.oocName = name = this.rocketcrab.name;
        this.loadingName = true;
        this.$socket.emit('member:name', name);
        if (target)
          this.$socket.emit('lobby:replace', target.playerId);
      }

      // automatically rejoin if there is a joinable slot with this name
      else if (this.state === 'JOIN_LOBBY' && this.validLobby && name && target) {{
        this.loadingName = true;
        this.$socket.emit('member:name', name);
        this.$socket.emit('lobby:replace', target.playerId);
      }}

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
      if(!lobbyCode || lobbyCode.length < 4) {
        this.loading = false;
        this.state = 'NO_LOBBY';
      } else {
        this.testLobby();
      }
    }
  },
  beforeDestroy() {
    this.bus.$off('toggle-dark-mode', this.update);
    this.bus.$off('toggle-hide-lobby', this.update);
  },
  created() {
    this.bus.$on('toggle-dark-mode', this.update);
    this.bus.$on('toggle-hide-lobby', this.update);
    const lobbyCode = this.$route.params.code;
    if(!lobbyCode || lobbyCode.length < 4) {
      this.loading = false;
      this.state = 'NO_LOBBY';
    } else {
      this.testLobby();
    }
  }
};
</script>