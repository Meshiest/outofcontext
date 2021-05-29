<template>
  <div class="page">
    <slot></slot>
    <ooc-settings></ooc-settings>
    <div class="footer-links">
    </div>
  </div>
</template>

<style>
body {
  height: 100vh;
  max-height: 100vh;
  position: relative;
  overflow-y: auto;
}
</style>