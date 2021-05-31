<template>
  <sui-dimmer :active="active" :inverted="darkMode">
    <sui-form
      :inverted="darkMode"
      @submit="testLobby"
      :error="lobbyError"
      :loading="testingLobby">
      <sui-card>
        <sui-card-content>
          <sui-card-header>
            Join a Lobby
          </sui-card-header>
          <sui-card-meta>
            Enter the code for an existing lobby
          </sui-card-meta>
        </sui-card-content>
        <sui-card-content>
          <sui-form-field
            :error="lobbyError">
            <label>Lobby Code</label>
            <input name="lobbyCode"
              required
              @input="lobbyError = false"
              :type="hideLobbyCode ? 'password' : 'text'"
              autocomplete="off"
              placeholder="c0d3">
          </sui-form-field>
          <sui-button
            color="blue"
            :inverted="darkMode"
            type="submit">
            Join
          </sui-button>
          <sui-button
            :inverted="darkMode"
            type="button"
            @click="$emit('close')">
            Cancel
          </sui-button>
        </sui-card-content>
      </sui-card>
      <sui-message
        error
        header="Invalid Lobby Code"
        content="This lobby does not exist"/>
    </sui-form>
  </sui-dimmer>
</template>

<script>
module.exports = {
  props: ['active'],
  data() {
    return {
      testingLobby: false,
      lobbyError: false,
    }
  },
  sockets: {
    'lobby:join': function(code) {
      this.$emit('close');
      this.$router.push(`/lobby/${code}`);
    },
    disconnect: function() {
      this.$emit('close');
    }
  },
  methods: {
    update() { this.$forceUpdate(); },
    testLobby(event) {
      event.preventDefault();
      const form = event.target;
      const code = form.lobbyCode.value.replace(/\W/g, '');

      this.testingLobby = true;

      // Determine if the lobby exists
      fetch(`/api/v1/lobby/${code}`)
        .then(resp => {
          this.testingLobby = false;

          if(resp.status === 200) {
            console.log('lobby exists');
            this.$emit('close');
            this.$socket.emit('lobby:join', code);
            this.$router.push(`/lobby/${code}`);
          } else {
            this.lobbyError = true;
          }
        })
        .catch(() => {
          this.testingLobby = false;
          this.lobbyError = true;
        });
    },
  },
  created() {
    this.bus.$on('toggle-dark-mode', this.update);
    this.bus.$on('toggle-hide-lobby', this.update);
  },
  beforeDestroy() {
    this.bus.$off('toggle-dark-mode', this.update);
    this.bus.$off('toggle-hide-lobby', this.update);
  }
};
</script>