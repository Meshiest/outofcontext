<template>
  <div>
    <div v-if="player.state === 'READING'"
      style="margin: 16px 0">
      <h2 is="sui-header" icon="crosshairs">
        Target Dossier{{game.battleRoyale ? 's' : ''}}
        <sui-header-subheader>
          Screenshot this just in case
        </sui-header-subheader>
      </h2>
      <h2 is="sui-header" style="font-family: monospace; margin-top: 0;">
        Operation<br/>{{player.title}}
      </h2>
      <sui-card v-if="!game.battleRoyale">
        <sui-card-content>
          <sui-card-header>Target</sui-card-header>
          <sui-card-meta style="margin-bottom: 8px">
            You must <b>wurder</b> this player
          </sui-card-meta>
          <sui-label size="huge" color="red">
            {{nameTable[player.target]}}
          </sui-label>
        </sui-card-content>
        <sui-card-content>
          <sui-card-header>Weapons</sui-card-header>
          <sui-card-meta style="margin-bottom: 8px">
            Trick your target into <b>saying</b> one of these
          </sui-card-meta>
          <sui-label v-for="word in player.words" :key="word">
            {{word}}
          </sui-label>
        </sui-card-content>
      </sui-card>
      <sui-table v-else basic unstackable :inverted="darkMode">
        <sui-table-header>
          <sui-table-row>
            <sui-table-header-cell>
              Player
            </sui-table-header-cell>
            <sui-table-header-cell>
              Kill Words
            </sui-table-header-cell>
          </sui-table-row>
        </sui-table-header>
        <sui-table-body>
          <sui-table-row v-for="obj in player.targets" :key="obj.target">
            <sui-table-cell>
              {{nameTable[obj.target]}}
            </sui-table-cell>
            <sui-table-cell>
              <sui-label v-for="word in obj.words" :key="word" style="margin-top: 4px">
                {{word}}
              </sui-label>
            </sui-table-cell>
          </sui-table-row>
        </sui-table-body>
      </sui-table>
      <sui-button
        @click="$socket.emit('game:message', 'assassin:done', true)"
        :inverted="darkMode"
        color="blue">
        Done
      </sui-button>
    </div>
    <div v-else-if="player.state === 'DONE'"
      style="margin: 16px">
      <h2 is="sui-header" style="font-family: monospace; font-weight: normal">
        You are now free to <b style="color: #800">Wurder</b> to your heart's content
      </h2>
      <sui-button style="margin-top: 16px"
        @click="$socket.emit('game:message', 'assassin:done', false)"
        :inverted="darkMode"
        color="blue"
        basic
      >
        Show Dossier
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Wurderers Collecting Intel
      </sui-loader>
    </div>
  </div>
</template>

<style>
</style>

<script>
export default {
  sockets: {
    'lobby:info': function(info) {
      this.lobby = info;
    },
    'game:info': function(info) {
      this.game = info;
    },
    'game:player:info': function(info) {
      this.player = info;
      if(info.state === 'WAITING')
        this.line = '';
    }
  },
  beforeDestroy() {
    this.bus.$off('toggle-dark-mode', this.update);
  },
  created() {
    this.bus.$on('toggle-dark-mode', this.update);
    this.$socket.emit('lobby:info');
    this.$socket.emit('game:info');
  },
  methods: {
    update() { this.$forceUpdate(); },
  },
  computed: {
    nameTable() {
      return this.lobby.players.reduce((obj, p) => ({...obj, [p.playerId]: p.name}), {});
    }
  },
  data() {
    return {
      player: { state: '', id: '', },
      game: { icons: {} },
      lobby: ({
        admin: '',
        players: [],
        members: [],
        spectators: [],
        game: '',
        config: {},
      }),
    };
  },
};
</script>
