<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header"
        v-if="player.link"
        :icon="player.link.type === 'desc' ? 'paint brush' : 'pencil'">
        <div v-if="player.link.type === 'image'">
          The last player drew...
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
      <sui-form @submit="writeLine" v-if="!player.link || player.link.type === 'image'">
        <sui-form-field>
          <label>{{!player.link ? 'Thing to Draw' : 'This is...'}}</label>
          <textarea v-model="line" rows="2"></textarea>
        </sui-form-field>
        <sui-button type="submit"
          primary
          :disabled="line.length < 1 || line.length > 255">
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
      <sui-loader active centered inline size="huge">
        Waiting on Other Players
      </sui-loader>
    </div>
    <div v-else-if="player.state === 'READING' || !player.state && game.chains && game.chains.length">
      <sui-divider horizontal>
        Chains
      </sui-divider>
      <div>
        <sui-card v-for="(chain, i) in game.chains" :key="i">
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
          <sui-card-content v-if="chain.length % 2 == 1">
            <div style="font-family: 'Lora', serif; padding: 0 14px">
              {{chain[0].link.data}}
            </div>
            <sui-divider horizontal>TO</sui-divider>
            <div style="font-family: 'Lora', serif; padding: 0 14px">
              {{chain[chain.length-1].link.data}}
            </div>
          </sui-card-content>
        </sui-card>
      </div>
      <sui-button v-if="player.state === 'READING'"
        style="margin-top: 16px"
        @click="$socket.emit('game:message', 'draw:done', game.icons[player.id] !== 'check')"
        primary
        :basic="game.icons[player.id] === 'check'" >
        {{game.icons[player.id] === 'check' ? 'Still Looking' : 'Done Looking'}}
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge">
        Art is being created and described
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
      if(this.player.state !== info.state) {
        switch(info.state) {
        case 'WAITING':
          this.line = '';
          break;
        case 'EDITING':
          vibrate(40);
          break;
        case 'READING':
          vibrate(40, 100, 40);
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

      if(this.line.length < 1 || this.line.length > 255)
        return;

      this.$socket.emit('game:message', 'draw:desc', this.line);
      this.line = '';
    }
  },
  data() {
    return {
      line: '',
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
