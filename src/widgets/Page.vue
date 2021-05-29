<template>
  <div class="page">
    <slot></slot>
    <div class="footer-links">
      <a href="#" @click="toggleDarkMode()">Toggle Dark Mode (Beta)</a>
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

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 14px;
}
</style>