<style scoped>
</style>

<template>
  <div>
    <div v-if="state === 'DEAD_LOBBY'">
      new lobby
    </div>
    <div v-else-if="state === 'JOIN_LOBBY'">
      create name
    </div>
    <sui-dimmer :active="loading">
      <sui-loader />
    </sui-dimmer>
  </div>
</template>

<script>

export default {
  data() {
    return {
      loading: true,
      state: 'LOADING',
    };
  },
  created() {
    const lobbyId = this.$route.params.id;
    if(!lobbyId || lobbyId.length !== 4) {
      this.loading = false;
      this.state = 'DEAD_LOBBY';
    } else {
      fetch(`/api/v1/lobby/${lobbyId}`)
        .then(() => {
          this.state = 'JOIN_LOBBY';
          this.loading = false;
        })
        .catch(() => {
          this.state = 'DEAD_LOBBY';
          this.loading = false;
        });
    }
  }
};
</script>