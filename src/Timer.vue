<template>
  <sui-statistic>
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
  methods: {
    update() {
      this.now = Date.now();
      const secLeft = this.duration - Math.round((this.now - this.start)/1000);
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
    this.timer = setInterval(this.update, 500);
  },
  beforeDestroy() {
    clearInterval(this.timer);
  }
};
</script>