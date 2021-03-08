<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/PingoinTeleskop.png" width="200" />
    Battery status is: <strong>{{ batteryStatus }}</strong>
    <q-select
      v-model="port"
      :items="socket.ports"
      label="Serial Port"
    ></q-select>
    <telescope/>
    <q-btn elevation="2" @click="socket.setPort(port)">Verbinden</q-btn>
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
  }
  updateBatteryStatus (status:any) {
      this.batteryStatus = `Level: ${status.level}, plugged: ${status.isPlugged}`;
    }

  created () {
    // we register the event like on plugin's doc page
    window.addEventListener('batterystatus', this.updateBatteryStatus, false)
  }
}
</script>
