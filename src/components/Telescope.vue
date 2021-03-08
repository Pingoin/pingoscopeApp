<template>
  <div class="home">
    <p>{{port}}</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import aa from "../backend/astronomical-algorithms";
import { BluetoothSerial } from '@ionic-native/bluetooth-serial';


@Component
export default class Telescope extends Vue {
  port = "";
  constructor() {
    super();
  }

  mounted(): void {
    // we register the event like on plugin's doc page
    this.port="Arsch"
    BluetoothSerial.list().then(devices=>this.devices(devices));
  }
  devices(devices:any){
    console.log(devices);
        devices.forEach((device:any)=>{
        this.port+="\n"+JSON.stringify(device);
    })
  }
}
</script>