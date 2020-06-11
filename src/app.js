import Vue from 'vue'
import VueRouter from 'vue-router';
import SemanticUI from 'semantic-ui-vue';
import VueSocketIO from 'vue-socket.io'
import PortalVue from 'portal-vue';
import './style.css';
import '../res/favicon.ico';

const VERSION = require('../package.json').version;

// Google analytics
window.dataLayer = window.dataLayer || [];
window.gtag = (...args) => dataLayer.push(args);

gtag('js', new Date());
gtag('set', 'allow_google_signals', false );
gtag('set', 'allow_ad_personalization_signals', false );
const config = page_path =>
  gtag('config', 'UA-58828021-7', {
    page_path,
    cookie_prefix: 'OOC',
    cookie_domain: 'www.outofcontext.party',
    cookie_expires: 28 * 24 * 60 * 60,
    custom_map: {
      metric1: 'emote_index',
      metric2: 'turn_duration',
      metric3: 'wait_duration',
      metric4: 'player_count',
      dimension1: 'game_name',
    },
  });

Vue.use(VueRouter);
Vue.use(PortalVue);
Vue.use(SemanticUI);
Vue.use(new VueSocketIO({
  connection: io(),
}));

window.vibrate = arg =>
  window.navigator &&
  window.navigator.vibrate &&
  window.navigator.vibrate(arg);

const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes: [
    { name: 'lobby', path: '/lobby/:code?' },
    { name: 'games', path: '/games' },
    { name: 'home', path: '/' },
  ]
});

import Home from './Home.vue';
import Lobby from './Lobby.vue';
import GameList from './GameList.vue';
import NotFound from './NotFound.vue';
import Util from './Util.vue';
import Menu from './Menu.vue';
import JoinLobby from './JoinLobby.vue';
import PlayerList from './PlayerList.vue';
import Page from './Page.vue';
import GameRenderer from './games/GameRenderer.vue';
import Timer from './Timer.vue';
import Doodle from './Doodle.vue';

Vue.component('ooc-util', Util);
Vue.component('ooc-timer', Timer);
Vue.component('ooc-menu', Menu);
Vue.component('ooc-join-lobby', JoinLobby);
Vue.component('ooc-player-list', PlayerList);
Vue.component('ooc-page', Page);
Vue.component('ooc-game', GameRenderer);
Vue.component('ooc-doodle', Doodle);

window.app = new Vue({
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
    config('/' + this.$route.name);
  },
  sockets: {
    connect() {
      console.log('Connected');
      this.connected = true;
      this.disconnected = false;
    },
    'version': function(version) {
      if(version !== VERSION) {
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
      if(to.name !== from.name)
        config('/' + to.name);
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


