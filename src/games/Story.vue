<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header" icon="pencil" v-if="player.isLastLine">
        Finish the story! The last author wrote...
        <sui-header-subheader>
          {{player.line}}
        </sui-header-subheader>
      </h2>
      <h2 is="sui-header" icon="pencil" v-else-if="player.line">
        The last author wrote....
        <sui-header-subheader>
          {{player.line}}
        </sui-header-subheader>
      </h2>
      <h2 is="sui-header" icon="pencil" v-else-if="!player.line">
        Write the first line
      </h2>
      <sui-form @submit="writeLine">
        <sui-form-field>
          <label>The Story Goes...</label>
          <textarea v-model="line" rows="2"></textarea>
        </sui-form-field>
        <sui-button type="submit"
          primary
          :disabled="line.length < 1 || line.length > 255">
          Sign
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
        <sui-card v-for="(story, i) in game.stories" :key="i">
          <sui-card-content>
            <sui-comment-group>
              <sui-comment v-for="(entry, j) in story" :key="j">
                <sui-comment-content>
                  <sui-comment-author v-if="nameTable[entry.editor]">
                    {{nameTable[entry.editor]}}
                  </sui-comment-author>
                  <sui-comment-text>
                    <p>{{entry.line}}</p>
                  </sui-comment-text>
                </sui-comment-content>
              </sui-comment>
            </sui-comment-group>
          </sui-card-content>
        </sui-card>
      </div>
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

      if(this.line.length < 1 || this.line.length > 255)
        return;

      this.$socket.emit('game:message', 'story:line', this.line);
      this.line = '';
    }
  },
  data() {
    return {
      line: '',
      player: { state: '' },
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