<template>
  <div class="home">
    <q-table title="Treats" :data="tableData" row-key="name" />
    <h4>Calibtration Data</h4>
    <status-row caption="System" :status="calibrationStatus.sys"></status-row>
    <status-row caption="Gyro" :status="calibrationStatus.gyro"></status-row>
    <status-row caption="Compass" :status="calibrationStatus.mag"></status-row>
    <status-row caption="Acceleration" :status="calibrationStatus.acc"></status-row>
    <q-select v-model="device" :options="devices" option-label="name" option-disable="inactive" map-options label="Bluetooth device"></q-select>
    <q-btn elevation="2" @click="connectBT(device)">Bluetooth Verbinden</q-btn>
    <q-btn elevation="2" @click="disconnectBT()">bluetooth trennen</q-btn>
    <q-btn elevation="2" @click="syncPos()">null Setzen</q-btn>
    <q-btn elevation="2" @click="connectSocket()">mit Socket verbinden</q-btn>
    <q-btn elevation="2" @click="disconnectSocket()">von Socket Trennen</q-btn>
    <q-btn elevation="2" @click="getPosition()">Position</q-btn>
    <q-toggle v-model="sendTarget" label="Ziel senden" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import StatusRow from "./StatusRow.vue";
import Globals from "../plugins/Globals";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial";
import { Geolocation, Geoposition } from "@ionic-native/geolocation";
import { degreesToString, hoursToString } from "../plugins/helper";
import { EquatorialCoordinates, HorizontalCoordinates } from "astronomical-algorithms/dist/coordinates";
import * as geomag from "geomag";

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
  private sendTarget: boolean = false;

  private calibrationStatus = {
    sys: 0,
    mag: 0,
    acc: 0,
    gyro: 0,
  };
  private global: Globals = Globals.getInstance();
  private webSocket: WebSocket | null = null;
  private getStatsInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  mounted(): void {
    this.getPosition(false);
    // we register the event like on plugin's doc page
    BluetoothSerial.list().then((devices) => {
      this.devices = [];
      (devices as Device[]).forEach((device) => {
        this.devices.push(device);
      });
    });
  }

  connectBT(device: Device | null) {
    if (device != null) {
      this.output = device.name;
      BluetoothSerial.connect(device.id).subscribe(() => {
        this.getStatsInterval = setInterval(this.getStats.bind(this), 1000);
        this.readSerial();
      });
    }
  }

  disconnectBT() {
    BluetoothSerial.disconnect().then(() => alert("Bluetooth disconnected"));
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
  connectSocket() {
    this.webSocket = new WebSocket("wss://192.168.178.111:4444");
    console.log(this.webSocket.readyState);

    this.webSocket.onopen = function (event) {
      console.log(event);
      console.log("Successfully connected to the echo websocket server...");
    };

    this.webSocket.onmessage = (event) => {
      console.log(event.data);
      const data = JSON.parse(event.data) as { type: string; payload: unknown };
      switch (data.type) {
        case "target":
          this.global.targetPosition.equatorial = data.payload as EquatorialCoordinates;
        default:
          break;
      }
    };
  }

  disconnectSocket() {
    this.webSocket?.close();
    this.webSocket = null;
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
        this.global.actualPosition.horizontal = {
          azimuth: parseFloat(msg[1])-this.global.magneticDeclination,
          altitude: parseFloat(msg[2]),
        };
        //this.sendPosition();
        //this.output=new Date().toISOString()+":\n"+   JSON.stringify(this.istPosition,null,2);
        if (this.webSocket != null && this.webSocket.readyState == WebSocket.OPEN)
          this.webSocket.send(JSON.stringify({ type: "position", payload: this.global.actualPosition.equatorial }));
        break;
      case 3:
        this.global.sensorPosition.horizontal = {
          azimuth: parseFloat(msg[1])-this.global.magneticDeclination,
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
        if (this.sendTarget) {
          const azimuth=this.global.targetPosition.horizontal.azimuth+this.global.magneticDeclination;
          const altitude=this.global.targetPosition.horizontal.altitude;

          const msg = `02;${azimuth > 0 ? "+" : ""}${azimuth.toPrecision(Math.abs(azimuth) > 1 ? 16 : 15)};${
            altitude > 0 ? "+" : ""
          }${altitude.toPrecision(Math.abs(altitude) > 1 ? 16 : 15)}\n`;
          return BluetoothSerial.write(msg);
        } else {
          return new Promise((resolve) => setTimeout(resolve, 100));
        }
      })
      .then(() => new Promise((resolve) => setTimeout(resolve, 100)))
      .then(() => BluetoothSerial.write("03\n"))
      .catch(alert);
  }

  private syncPos() {
    BluetoothSerial.write("04\n");
  }

  getPosition(setAlert: boolean = true) {
    Geolocation.getCurrentPosition()
      .then((resp) => {
        const coords = resp.coords;
        this.global.longitude = coords.longitude;
        this.global.latitude = coords.latitude;

        const field = geomag.field(this.global.latitude, this.global.longitude);
        if (setAlert) {
          this.global.magneticDeclination = field.declination;
          alert(
            `long: ${degreesToString(this.global.longitude)}\nlat: ${degreesToString(this.global.latitude)}\ndec: ${degreesToString(
              field.declination
            )}`
          );
        }
      })
      .catch((error) => {
        alert(error);
      });
  }
  get tableData() {
    return [
      {
        name: "Sensor Position",
        declination: this.global.sensorPosition.equatorialString.declination,
        rightAscension: this.global.sensorPosition.equatorialString.rightAscension,
        azimuth: this.global.sensorPosition.horizontalString.azimuth,
        altitude: this.global.sensorPosition.horizontalString.altitude,
      },
      {
        name: "Stepper Position",
        declination: this.global.actualPosition.equatorialString.declination,
        rightAscension: this.global.actualPosition.equatorialString.rightAscension,
        azimuth: this.global.actualPosition.horizontalString.azimuth,
        altitude: this.global.actualPosition.horizontalString.altitude,
      },
      {
        name: "Target Position",
        declination: this.global.targetPosition.equatorialString.declination,
        rightAscension: this.global.targetPosition.equatorialString.rightAscension,
        azimuth: this.global.targetPosition.horizontalString.azimuth,
        altitude: this.global.targetPosition.horizontalString.altitude,
      },
    ];
  }
}
</script>
