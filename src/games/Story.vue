<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header" icon="pencil" v-if="player.link.length !== 0">
        {{player.isLastLink ? 'Finish the story! ' : ''}}The last author{{player.link.length !== 1 ? 's' : ''}} wrote....
        <div style="margin-top: 10px">
          <div v-for="(link, i) in player.link" :key="i">
            <sui-divider horizontal v-if="i !== 0" :inverted="darkMode">Then</sui-divider>
            <sui-header-subheader>
              {{link}}
            </sui-header-subheader>
          </div>
        </div>
      </h2>
      <h2 is="sui-header" icon="pencil" v-else-if="player.link.length === 0">
        Write the first line
      </h2>
      <sui-form @submit="writeLine" :inverted="darkMode">
        <sui-form-field>
          <label>The Story Goes...</label>
          <textarea v-model="line" rows="2">
          </textarea>
          <div class="char-count">
            {{line.length}}/512
          </div>
        </sui-form-field>
        <sui-button type="submit"
          :color="player.isLastLink ? 'green' : 'blue'"
          :inverted="darkMode"
          :disabled="line.length < 1 || line.length > 512">
          {{player.isLastLink ? 'Finish' : 'Sign'}}
        </sui-button>
      </sui-form>
    </div>
    <div v-else-if="player.state === 'WAITING'"
      style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Waiting on Other Authors
      </sui-loader>
    </div>
    <div v-else-if="player.state === 'READING' || !player.state && stories.length">
      <sui-divider horizontal :inverted="darkMode">
        Stories
      </sui-divider>
      <sui-loader active centered inline size="huge" :inverted="darkMode" v-if="!stories.length">
        Loading Stories
      </sui-loader>
      <div style="text-align: left">
        <div v-for="(story, i) in stories" :key="i">
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
            <sui-card-content :style="{marginBottom: story[0].editor ? 0 : '14px'}">
              <sui-comment-group>
                <sui-comment v-for="(entry, j) in story" :key="j">
                  <sui-comment-content>
                    <sui-comment-text>
                      <p style="font-family: 'Lora', serif;">
                        {{entry.link}}
                      </p>
                    </sui-comment-text>
                    <sui-comment-author v-if="nameTable[entry.editor]"
                      style="text-align: right;">
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
        @click="$socket.emit('game:message', 'story:done', game.icons[player.id] !== 'check')"
        color="blue"
        :inverted="darkMode"
        :basic="game.icons[player.id] === 'check'" >
        {{game.icons[player.id] === 'check' ? 'Still Reading' : 'Done Reading'}}
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Stories are Being Written
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
        this.$socket.emit('game:message', 'story:result');
        this.requestedResults = true;
      }
    },
    'story:result': function(stories) {
      this.stories = stories;
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
    update() { this.$forceUpdate(); },
    writeLine(event) {
      event.preventDefault();

      if(this.line.length < 1 || this.line.length > 512)
        return;

      this.$socket.emit('game:message', 'story:line', this.line);
      this.line = '';
    },
  },
  data() {
    return {
      line: '',
      stories: [],
      requestedResults: false,
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
