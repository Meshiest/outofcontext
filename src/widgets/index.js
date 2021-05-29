import Vue from 'vue'

import Util from './Util.vue';
import Timer from './Timer.vue';
import Menu from './Menu.vue';
import JoinLobby from './JoinLobby.vue';
import PlayerList from './PlayerList.vue';
import Page from './Page.vue';
import Doodle from './Doodle.vue';
import Settings from './Settings.vue';

Vue.component('ooc-util', Util);
Vue.component('ooc-timer', Timer);
Vue.component('ooc-menu', Menu);
Vue.component('ooc-join-lobby', JoinLobby);
Vue.component('ooc-player-list', PlayerList);
Vue.component('ooc-page', Page);
Vue.component('ooc-doodle', Doodle);
Vue.component('ooc-settings', Settings);
