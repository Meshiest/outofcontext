<style scoped>
</style>

<template>
  <ooc-page>
    <ooc-menu
      title="Page Not Found"
      subtitle="It appears this page does not exist!">
      <div>
        <sui-button-group vertical :basic="!darkMode" :inverted="darkMode">
          <router-link is="sui-button"
            :inverted="darkMode"
            :basic="darkMode"
            to="/">
            Home
          </router-link>
          <a is="sui-button"
            :inverted="darkMode"
            :basic="darkMode"
            href="https://github.com/meshiest/outofcontext/issues"
            target="_blank"
            rel="noopener noreferrer">
            Bug Report
          </a>
        </sui-button-group>
      </div>
    </ooc-menu>
  </ooc-page>
</template>

<script>
export default {
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