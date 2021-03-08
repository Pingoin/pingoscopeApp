<template>
  <div class="home">
    <p>{{ output }}</p>
    <q-select v-model="device" :options="devices" option-label="name" option-disable="inactive" map-options label="Bluetooth device"></q-select>
    <q-btn elevation="2" @click="connect(device)">Verbinden</q-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import aa from "../backend/astronomical-algorithms";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial";

interface Device {
  name: string;
  id: string;
}

@Component
export default class Telescope extends Vue {
  device: Device | null = null;
  output = "";
  devices: Device[] = [];
  private istPosition = {
    alt: 0,
    azimuth: 0
  };
  private sollPosition = {
    dec: 0,
    ra: 0
  };


  constructor() {
    super();
  }

  mounted(): void {
    // we register the event like on plugin's doc page
    BluetoothSerial.list().then((devices) => {
      (devices as Device[]).forEach((device) => {
        this.devices.push(device);
      });
    });
  }

  connect(device: Device | null) {
    if (device != null) {
      this.output = device.name;
      BluetoothSerial.connect(device.id).subscribe(() => {
        this.readSerial();
      });
    }
  }
  readSerial() {
    BluetoothSerial.subscribe("\n").subscribe(
      (data: string) => {
        this.interpretTelegram(data);
        this.readSerial();
      },
      (error) => {
        alert(error);
        this.readSerial();
      }
    );
  }
  private   interpretTelegram(telegram: string) {
    const msg = telegram.split(";");
    const command = parseInt(msg[0], 16);
    switch (command) {
      case 0x01:
        //console.log(msg);
        this.istPosition.azimuth = parseFloat(msg[1]);
        this.istPosition.alt = parseFloat(msg[2]);
        //this.sendPosition();
        this.output=new Date().toISOString()+":\n"+   JSON.stringify(this.istPosition,null,2);
        break;

      default:
        break;
    }
  }
}
</script>
