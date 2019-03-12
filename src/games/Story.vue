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
      <pre>
        {{JSON.stringify(game.stories, 0, 2)}}
      </pre>
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
      :percent="(game.progress || 0) * 100"/>
  </div>
</template>

<style>
</style>

<script>
export default {
  sockets: {
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
    };
  },
};
</script>