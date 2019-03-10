<style scoped>
</style>

<template>
  <div>
    <ooc-menu
      title="Page Not Found"
      subtitle="It appears this page does not exist!">
      <div>
        <sui-button-group vertical basic>
          <router-link is="sui-button"
            to="/">
            Home
          </router-link>
          <a is="sui-button"
            href="https://github.com/meshiest/out-of-context/issues"
            target="_blank"
            rel="noopener noreferrer">
            Bug Report
          </a>
        </sui-button-group>
      </div>
    </ooc-menu>
  </div>
</template>

<script>
export default {

};
</script>