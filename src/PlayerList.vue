<template>
  <div>
    <sui-divider horizontal>
      Lobby Members
    </sui-divider>
    <sui-table basic class="player-table">
      <sui-table-header>
        <sui-table-row>
          <th>Players</th>
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

.user-icons button {
  margin-right: 8px !important;
}

.user-icons i {
  height: 18px;
}

</style>

<script>
export default {
  props: ['players', 'admin', 'spectators', 'isSpectator', 'canJoinPlayers', 'gameState'],
};
</script>