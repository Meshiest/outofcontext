<style scoped>
</style>

<template>
  <div>
    <div class="menu">
      <header>
        <div class="title">
          Page Not Found
        </div>
        <div class="subtitle">
          It appears this page does not exist!
        </div>
      </header>
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
    </div>
  </div>
</template>

<script>
export default {

};
</script>