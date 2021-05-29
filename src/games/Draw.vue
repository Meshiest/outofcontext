<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header"
        v-if="player.link"
        :icon="player.link.type === 'desc' ? 'paint brush' : 'pencil'">
        <div v-if="player.link.type === 'image'">
          The last player drew...
          <div style="margin-top: 14px"></div>
          <ooc-doodle read-only="true" :image="player.link.data">
          </ooc-doodle>
        </div>
        <div v-else-if="player.link.type === 'desc'">
          <sui-header-subheader>
            You must draw this:
          </sui-header-subheader>
            {{player.link.data}}
        </div>
      </h2>
      <h2 is="sui-header" icon="pencil" v-else-if="!player.link">
        What Should be Drawn?
      </h2>
      <sui-form @submit="writeLine" v-if="!player.link || player.link.type === 'image'"
        :inverted="darkMode">
        <sui-form-field>
          <label>{{!player.link ? 'Thing to Draw' : 'This is...'}}</label>
          <textarea v-model="line" rows="2"></textarea>
          <div class="char-count">
            {{line.length}}/256
          </div>
        </sui-form-field>
        <sui-button type="submit"
          color="blue"
          :inverted="darkMode"
          :disabled="line.length < 1 || line.length > 256">
          Describe
        </sui-button>
      </sui-form>
      <div v-else-if="player.link && player.link.type === 'desc'">
        <ooc-doodle @save="image => $socket.emit('game:message', 'draw:image', image)"
          :timer="game.timeLimit"
          :colors="game.colors">
        </ooc-doodle>
      </div>
    </div>
    <div v-else-if="player.state === 'WAITING'"
      style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Waiting on Other Players
      </sui-loader>
    </div>
    <div v-else-if="player.state === 'READING' || !player.state && chains.length">
      <sui-divider horizontal :inverted="darkMode">
        Chains
      </sui-divider>
      <sui-loader active centered inline size="huge" :inverted="darkMode" v-if="!chains.length">
        Loading Chains
      </sui-loader>
      <div>
        <sui-card v-for="(chain, i) in chains" :key="i">
          <div class="like-bar">
            <div :is="player.state ? 'sui-button' : 'sui-label'"
              :color="player.state && !player.liked[i] ? 'grey' : 'red'"
              @click="player.state && $socket.emit('game:message', 'chain:like', i)"
              icon="heart"
              size="tiny">
              {{game.likes[i]}}
            </div>
          </div>
          <sui-card-content style="padding: 14px 0;">
            <sui-comment-group>
              <sui-comment v-for="(entry, j) in chain" :key="j">
                <sui-comment-content>
                  <sui-comment-text>
                    <p v-if="entry.link.type === 'desc'"
                      style="font-family: 'Lora', serif; padding: 0 14px">
                      {{entry.link.data}}
                    </p>
                    <div v-else-if="entry.link.type === 'image'"
                      style="margin-bottom: 16px;">
                      <ooc-doodle read-only="true"
                        :image="entry.link.data">
                      </ooc-doodle>
                    </div>
                  </sui-comment-text>
                  <sui-comment-author v-if="nameTable[entry.editor]"
                    style="text-align: right; padding: 0 14px">
                    &mdash;{{nameTable[entry.editor]}}
                  </sui-comment-author>
                </sui-comment-content>
              </sui-comment>
            </sui-comment-group>
          </sui-card-content>
          <sui-card-content v-if="chain.length % 2 == 1" :style="{marginBottom: '14px'}">
            <div class="draw-chain-ending">
              {{chain[0].link.data}}
            </div>
            <sui-divider horizontal :inverted="darkMode">TO</sui-divider>
            <div class="draw-chain-ending">
              {{chain[chain.length-1].link.data}}
            </div>
          </sui-card-content>
        </sui-card>
      </div>
      <sui-button v-if="player.state === 'READING'"
        style="margin-top: 16px"
        @click="$socket.emit('game:message', 'draw:done', game.icons[player.id] !== 'check')"
        color="blue"
        :inverted="darkMode"
        :basic="game.icons[player.id] === 'check'" >
        {{game.icons[player.id] === 'check' ? 'Still Looking' : 'Done Looking'}}
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Art is being created and described
      </sui-loader>
    </div>
    <sui-progress
      :inverted="darkMode"
      v-if="game.progress !== 1"
      state="active"
      progress
      indicating
      :percent="Math.round((game.progress || 0) * 100)"/>
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
      if (this.game.isComplete && !this.requestedResults) {
        this.$socket.emit('game:message', 'draw:result');
        this.requestedResults = true;
      }
    },
    'draw:result': function(chains) {
      this.chains = chains;
    },
    'game:player:info': function(info) {
      // keep track of how long turns are
      const logWait = (event, name, playing) => {
        if(!this.playing) {
          this.playing = playing;
          return;
        }
        gtag('event', event, {
          [name]: Math.floor((Date.now() - this.timer)/1000),
          game_name: this.lobby.game,
          lobby_code: this.$route.params.code,
        });
        this.timer = Date.now();
        this.playing = playing;
      }

      if(this.player.state !== info.state) {
        switch(info.state) {
        case 'WAITING':
          this.line = '';
          logWait('turn_event', 'turn_duration', true);
          break;
        case 'EDITING':
          vibrate(40);
          logWait('wait_event', 'wait_duration', true);
          this.playTurnSound();
          break;
        case 'READING':
          vibrate(40, 100, 40);
          logWait('wait_event', 'wait_duration', false);
          break;
        }
      }
      info.link = info.link && info.link[0];
      this.player = info;
    }
  },
  beforeDestroy() {
    this.bus.$off('toggle-dark-mode', this.update);
  },
  created() {
    this.bus.$on('toggle-dark-mode', this.update);
    this.$socket.emit('game:info');
    this.$socket.emit('lobby:info');
  },
  computed: {
    nameTable() {
      return this.lobby.players.reduce((obj, p) => ({...obj, [p.playerId]: p.name}), {});
    }
  },
  methods: {
    update() { this.$forceUpdate(); },
    writeLine(event) {
      event.preventDefault();

      if(this.line.length < 1 || this.line.length > 256)
        return;

      this.$socket.emit('game:message', 'draw:desc', this.line);
      this.line = '';
    }
  },
  data() {
    return {
      line: '',
      requestedResults: false,
      chains: [],
      player: { state: '', id: '', },
      game: { icons: {}, likes: [], },
      timer: Date.now(),
      playing: false,
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
