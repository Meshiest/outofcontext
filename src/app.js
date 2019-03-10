import Vue from 'vue'
import VueRouter from 'vue-router';
import SemanticUI from 'semantic-ui-vue';
import VueSocketIO from 'vue-socket.io'
import PortalVue from 'portal-vue';
import './style.css';

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
    { name: 'lobby', path: '/lobby/:id?' },
    { name: 'games', path: '/games' },
    { name: 'home', path: '/' },
  ]
});

import Home from './Home.vue';
import Lobby from './Lobby.vue';
import NotFound from './NotFound.vue';
import Util from './Util.vue';

Vue.component('ooc-util', Util);

new Vue({
  router,
  el: '#app',
  data() {
    return {
      connected: false,
      disconnected: false,
    }
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
  },
  render(h) {
    return h({
      home: Home,
      lobby: Lobby,
    }[this.$route.name] || NotFound);
  }
});


