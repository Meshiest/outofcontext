<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header" icon="pencil" v-if="player.link.length !== 0">
        {{player.isLastLink ? 'Finish the story! ' : ''}}The last author{{player.link.length !== 1 ? 's' : ''}} wrote....
        <div style="margin-top: 10px">
          <div v-for="(link, i) in player.link">
            <sui-divider horizontal v-if="i !== 0">Then</sui-divider>
            <sui-header-subheader>
              {{link}}
            </sui-header-subheader>
          </div>
        </div>
      </h2>
      <h2 is="sui-header" icon="pencil" v-else-if="player.link.length === 0">
        Write the first line
      </h2>
      <sui-form @submit="writeLine">
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
          :disabled="line.length < 1 || line.length > 512">
          {{player.isLastLink ? 'Finish' : 'Sign'}}
        </sui-button>
      </sui-form>
    </div>
    <div v-else-if="player.state === 'WAITING'"
      style="margin: 16px">
      <sui-loader active centered inline size="huge">
        Waiting on Other Authors
      </sui-loader>
    </div>
    <div v-else-if="player.state === 'READING' || !player.state && game.stories && game.stories.length">
      <sui-divider horizontal>
        Stories
      </sui-divider>
      <div style="text-align: left">
        <div v-for="(story, i) in game.stories" :key="i">
          <sui-divider horizonal v-if="i > 0"></sui-divider>
          <sui-card>
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
        primary
        :basic="game.icons[player.id] === 'check'" >
        {{game.icons[player.id] === 'check' ? 'Still Reading' : 'Done Reading'}}
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge">
        Stories are Being Written
      </sui-loader>
    </div>
    <sui-progress
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
  created() {
    this.$socket.emit('game:info');
    this.$socket.emit('lobby:info');
  },
  computed: {
    nameTable() {
      return this.lobby.players.reduce((obj, p) => ({...obj, [p.playerId]: p.name}), {});
    }
  },
  methods: {
    writeLine(event) {
      event.preventDefault();

      if(this.line.length < 1 || this.line.length > 512)
        return;

      this.$socket.emit('game:message', 'story:line', this.line);
      this.line = '';
    }
  },
  data() {
    return {
      line: '',
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
