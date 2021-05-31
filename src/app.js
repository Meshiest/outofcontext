import Vue from 'vue'
import VueRouter from 'vue-router';
import SemanticUI from 'semantic-ui-vue';
import VueSocketIO from 'vue-socket.io'
import PortalVue from 'portal-vue';

import './style.css';
import '../res/favicon.ico';

const VERSION = require('../package.json').version;
const config = page_path => gtag('config', 'UA-58828021-7', {page_path});

Vue.prototype.rocketcrab = false;
Vue.prototype.bus = new Vue();

window.vibrate = arg =>
  window.navigator &&
  window.navigator.vibrate &&
  window.navigator.vibrate(arg);

// in the future, turn on dark mode when the browser detects a dark theme preference
// const cssDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

// at the moment dark mode will be determined by user selection
Vue.prototype.darkMode = localStorage.occDarkMode === 'true';
if (Vue.prototype.darkMode) {
  document.body.classList.add('dark-theme');
}

// streamer mode (prevent lobby codes from being visible)
Vue.prototype.hideLobbyCode = localStorage.oocHideLobby === 'true';
Vue.prototype.setLobbyHidden = isHidden => {
  localStorage.oocHideLobby = Vue.prototype.hideLobbyCode = isHidden;
  Vue.prototype.bus.$emit('toggle-hide-lobby');
};

// setting dark mode will emit a message to vue's event bus and update the body
// if there was actual theming, it would probably have to modify a style tag
// and there would need to be a lot of css changes for semantic ui to be happy
Vue.prototype.setDarkMode = mode => {
  document.body.classList[mode ? 'add' : 'remove']('dark-theme');
  localStorage.occDarkMode = mode;
  Vue.prototype.darkMode = mode;
  Vue.prototype.bus.$emit('toggle-dark-mode');
};


// turn sound cache
const turnSounds = {};
// convert sound names to webpack generated paths
const soundMap = {
  bit: require('../res/audio/bit.wav'),
  chime: require('../res/audio/chime.wav'),
  chord: require('../res/audio/chord.wav'),
  ding: require('../res/audio/ding.wav'),
  retro: require('../res/audio/retro.wav'),
}
const loadTurnSound = name => {
  if (!name || turnSounds[name]) return;
  turnSounds[name] = new Audio(soundMap[name]);
};
loadTurnSound(localStorage.oocTurnSound);

// play a turn sound
Vue.prototype.playTurnSound = () => {
  if (!localStorage.oocTurnSound) return;
  const sound = turnSounds[localStorage.oocTurnSound];
  if (!sound) return;

  sound.currentTime = 0;
  sound.play();
};
Vue.prototype.setTurnSound = sound => {
  loadTurnSound(sound);
  localStorage.oocTurnSound = sound;
};

Vue.use(VueRouter);
Vue.use(PortalVue);
Vue.use(SemanticUI);
Vue.use(new VueSocketIO({
  connection: io(),
}));

const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes: [
    { name: 'lobby', path: '/lobby/:code?' },
    { name: 'games', path: '/games' },
    { name: 'home', path: '/' },
  ]
});

import './widgets';

import Home from './pages/Home.vue';
import Lobby from './pages/Lobby.vue';
import GameList from './pages/GameList.vue';
import NotFound from './pages/NotFound.vue';

import GameRenderer from './games/GameRenderer.vue';
Vue.component('ooc-game', GameRenderer);

new Vue({
  router,
  el: '#app',
  data() {
    return {
      connected: false,
      disconnected: false,
      playerId: undefined,
    };
  },
  created() {
    // rocketcrab query parsing
    let { rocketcrab, name, ishost } = this.$route.query;
    if (rocketcrab === 'true') {
      name = (name || '').replace(/[\u200B-\u200D\uFEFF\n\t]/g, '').trim();
      console.log('Hello', name, 'from rocketcrab!');
      Vue.prototype.rocketcrab = {
        name: !name ? 'Player' : name.length >= 16 ? name.slice(0, 15) : name,
        isHost: ishost === 'true',
      };
    }

    config('/' + this.$route.path);
  },
  sockets: {
    connect() {
      console.log('Connected');
      this.connected = true;
      this.disconnected = false;
    },
    'version': function(version) {
      if(version !== VERSION) {
        console.warn('Incompatible version. Server has', version + '. I have', VERSION);
        setTimeout(() => location.reload(), 2000);
      }
    },
    disconnect() {
      console.log('Disconnected');
      this.connected = false;
      this.disconnected = true;
    },
    'member:id': function(id) {
      this.playerId = id;
    }
  },
  watch: {
    $route(to, from) {
      if(to.path !== from.path)
        config('/' + to.path);
    },
  },
  render(h) {
    return h({
      home: Home,
      lobby: Lobby,
      games: GameList,
    }[this.$route.name] || NotFound);
  }
});


