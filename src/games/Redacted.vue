<template>
  <div>
    <div v-if="player.state === 'EDITING'"
      style="margin: 16px 0">
      <h2 is="sui-header"
        v-if="player.link"
        :icon="icons[player.link.type]">
        <div v-if="player.link.type === 'line'">
          Tamper With the Story
        </div>
        <div v-else-if="player.link.type === 'tamper' && player.link.kind === 'censor'">
          Decensor Text
        </div>
        <div v-else-if="player.link.type === 'tamper' && player.link.kind === 'truncate'">
          Repair Text
        </div>
        <div v-else-if="player.link.type === 'repair'">
          Continue the Story
        </div>
      </h2>
      <h2 is="sui-header" icon="pencil" v-else-if="!player.link">
        Write the first line
      </h2>
      <sui-form @submit="writeLine" v-if="!player.link || player.link.type === 'repair'"
       :inverted="darkMode">
        <div class="redacted-words" v-if="player.link" style="margin-top: 0;">
          <code v-for="(word, i) in player.link.data.line"
            :key="i"
            :style="{ cursor: 'initial' }"
            :class="[
              'tamperable',
              {
                redacted: word.type === 'word',
              },
            ]">{{word.value}}</code>
        </div>
        <sui-form-field>
          <label>The Story Goes...</label>
          <textarea v-model="line" rows="2"></textarea>
          <div class="char-count">
            {{line.length}}/256, {{wordCount(line)}} words
          </div>
        </sui-form-field>
        <sui-button type="submit"
          color="blue"
          :inverted="darkMode"
          :disabled="line.length < 1 || line.length > 256 || wordCount(line) === 0">
          Sign
        </sui-button>
      </sui-form>
      <sui-form @submit="editCensor" v-else-if="player.link && player.link.type === 'tamper' && player.link.kind === 'censor'"
        :inverted="darkMode">
        <div class="redacted-words">
          <code v-for="(word, i) in player.link.data.line"
            :key="i"
            :style="{
              textAlign: 'center',
              width: word.type === 'count' ? Math.max(Math.min(word.value, 12), 3) * 0.75 + 'em' : 'auto',
              display: word.type === 'count' ? 'inline-block' : 'inline',
              cursor: 'initial',
            }"
            :class="[
              'tamperable',
              {
                redacted: word.type === 'count',
              },
            ]">{{word.type === 'count' ? word.key + 1 : word.value || ''}}</code>
        </div>
        <sui-form-field v-for="(index, i) in player.link.data.indexes" :key="index">
          <label>Word {{i + 1}}</label>
          <sui-input
            :name="index"
            v-model="words[i]" />
          <div class="char-count">
            <span v-if="wordCount(words[i]) > 1" style="color: #c99">Too many words!</span>
            {{words[i] ? words[i].length : 0}}/32, {{wordCount(words[i])}} words
          </div>
        </sui-form-field>
        <sui-button type="submit"
          color="blue"
          :inverted="darkMode"
          :disabled="!validWords()">
          Repair
        </sui-button>
      </sui-form>
      <sui-form @submit="editTruncate" v-else-if="player.link && player.link.type === 'tamper' && player.link.kind === 'truncate'"
        :inverted="darkMode">
        <div class="redacted-words">
          <code class="tamperable">
            {{player.link.data.line.replace(' ', '&nbsp;')}}
          </code>
          <code class="tamperable redacted" style="cursor: initial;">
            {{'&nbsp;'.repeat(Math.floor(player.link.data.length))}}
          </code>
        </div>
        <sui-form-field>
          <label>Replacement</label>
          <textarea v-model="line" rows="2"></textarea>
          <div class="char-count">
            {{line.length}}/256, {{wordCount(line)}} words
          </div>
        </sui-form-field>
        <sui-button type="submit"
          color="blue"
          :inverted="darkMode"
          :disabled="line.length < 1 || line.length > 256">
          Repair
        </sui-button>
      </sui-form>
      <div v-else-if="player.link && player.link.type === 'line'">
        <div>
          <sui-button-group v-if="game.gamemode.censor !== 'none' && game.gamemode.truncate !== 'none'">
            <sui-button
              :color="darkMode ? 'grey' : 'black'"
              :inverted="darkMode"
              icon="cut"
              @click="tamperType = 'truncate'"
              :basic="tamperType !== 'truncate'">
              Truncate
            </sui-button>
            <sui-button-or />
            <sui-button
              :color="darkMode ? 'grey' : 'black'"
              :inverted="darkMode"
              icon="eraser"
              @click="tamperType = 'censor'"
              :basic="tamperType !== 'censor'">
              Censor
            </sui-button>
          </sui-button-group>
        </div>
        <div v-if="tamperType === 'censor'">
          <div class="redacted-words">
            <code v-for="(word, i) in wordified"
              :key="i"
              @click="toggleWord(word)"
              :class="[
                'tamperable',
                {redacted: word.type === 'word' && censorWords.includes(word.index)},
                (censorWords.length + 1) * COST.censor <= game.ink ? word.type : 'punctuation',
              ]">{{word.value.replace(' ', '&nbsp;')}}</code>
          </div>
          <div class="word-count">
            Redacting {{censorWords.length}}/{{Math.min(Math.ceil(wordified.count / 2), Math.floor(game.ink / COST.censor))}} words
          </div>
        </div>
        <div v-else-if="tamperType === 'truncate'">
          <div class="redacted-words">
            <code v-for="word, i in wordified"
              :key="i"
              @click="if(word.available) truncateCount = wordified.count - word.index"
              :class="[
                'tamperable',
                {redacted: truncateCount >= wordified.count - word.index},
                word.available ? 'word' : 'punctuation',
              ]"
              >{{word.value.replace(' ', '&nbsp;')}}</code>
          </div>
          <div class="word-count">
            Redacting {{truncateCount}}/{{Math.min(Math.ceil(wordified.count / 2), Math.floor(game.ink / COST.truncate))}} words
          </div>
        </div>
        <sui-button
          color="blue"
          :inverted="darkMode"
          @click="submitTamper"
          :disabled="false">
          {{tamperType === 'censor' ? 'Censor' : 'Truncate'}} Story
        </sui-button>
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
        Stories
      </sui-divider>
      <sui-loader active centered inline size="huge" :inverted="darkMode" v-if="!chains.length">
        Loading Stories
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
                    <div class="redacted-words" style="padding: 0 14px">
                      <code v-for="(word, i) in entry.data.line"
                        :key="i"
                        :style="{ cursor: 'initial' }"
                        :class="[
                          'tamperable',
                          {
                            redacted: word.type === 'word',
                          },
                        ]">{{word.value}}</code>
                    </div>
                  </sui-comment-text>
                  <sui-comment-author v-if="entry.editors[0]"
                    style="text-align: right; padding: 0 14px">
                    &mdash;{{nameTable[entry.editors[0]]}}{{entry.editors[1] ? ', ' : ''}}{{nameTable[entry.editors[1]]}}, {{nameTable[entry.editors[2]]}}
                  </sui-comment-author>
                </sui-comment-content>
              </sui-comment>
            </sui-comment-group>
          </sui-card-content>
        </sui-card>
      </div>
      <sui-button v-if="player.state === 'READING'"
        style="margin-top: 16px"
        @click="$socket.emit('game:message', 'redacted:done', game.icons[player.id] !== 'check')"
        color="blue"
        :inverted="darkMode"
        :basic="game.icons[player.id] === 'check'" >
        {{game.icons[player.id] === 'check' ? 'Still Reading' : 'Done Reading'}}
      </sui-button>
    </div>
    <div v-else style="margin: 16px">
      <sui-loader active centered inline size="huge" :inverted="darkMode">
        Evidence is being tampered with
      </sui-loader>
    </div>
    <sui-progress
      v-if="game.progress !== 1"
      :inverted="darkMode"
      state="active"
      progress
      indicating
      :percent="Math.round((game.progress || 0) * 100)"/>
  </div>
</template>

<style>
.redacted {
  background-color: black;
  color: white;
}

.dark-theme .redacted {
  background-color: white;
  color: black;
}

.redacted-words {
  margin: 16px 0;
  overflow-wrap: break-word;
  justify-content: center;
}

.dark-theme .redacted-words {
  color: #ccc;
}

.word-count {
  font-size: 12px;
  font-style: italic;
  margin: 14px 0;
}

.tamperable {
  margin: 0;
  width: auto;
  max-width: 180px;
  display: inline;
  transition: background-color 0.2s ease;
}

.tamperable.punctuation {
  border-bottom: 2px solid transparent;
}

.tamperable.word {
  cursor: pointer;
  border-bottom: 2px solid #d4d4d4;
}

.tamperable.redacted {
  cursor: pointer;
}

</style>

<script>

// const WORD_REGEX = /(?<=\s|^|\b)(?:[-'%$#&\/]\b|\b[-'%$#&\/]|\d*\.?\d+|[A-Za-z0-9]|\([A-Za-z0-9]+\))+(?=\s|$|\b)/g;
const WORD_REGEX = /(?:\b|^)\S+\b/g;

const COST = {
  truncate: 2,
  censor: 5,
}

String.prototype.matchAllFill = function(pattern) {
  const clone = new RegExp(pattern.source, pattern.flags);
  const matches = [];
  let match;
  while(match = clone.exec(this))
    matches.push(match);

  return matches;
};

function zip(...rows) {
  return [...rows[0]].map((_,c) => rows.map(row => row[c]));
}

function getWords(str) {
  return Array.from(str.matchAllFill(WORD_REGEX));
}

export default {
  sockets: {
    'lobby:info': function(info) {
      this.lobby = info;
    },
    'game:info': function(info) {
      this.game = info;
      if(info.gamemode.censor === 'none')
        this.tamperType = 'truncate';
      else if(info.gamemode.tamper === 'none')
        this.tamperType = 'censor';
      if (this.game.isComplete && !this.requestedResults) {
        this.$socket.emit('game:message', 'redacted:result');
        this.requestedResults = true;
      }
    },
    'redacted:result': function(chains) {
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

      if(info.link && info.link.data && info.link.data.indexes && this.words.length === 0) {
        this.words = Array(info.link.data.indexes.length).fill('');
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
    },
    wordified() {
      if(this.player.link.type !== 'line')
        return [];

      const line = this.player.link.data;
      const punctuations = line.split(WORD_REGEX)
        .map((s, i) => ({
          type: 'punctuation',
          index: i - 1,
          value: s,
        }));
      const rawWords = getWords(line)
      const words = rawWords
        .map((m, i) => ({
          type: 'word',
          index: i,
          available: i >= Math.floor(rawWords.length / 2)
            && (rawWords.length - i) * COST.truncate <= this.game.ink,
          value: m[0],
        }));
      const wordified = zip(punctuations, words)
        .flatMap(a => a)
        .filter(a => a && a.value)
      wordified.count = words.length;
      return wordified;
    }
  },
  methods: {
    update() { this.$forceUpdate(); },
    wordCount(str) {
      return str ? getWords(str).length : 0;
    },
    writeLine(event) {
      event.preventDefault();

      if(this.line.length < 1 || this.line.length > 256)
        return;

      this.$socket.emit('game:message', 'redacted:line', this.line);
      this.line = '';
    },
    editTruncate(event) {
      event.preventDefault();

      if(this.line.length < 1 || this.line.length > 256)
        return;

      this.$socket.emit('game:message', 'redacted:repair', this.line);
      this.line = '';
    },
    editCensor(event) {
      event.preventDefault();

      if(!this.validWords())
        return;

      this.$socket.emit('game:message', 'redacted:repair',
        this.player.link.data.indexes.map((index, i) => [index, this.words[i]])
      );

      this.words = [];
    },
    toggleWord(word) {
      if(word.type === 'word') {
        if(this.censorWords.includes(word.index))
          this.censorWords = this.censorWords.filter(i => i != word.index);
        else if((this.censorWords.length + 1) * COST.censor <= this.game.ink)
          this.censorWords.push(word.index);
      }
    },
    submitTamper(event) {
      event.preventDefault();
      this.$socket.emit(
        'game:message',
        `redacted:${this.tamperType}`,
        this.tamperType === 'censor' ? this.censorWords : this.truncateCount
      );
      this.censorWords = [];
      this.truncateCount = 0;
    },
    validWords() {
      return this.words.every(word =>
        this.wordCount(word) === 1 && word.length > 0 && word.length <= 256
      );
    }
  },
  data() {
    return {
      COST,
      line: '',
      words: [],
      requestedResults: false,
      chains: [],
      truncateCount: 0,
      censorWords: [],
      player: { state: '', id: '', },
      game: { icons: {}, likes: [], gamemode: {}, ink: 0, },
      icons: {
        // shifted one because of editing order
        line: 'eraser',
        tamper: 'redo',
        repair: 'pencil',
      },
      timer: Date.now(),
      playing: false,
      tamperType: 'truncate',
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
