<template>
  <div>
    <h4>Penis</h4>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import Globals from "../plugins/Globals";
import { WebSocketServer } from "@ionic-native/web-socket-server";

const port = 10001;

@Component
export default class Stellarium extends Vue {
  private global: Globals = Globals.getInstance();

  private wsserver = WebSocketServer;

  constructor() {
    super();

    this.wsserver.start(port, {}).subscribe({
      next: (server) => console.log(`Listening on ${server.addr}:${server.port}`),
      error: (error) => console.log(`Unexpected error`, error),
    });

    this.wsserver.watchMessage().subscribe((result) => {
      this.setTargetByStellarium(Buffer.from(result.msg));
      console.log(`Received message ${result.msg} from ${result.conn.uuid}`);
    });
  }

  private setTargetByStellarium(chunk: Buffer): void {
    this.global.targetPositionEquatorial = {
      declination: (chunk.readInt32LE(16) / 0x40000000) * 90,
      rightAscension: (chunk.readUInt32LE(12) / 0x100000000) * 24,
    };
  }
}
</script>
