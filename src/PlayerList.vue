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
            <span class="user-icons">
              <sui-popup hoverable>
                <div class="emote-list">
                  <sui-button v-for="emote in emotes"
                    circular
                    @click="$socket.emit('lobby:emote', emote)"
                    :icon="emote" />
                </div>
                <sui-button basic
                  slot="trigger"
                  color="green"
                  icon="chat"
                  size="tiny">
                </sui-button>
              </sui-popup>
              <sui-button :basic="!changeMode"
                v-if="isAdmin"
                @click="changeMode = !changeMode; removeMode = false"
                color="blue"
                icon="shield"
                size="tiny">
              </sui-button>
              <sui-button :basic="!removeMode"
                v-if="isAdmin"
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
            <span class="emote-container" :ref="`emote_${p.id}`"></span>
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
            <span class="emote-container" :ref="`emote_${p.id}`"></span>
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


.emote-list {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
}

.emote-list .button {
  margin: 2px !important;
}

.emote-list .button i {
  align-items: center;
  display: flex;
  font-size: 24px;
  height: 24px !important;
  justify-content: center;
  width: 24px !important;
}

.emote-container {
  position: relative;
  width: 30px;
  margin-left: 20px;
  display: inline-block;
}

.emote {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  font-size: 30px !important;
  opacity: 0;
  animation: emote 3s ease-in-out;
  transition: opacity .5s;
}

.emote.end-anim {
  opacity: 0;
  animation: none;
}

@keyframes emote {
  0% {
    opacity: 0.2;
    transform: translate(calc(-50% - 20px), -50%) scale(.9);
  }
  10% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  90% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    display: none;
    opacity: 0;
    transform: translate(calc(-50% + 20px), -50%) scale(.9);
  }
}

</style>

<script>
export default {
  props: [
    'players', 'admin', 'spectators',
    'isSpectator', 'canJoinPlayers',
    'lobbyState', 'gameState',
  ],
  sockets: {
    'lobby:emote': function([pid, emote]) {
      const parent = this.$refs[`emote_${pid}`][0];
      parent.childNodes.forEach(e => {
        e.classList.add('end-anim');
      });
      const elem = document.createElement('i');
      elem.setAttribute('class', `emote icon grey ${emote}`);
      setTimeout(() => elem.remove(), 3000);
      parent.appendChild(elem);
    },
  },
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
      emotes: [
        'smile',
        'frown',
        'hand peace',
        'heart',
        'question',
        'exclamation',
        'wait',
        'write',
        'check',
        'times',
        'thumbs up',
        'thumbs down',
      ],
    };
  },
};
</script>