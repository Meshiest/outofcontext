<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header" icon="paintbrush" v-if="player.link.length !== 0" :class="[{continuous: game.continuous}]">
        {{player.isLastLink
            ? 'Finish the sequence! '
            : game.continuous && player.link.length > 0 ? 'Continue the drawing!' : '' }} The last artist{{player.link.length !== 1 ? 's' : ''}} {{game.showCaptions && !game.showDrawings ? 'wrote' : 'drew'}}....
        <div style="margin-top: 10px">
          <div v-for="(link, i) in player.link" :key="i">
            <sui-divider horizontal v-if="i !== 0" :inverted="darkMode">Then</sui-divider>
            <sui-header-subheader v-if="game.showCaptions" style="margin-bottom: 8px;">
              {{link.caption}}
            </sui-header-subheader>
            <ooc-doodle read-only="true" :image="link.drawing" v-if="game.showDrawings">
            </ooc-doodle>
          </div>
        </div>
      </h2>
      <h2 is="sui-header" icon="paintbrush" v-else-if="player.link.length === 0">
        Draw the beginning!
      </h2>
      <h2 is="sui-header" icon="paintbrush" v-if="!game.continuous && player.link.length > 0" style="margin-top: 0">
        Continue the story...
      </h2>
      <sui-form @submit="fakeSubmit" :inverted="darkMode">
        <sui-form-field v-if="game.enableCaptions">
          <label>Caption</label>
          <textarea v-model="line" rows="2">
          </textarea>
          <div class="char-count">
            {{line.length}}/256
          </div>
        </sui-form-field>
        <ooc-doodle @save="image => submit(image)"
          :disabled="game.enableCaptions && (line.length < 1 || line.length > 256)"
          :colors="game.colors">
        </ooc-doodle>
      </sui-form>
      <h2 is="sui-header" icon="paintbrush" v-if="!player.isLastLink && game.continuous">
        Connect your drawing to the bottom of the canvas
      </h2>
    </div>
    <div v-else-if="player.state === 'WAITING'"
      style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Waiting on Other Artists
      </sui-loader>
    </div>
    <div v-else-if="player.state === 'READING' || !player.state && chains.length">
      <sui-divider horizontal :inverted="darkMode">
        Sequences
      </sui-divider>
      <sui-loader active centered inline size="huge" :inverted="darkMode" v-if="!chains.length">
        Loading Chains
      </sui-loader>
      <div style="text-align: left">
        <div v-for="(story, i) in chains" :key="i">
          <sui-divider horizonal v-if="i > 0" :inverted="darkMode"></sui-divider>
          <sui-card >
            <div class="like-bar">
              <div :is="player.state ? 'sui-button' : 'sui-label'"
                :color="player.state && !player.liked[i] ? 'grey' : 'red'"
                @click="player.state && $socket.emit('game:message', 'chain:like', i)"
                icon="heart"
                size="tiny">
                {{game.likes[i]}}
              </div>
            </div>
            <sui-card-content :style="{
              marginBottom: story[0].editor || game.continuous ? 0 : '14px',
              paddingLeft: 0,
              paddingRight: 0,
            }">
              <div v-if="game.continuous" class="continuous-result" style="margin-bottom: 25px;">
                <ooc-doodle
                  :author="story[0].editor ? nameTable[entry.editor] : ''"
                  v-for="(entry, j) in story" :key="j" read-only="true" :image="entry.link.drawing">
                </ooc-doodle>
              </div>
              <sui-comment-group v-else>
                <sui-comment v-for="(entry, j) in story" :key="j">
                  <sui-comment-content>
                    <sui-comment-text>
                      <p style="font-family: 'Lora', serif; text-align: center;" v-if="game.enableCaptions">
                        {{entry.link.caption}}
                      </p>
                      <ooc-doodle read-only="true" :image="entry.link.drawing">
                      </ooc-doodle>
                    </sui-comment-text>
                    <sui-comment-author v-if="nameTable[entry.editor]"
                      style="text-align: right; padding: 0 14px;">
                      &mdash;{{nameTable[entry.editor]}}
                    </sui-comment-author>
                  </sui-comment-content>
                </sui-comment>
              </sui-comment-group>
            </sui-card-content>
          </sui-card>
        </div>
      </div>
      <sui-button v-if="player.state === 'READING'"
        style="margin-top: 16px"
        @click="$socket.emit('game:message', 'comic:done', game.icons[player.id] !== 'check')"
        color="blue"
        :inverted="darkMode"
        :basic="game.icons[player.id] === 'check'" >
        {{game.icons[player.id] === 'check' ? 'Still Looking' : 'Done Looking'}}
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Sequences are Being Drawn
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

h2.continuous.icon.header {
  margin-bottom: 0;
  display: block;
}

.continuous .ooc-doodle .card,
.continuous .ooc-doodle .container {
  box-shadow: none !important;
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.dark-theme .continuous .ooc-doodle .card,
.continuous-result .card,
.continuous-result .ooc-doodle .container,
.continuous-result .ooc-doodle .ui.card {
  box-shadow: none !important;
}

.continuous-result .ooc-doodle:not(:last-child) .container,
.continuous-result .ooc-doodle:not(:last-child) .ui.card {
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.continuous-result .ooc-doodle:not(:first-child) .container,
.continuous-result .ooc-doodle:not(:first-child) .ui.card {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

.continuous .ooc-doodle .card {
  z-index: 1;
}

.continuous + form .card,
.continuous + form .ooc-doodle .container {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}

.field {
  position: relative;
}

.sub.header {
  word-break: break-word;
  max-width: 292px;
}

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
        this.$socket.emit('game:message', 'comic:result');
        this.requestedResults = true;
      }
    },
    'comic:result': function(chains) {
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
    fakeSubmit(e) { e.preventDefault(); },
    update() { this.$forceUpdate(); },
    submit(img) {
      if (this.game.enableCaption && (this.line.length < 1 || this.line.length > 256))
        return;

      this.$socket.emit('game:message', 'comic:line', {
        caption: this.line,
        drawing: img,
      });
      this.line = '';
    },
  },
  data() {
    return {
      line: '',
      requestedResults: false,
      chains: [],
      player: { state: '', id: '', },
      game: {
        icons: {},
        likes: [],
        colors: false,
        continuous: false,
        enableCaptions: false,
        showCaptions: false,
        showDrawings: false,
      },
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
