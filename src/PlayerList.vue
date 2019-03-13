<template>
  <div>
    <sui-divider horizontal>
      Lobby Members
    </sui-divider>
    <sui-table basic class="player-table">
      <sui-table-header>
        <sui-table-row>
          <th style="position: relative;">
            Players
            <span class="user-icons" v-if="isAdmin">
              <sui-button :basic="!changeMode"
                @click="changeMode = !changeMode; removeMode = false"
                color="blue"
                icon="shield"
                size="tiny">
              </sui-button>
              <sui-button :basic="!removeMode"
                @click="removeMode = !removeMode; changeMode = false"
                color="red"
                icon="times"
                size="tiny">
              </sui-button>
            </span>
          </th>
        </sui-table-row>
      </sui-table-header>
      <sui-table-body>
        <sui-table-row v-for="p in players"
          :key="p.playerId"
          :negative="!p.connected"
          :positive="$root.playerId === p.id">
          <td>
            {{p.name}}
            <span class="user-icons">
              <sui-button v-if="!p.connected && isSpectator"
                size="tiny"
                @click="$socket.emit('lobby:replace', p.playerId)"
                basic>
                Join
              </sui-button>
              <sui-button v-if="isAdmin && removeMode && p.id !== $root.playerId && p.connected"
                size="tiny"
                color="red"
                @click="$socket.emit('lobby:admin:toggle', p.id); removeMode = false"
                basic>
                Remove
              </sui-button>
              <sui-button v-if="isAdmin && changeMode && p.id !== $root.playerId && p.connected"
                size="tiny"
                color="blue"
                @click="$socket.emit('lobby:admin:grant', p.id); changeMode = false"
                basic>
                Change
              </sui-button>
               <sui-icon
                v-if="admin === p.id"
                color="grey"
                name="shield"/>
              <sui-icon
                v-if="$root.playerId === p.id"
                color="grey"
                name="user"/>
              <sui-icon
                v-if="gameState.icons[p.playerId]"
                color="grey"
                :name="gameState.icons[p.playerId]"/>
              <sui-icon
                v-if="!p.connected"
                color="grey"
                name="times"/>
            </span>
          </td>
        </sui-table-row>
        <sui-table-row v-if="!players.length">
          <td>
            <i>No Players</i>
          </td>
        </sui-table-row>
      </sui-table-body>
    </sui-table>
    <sui-table basic class="player-table">
      <sui-table-header>
        <sui-table-row>
          <th>Spectators</th>
        </sui-table-row>
      </sui-table-header>
      <sui-table-body>
        <sui-table-row v-for="p in spectators"
          :key="p.id"
          :positive="$root.playerId === p.id">
          <td v-if="p.name">
            {{p.name}}
            <span class="user-icons">
              <sui-icon
                v-if="$root.playerId === p.id"
                color="grey"
                name="user"/>
            </span>
          </td>
          <td v-else>
            <i>Pending</i>
          </td>
        </sui-table-row>
        <sui-table-row v-if="!spectators.length">
          <td>
            <i>No Spectators</i>
          </td>
        </sui-table-row>
      </sui-table-body>
    </sui-table>
    <div>
      <sui-button v-if="players.find(p => p.id === $root.playerId)"
        basic
        @click="$socket.emit('lobby:spectate')">
        Spectate
      </sui-button>
      <div v-else-if="isSpectator" basic>
        <sui-button v-if="canJoinPlayers"
          basic
          @click="$socket.emit('lobby:spectate')">
          Join Players
        </sui-button>
        <router-link
          basic
          is="sui-button"
          to="/">
          Leave
        </router-link>
      </div>
      <sui-button :basic="!confirmEndGame"
        color="red"
        @click="tryEndGame"
        v-if="$root.playerId === admin && lobbyState === 'PLAYING'">
        {{confirmEndGame ? 'Are You Sure?' : 'End Game'}}
      </sui-button>
    </div>
  </div>
</template>

<style>

td {
  position: relative;
}

.user-icons {
  position: absolute;
  right: .5em;
  top: 0;
  height: 100%;
  align-items: center;
  display: flex;
}

.user-icons button:not(:last-child) {
  margin-right: 8px !important;
}

.user-icons i {
  height: 18px;
}

</style>

<script>
export default {
  props: [
    'players', 'admin', 'spectators',
    'isSpectator', 'canJoinPlayers',
    'lobbyState', 'gameState',
  ],
  methods: {
    tryEndGame() {
      clearTimeout(this.confirmTimeout);
      if(this.confirmEndGame) {
        this.confirmEndGame = false;
        this.$socket.emit('game:end');
      } else {
        this.confirmEndGame = true;
        this.confirmTimeout = setTimeout(() => this.confirmEndGame = false, 1000);
      }
    },
  },
  computed: {
    isAdmin() {
      return this.$root.playerId === this.admin;
    },
  },
  created() {
  },
  data() {
    return {
      confirmTimeout: undefined,
      confirmEndGame: false,
      removeMode: false,
      changeMode: false,
    };
  },
};
</script>