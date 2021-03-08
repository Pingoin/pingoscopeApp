<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/PingoinTeleskop.png" width="200" />
    <telescope/>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import Sockethelper from "../plugins/SocketHelper";
import Telescope from "../components/Telescope.vue"

@Component({
  components: { Telescope }
})
export default class Home extends Vue {
  @Prop() private socket!: Sockethelper;
  port = "";
  batteryStatus= 'determining...';
  constructor() {
    super();
    this.$q.dark.set(true)
  }
}
</script>
