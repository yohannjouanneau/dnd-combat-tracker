import type { MapMessage, MapTransport } from "./types";

const CHANNEL_NAME = "dnd-map-viewer";

export class BroadcastChannelTransport implements MapTransport {
  private channel = new BroadcastChannel(CHANNEL_NAME);

  send(msg: MapMessage) {
    this.channel.postMessage(msg);
  }

  onMessage(handler: (msg: MapMessage) => void): () => void {
    const listener = (e: MessageEvent<MapMessage>) => handler(e.data);
    this.channel.addEventListener("message", listener);
    return () => this.channel.removeEventListener("message", listener);
  }

  close() {
    this.channel.close();
  }
}
