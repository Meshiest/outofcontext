<template>
  <sui-statistic :inverted="darkMode">
    <sui-statistic-value>{{time}}</sui-statistic-value>
    <sui-statistic-label>{{label}}</sui-statistic-label>
  </sui-statistic>
</template>
<script>
export default {
  props: ['start', 'duration'],
  data() {
    return {
      timer: undefined,
      time: '?',
      label: 'seconds',
      now: Date.now(),
    };
  },
  watch: {
    start() {
      if(!this.timer) {
        this.update();
        clearInterval(this.update);
        this.timer = setInterval(this.update, 500);
      }
    }
  },
  methods: {
    rerender() { this.$forceUpdate(); },
    update() {
      this.now = Date.now();
      const start = this.start || this.now;
      const secLeft = this.duration - Math.round((this.now - start)/1000);
      this.time = Math.max(Math.round(secLeft), 0);

      if(secLeft >= 60) {
        this.label = 'minute';
        this.time = Math.round(secLeft / 60);
      } else {
        this.label = 'second';
      }

      if(this.time !== 1)
        this.label += 's';
    },
  },
  created() {
    this.bus.$on('toggle-dark-mode', this.rerender);
    this.update();
    if(this.start)
      this.timer = setInterval(this.update, 500);
  },
  beforeDestroy() {
    this.bus.$off('toggle-dark-mode', this.rerender);
    clearInterval(this.timer);
  }
};
</script>