import Vue from 'vue'
import VueRouter from 'vue-router';
import SemanticUI from 'semantic-ui-vue';
import VueSocketIO from 'vue-socket.io'
import PortalVue from 'portal-vue';
import './style.css';
import '../res/favicon.ico';
import VueDefaultValue from 'vue-default-value';

Vue.use(VueRouter);
Vue.use(VueDefaultValue);
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

import Home from './Home.vue';
import Lobby from './Lobby.vue';
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
  sockets: {
    connect() {
      console.log('Connected');
      this.connected = true;
      this.disconnected = false;
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
  render(h) {
    return h({
      home: Home,
      lobby: Lobby,
    }[this.$route.name] || NotFound);
  }
});


