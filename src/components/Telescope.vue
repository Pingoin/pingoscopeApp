<template>
  <div class="home">
    <p>{{ output }}</p>
    <h4>Sensor Data</h4>
    <status-row :caption="'Azimuth'" :status="global.sensorPositionHorizontal.azimuth"></status-row>
    <status-row :caption="'Altitude'" :status="global.sensorPositionHorizontal.altitude"></status-row>
    <h4>Stepper Data</h4>
    <status-row :caption="'Azimuth'" :status="global.actualPositionHorizontalString.azimuth"></status-row>
    <status-row :caption="'Altitude'" :status="global.actualPositionHorizontalString.altitude"></status-row>

    <h4>Target</h4>
    <status-row :caption="'Deklination'" :status="global.targetPositionEquatorialString.declination"></status-row>
    <status-row :caption="'Rectaszendenz'" :status="global.targetPositionEquatorialString.rightAscension"></status-row>

    <h4>Calibtration Data</h4>
    <status-row caption="System" :status="calibrationStatus.sys"></status-row>
    <status-row caption="Gyro" :status="calibrationStatus.gyro"></status-row>
    <status-row caption="Compass" :status="calibrationStatus.mag"></status-row>
    <status-row caption="Acceleration" :status="calibrationStatus.acc"></status-row>
    <q-select v-model="device" :options="devices" option-label="name" option-disable="inactive" map-options label="Bluetooth device"></q-select>
    <q-btn elevation="2" @click="connect(device)">Verbinden</q-btn>
    <q-btn elevation="2" @click="syncPos()">null Setzen</q-btn>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import aa from "../backend/astronomical-algorithms";
import StatusRow from "./StatusRow.vue";
import Globals from "../plugins/Globals";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial";

interface Device {
  name: string;
  id: string;
}

@Component({
  components: { StatusRow },
})
export default class Telescope extends Vue {
  device: Device | null = null;
  output = "";
  devices: Device[] = [];

  private calibrationStatus = {
    sys: 0,
    mag: 0,
    acc: 0,
    gyro: 0,
  };
  private global: Globals = Globals.getInstance();
  private webSocket: WebSocket;
  private getStatsInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.webSocket = new WebSocket("ws://192.168.178.15:4444");
  }

  mounted(): void {
    // we register the event like on plugin's doc page
    BluetoothSerial.list().then((devices) => {
      (devices as Device[]).forEach((device) => {
        this.devices.push(device);
      });
    });
    this.webSocket.onmessage = (event) => {
      this.global.targetPositionEquatorial = JSON.parse(event.data);
    };
  }

  connect(device: Device | null) {
    if (device != null) {
      this.output = device.name;
      BluetoothSerial.connect(device.id).subscribe(() => {
        this.getStatsInterval = setInterval(this.getStats.bind(this), 1000);
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
  private interpretTelegram(telegram: string) {
    const msg = telegram.split(";");
    const command = parseInt(msg[0], 16);
    switch (command) {
      case 0:
        this.calibrationStatus.sys = parseInt(msg[1]);
        this.calibrationStatus.mag = parseInt(msg[2]);
        this.calibrationStatus.acc = parseInt(msg[3]);
        this.calibrationStatus.gyro = parseInt(msg[4]);

        break;
      case 1:
        //console.log(msg);
        this.global.actualPositionHorizontal = {
          azimuth: parseFloat(msg[1]),
          altitude: parseFloat(msg[2]),
        };
        //this.sendPosition();
        //this.output=new Date().toISOString()+":\n"+   JSON.stringify(this.istPosition,null,2);

        this.webSocket.send(JSON.stringify(this.global.actualPositionEquatorial));
        break;
      case 3:
        this.global.sensorPositionHorizontal = {
          azimuth: parseFloat(msg[1]),
          altitude: parseFloat(msg[2]),
        };
      default:
        break;
    }
  }

  private getStats(): void {
    BluetoothSerial.write("00\n")
      .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
      .then(() => BluetoothSerial.write("01\n"))
      .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
      .then(() => {
        const {azimuth,altitude}=this.global.targetPositionHorizontal;
        const msg = `02;${azimuth > 0 ? "+" : ""}${azimuth.toPrecision(Math.abs(azimuth) > 1 ? 16 : 15)};${
          altitude > 0 ? "+" : ""
        }${altitude.toPrecision(Math.abs(altitude) > 1 ? 16 : 15)}\n`;
        return BluetoothSerial.write(msg);
      })
      .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
      .then(() => BluetoothSerial.write("03\n"))
      .catch(alert);
  }

  private syncPos() {
    BluetoothSerial.write("04\n");
  }
}
</script>
