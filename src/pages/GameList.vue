<template>
  <ooc-page>
    <ooc-menu title="Game Info" subtitle="Learn the ropes">
      <sui-divider horizontal :inverted="darkMode">Redirect</sui-divider>
      <router-link
        is="sui-button"
        :inverted="darkMode"
        basic
        to="/">
        Home
      </router-link>
      <sui-divider horizontal :inverted="darkMode">Games</sui-divider>
      <sui-card v-for="[key, info] in gameInfo" :key="key">
        <sui-card-content>
          <sui-card-header>
            {{info.title}}
          </sui-card-header>
          <sui-card-description>
            {{showMore[key] ? info.more : info.description}}
          </sui-card-description>
        </sui-card-content>
        <sui-card-content style="text-align: left;">
          <sui-accordion exclusive styled :inverted="darkMode">
            <sui-accordion-title>
              <sui-icon name="dropdown"/>More Info
            </sui-accordion-title>
            <sui-accordion-content>
              {{info.more}}
            </sui-accordion-content>
            <sui-accordion-title>
              <sui-icon name="dropdown"/>How to Play
            </sui-accordion-title>
            <sui-accordion-content>
              <ul style="padding-left: 20px; margin: 0">
                <li v-for="(step, i) in info.howTo" :key="i">{{step}}</li>
              </ul>
            </sui-accordion-content>
            <sui-accordion-title>
              <sui-icon name="dropdown"/>Configurations
            </sui-accordion-title>
            <sui-accordion-content>
              <div v-for="(opt, name) in info.config" :key="name">
                <b>{{opt.name}}</b>: {{opt.info}}
              </div>
            </sui-accordion-content>
          </sui-accordion>
        </sui-card-content>
        <sui-card-content extra>
          <sui-icon name="clock"/> {{info.playTime}}
          <span style="padding-left: 20px"/>
          <sui-icon name="users"/> {{
            `${info.config.players.min}${info.config.players.max != 256 ? '-' + info.config.players.max : '+'}`
          }}
          <span style="padding-left: 20px"/>
          <sui-icon name="fire"/> {{info.difficulty}}
        </sui-card-content>
      </sui-card>
    </ooc-menu>
  </ooc-page>
</template>

<script>
import gameInfo from '../../gameInfo';

export default {
  data() {
    return {
      gameInfo: Object.entries(gameInfo)
        .filter((key, val) => !val.hidden),
      showMore: {},
    };
  },
  methods: {
    update() { this.$forceUpdate(); },
  },
  created() {
    this.bus.$on('toggle-dark-mode', this.update);
  },
  beforeDestroy() {
    this.bus.$off('toggle-dark-mode', this.update);
  }
};
</script>