<template>
  <div>
    <ooc-timer v-if="!game.reveal"
      :start="game.start"
      :duration="game.duration * 60">
    </ooc-timer>
    <div v-if="player.state && !game.reveal && !game.guessing"
      style="margin: 16px 0">
      <h2 is="sui-header">
        <sui-header-subheader>
          Take turns asking questions to determine who is underground
          starting with <b>{{nameTable[game.first]}}</b>.
        </sui-header-subheader>
      </h2>
      <sui-card v-if="showRole">
        <sui-card-content v-if="player.state === 'LOCATION'">
          The location is <b>{{player.location}}</b>.<br/>
          Find the underground player before time runs out!
        </sui-card-content>
        <sui-card-content v-else-if="player.state === 'UNDERGROUND'">
          You are <b>Underground</b>.<br/>
          Try to guess the location!
        </sui-card-content>
      </sui-card>
      <sui-button
        @click="showRole = !showRole"
        :basic="!showRole"
        primary>
        {{showRole ? 'Hide Location' : 'Show Location'}}
      </sui-button>
    </div>
    <div v-else-if="game.reveal || game.guessing">
      <sui-card style="margin-bottom: 16px;">
        <sui-card-content v-if="game.reveal">
          The location was <b>{{game.location}}</b>.
        </sui-card-content>
        <sui-card-content v-else>
          <b>{{nameTable[game.underground]}}</b> has <b>1 minute</b> to guess the location.
        </sui-card-content>
        <sui-card-content>
          <b>{{nameTable[game.underground]}}</b> was <b>Underground</b>.
        </sui-card-content>
      </sui-card>
    </div>
    <div>
      <sui-divider horizontal>Locations</sui-divider>
      <sui-table basic unstackable>
        <sui-table-body>
          <sui-table-row v-for="(row, i) in locationArr" :key="i">
            <sui-table-cell v-for="(cell, j) in row"
              :key="j"
              style="text-align: center;">
              {{cell}}
            </sui-table-cell>
          </sui-table-row>
        </sui-table-body>
      </sui-table>
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
      this.locationArr = _.chunk(info.locations, this.rowCount);
    },
    'game:player:info': function(info) {
      this.player = info;
      if(info.state === 'WAITING')
        this.line = '';
    }
  },
  created() {
    this.$socket.emit('lobby:info');
    this.$socket.emit('game:info');
  },
  computed: {
    nameTable() {
      return this.lobby.players.reduce((obj, p) => ({...obj, [p.playerId]: p.name}), {});
    },
  },
  data() {
    return {
      locationArr: [],
      rowCount: 2,
      showRole: true,
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
