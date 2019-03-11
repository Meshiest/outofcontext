<template>
  <div>
    Game:
    <pre>
      {{JSON.stringify(game, 0, 2)}}
    </pre>
    Player:
    <pre>
      {{JSON.stringify(player, 0, 2)}}
    </pre>
  </div>
</template>

<style>
</style>

<script>
export default {
  sockets: {
    'game:info': function(info) {
      this.game = info;
    },
    'game:player:info': function(info) {
      this.player = info;
    }
  },
  created() {
    console.log('loading game menu');
    this.$socket.emit('game:info');
  },
  data() {
    return {
      player: { state: '' },
      game: { icons: {} },
    };
  },
};
</script>