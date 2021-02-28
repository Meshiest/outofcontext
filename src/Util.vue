<template>
  <div>
    <portal-target name="semantic-ui-vue">
    </portal-target>
    <sui-dimmer :active="disconnected" style="position: fixed">
      <sui-loader :inverted="darkMode">
        Lost Connection to Server
      </sui-loader>
    </sui-dimmer>
  </div>
</template>

<script>
module.exports = {
  data() {
    return {
      disconnected: false,
    };
  },
  sockets: {
    connect() {
      this.disconnected = false;
    },
    disconnect() {
      this.disconnected = true;
    }
  },
};
</script>