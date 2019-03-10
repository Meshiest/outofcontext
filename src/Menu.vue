<style>

.menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  padding: 4px;
  width: 300px;
  text-align: center;
}

.menu header {
  margin: 32px 16px 16px 16px;
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
      <div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['title', 'subtitle']
};
</script>