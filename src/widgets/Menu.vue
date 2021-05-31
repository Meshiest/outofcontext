<style>

.menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  margin-bottom: 32px;
  padding: 4px;
  max-width: 300px;
  width: 100%;
  text-align: center;
}

.menu header {
  padding: 32px 16px 16px 16px;
}

.menu .subtitle {
  color: #666;
  font-family: Lato, sans-serif;
  font-style: italic;
}

.menu .title {
  font-family: 'Lora', serif;
  font-size: 30px;
  margin: 8px 0;
}

.dark-theme .menu .title {
  color: #fff;
}

.dark-theme .menu .subtitle {
  color: #ccc;
}

</style>

<template>
  <div>
    <div class="menu">
      <header>
        <div class="title">
          {{title}}
        </div>
        <div class="subtitle">
          {{subtitle}}
        </div>
      </header>
      <div class="menu-items" :style="{textAlign: left ? 'left' : 'inherit'}">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['title', 'subtitle', 'left'],
};
</script>