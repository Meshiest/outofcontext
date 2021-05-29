<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header" icon="lightbulb" v-if="player.link.type === 'theme'">
        Pick a Theme
        <sui-header-subheader>
          This theme will inspire the instructions
        </sui-header-subheader>
      </h2>
      <h2 is="sui-header" icon="pencil" v-if="player.link.type === 'step'">
        <sui-header-subheader>
          Write an instruction for:
        </sui-header-subheader>
        {{player.link.theme}}
        <sui-header-subheader>
          Step {{player.link.index}} of {{player.link.total}}
        </sui-header-subheader>
      </h2>
      <h2 is="sui-header" icon="comment" v-if="player.link.type === 'comment'">
        Comment on a Recipe.
        <div v-if="player.link.comments.length" style="font-size: 18px">
          Other reviewers wrote:
        </div>
        <div style="margin-top: 10px">
          <div v-for="(comment, i) in player.link.comments" :key="i">
            <sui-divider horizontal v-if="i !== 0" :inverted="darkMode">And</sui-divider>
            <sui-header-subheader>
              {{comment}}
            </sui-header-subheader>
          </div>
        </div>
      </h2>
      <h2 is="sui-header" icon="shopping basket" v-if="player.link.type === 'ingredient'">
        Add an Ingredient
        <div v-if="player.link.ingredients.length" style="font-size: 18px">
          Other Ingredients:
        </div>
        <div style="margin-top: 10px">
          <div v-for="(ingredients, i) in player.link.ingredients" :key="i">
            <sui-divider horizontal v-if="i !== 0" :inverted="darkMode">And</sui-divider>
            <sui-header-subheader>
              {{ingredients}}
            </sui-header-subheader>
          </div>
        </div>
      </h2>
      <sui-form @submit="writeLine" v-if="player.link.type !== 'step'" :inverted="darkMode">
        <sui-form-field>
          <label>{{{
            ingredient: 'An Object or Thing',
            comment: 'Recipe Comment',
            theme: 'Recipe Theme',
          }[player.link.type]}}</label>
          <textarea v-model="line" rows="2">
          </textarea>
          <div class="char-count">
            <span v-if="player.link.type ==='ingredient'">This will replace the word  &quot;<b>ITEM</b>&quot; in a random step.</span> {{line.length}}/256
          </div>
          <div class="char-count" v-if="line.includes('ITEM')">
            Are you sure you meant to put &quot;<b>ITEM</b>&quot; there?
          </div>
        </sui-form-field>
        <sui-button type="submit"
          :color="player.isLastLink ? 'green' : 'blue'"
          :inverted="darkMode"
          :disabled="line.length < 1 || line.length > 256">
          {{player.isLastLink ? 'Finish' : 'Sign'}}
        </sui-button>
      </sui-form>
      <sui-form @submit="writeLine" v-if="player.link.type === 'step'" :inverted="darkMode">
        <sui-form-field>
          <label>Instructions for Step #{{player.link.index}}.</label>
          <textarea v-model="line" rows="2">
          </textarea>
          <div class="char-count">
            <span v-if="line.indexOf('ITEM') === -1" style="color: #c99">
              The text &quot;<b>ITEM</b>&quot; must be in the instruction.
            </span> {{line.length}}/256
          </div>
          <div class="char-count">
            &quot;<b>ITEM</b>&quot; will be replaced with a random ingredient at the end.
          </div>
        </sui-form-field>
        <sui-button type="submit"
          :color="player.isLastLink ? 'green' : 'blue'"
          :inverted="darkMode"
          :disabled="line.length < 1 || line.length > 256 || line.indexOf('ITEM') === -1">
          {{player.isLastLink ? 'Finish' : 'Sign'}}
        </sui-button>
      </sui-form>
    </div>
    <div v-else-if="player.state === 'WAITING'"
      style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Waiting on Other Chefs
      </sui-loader>
    </div>
    <div v-else-if="player.state === 'READING' || !player.state && recipes.length">
      <sui-divider horizontal :inverted="darkMode">
        Recipes
      </sui-divider>
      <sui-loader active centered inline size="huge" :inverted="darkMode" v-if="!recipes.length">
        Loading Recipes
      </sui-loader>
      <div style="text-align: left">
        <div v-for="(recipe, i) in recipes" :key="i">
          <sui-divider horizonal v-if="i > 0" :inverted="darkMode"></sui-divider>
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
            <sui-card-content style="text-align: center;">
              <sui-card-header>{{recipe.theme}}</sui-card-header>
              <sui-card-meta v-if="recipe.author">by {{nameTable[recipe.author]}}</sui-card-meta>
            </sui-card-content>
            <sui-card-content>
              <sui-comment-group>
                <sui-comment v-for="(entry, j) in recipe.steps" :key="j">
                  <sui-comment-content>
                    <sui-comment-author style="text-align: center">
                      Step {{j + 1}}
                    </sui-comment-author>
                    <sui-comment-text>
                      <p style="font-family: 'Lora', serif;">
                        {{entry.link}}
                      </p>
                    </sui-comment-text>
                    <sui-comment-author v-if="entry.editors[0]"
                      style="text-align: right;">
                      &mdash;{{nameTable[entry.editors[0]]}} &amp; {{nameTable[entry.editors[1]]}}
                    </sui-comment-author>
                  </sui-comment-content>
                </sui-comment>
              </sui-comment-group>
            </sui-card-content>
            <sui-card-content style="padding-bottom: 28px;">
              <sui-comment-group>
                <sui-comment v-for="(comment, j) in recipe.comments" :key="j">
                  <sui-comment-content>
                    <sui-comment-author>
                      {{nameTable[comment.editor] || 'Anonymous'}}
                    </sui-comment-author>
                    <sui-comment-text>
                      {{comment.link}}
                    </sui-comment-text>
                  </sui-comment-content>
                </sui-comment>
              </sui-comment-group>
            </sui-card-content>
          </sui-card>
        </div>
      </div>
      <sui-button v-if="player.state === 'READING'"
        style="margin-top: 16px"
        @click="$socket.emit('game:message', 'recipe:done', game.icons[player.id] !== 'check')"
        color="blue"
        :inverted="darkMode"
        :basic="game.icons[player.id] === 'check'" >
        {{game.icons[player.id] === 'check' ? 'Still Reading' : 'Done Reading'}}
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Recipes are Being Developed
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
        this.$socket.emit('game:message', 'recipe:result');
        this.requestedResults = true;
      }
    },
    'recipe:result': function(recipes) {
      this.recipes = recipes;
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

      if(this.line.length < 1 || this.line.length > 256)
        return;

      this.$socket.emit(
        'game:message',
        this.player.link.type === 'theme' ? 'recipe:theme' : 'recipe:line',
        this.line
      );
      this.line = '';
    }
  },
  data() {
    return {
      line: '',
      requestedResults: false,
      recipes: [],
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
