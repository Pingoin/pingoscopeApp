<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/PingoinTeleskop.png" width="200" />
    <telescope/>
   <!-- <stellarium/> -->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import Sockethelper from "../plugins/SocketHelper";
import Telescope from "../components/Telescope.vue"
import Stellarium from "../components/Stellarium.vue"

@Component({
  components: { Telescope,Stellarium }
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
