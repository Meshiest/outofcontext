<template>
  <div>
    <portal-target name="semantic-ui-vue">
    </portal-target>
    <sui-dimmer :active="$root.disconnected">
      <sui-loader>
        Lost Connection to Server
      </sui-loader>
    </sui-dimmer>
  </div>
</template>

