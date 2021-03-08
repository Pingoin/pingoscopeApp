<template>
  <div id="q-app">
    <router-view :socket="socket" />
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import SocketHelper from "./plugins/SocketHelper";

@Component
export default class App extends Vue {
  socket = new SocketHelper();
}
</script>
  