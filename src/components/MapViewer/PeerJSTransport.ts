import type { DataConnection } from "peerjs";
import type { MapMessage, MapTransport } from "./types";

export class PeerJSTransport implements MapTransport {
  private handlers = new Set<(msg: MapMessage) => void>();
  private closeHandlers = new Set<() => void>();
  private conn: DataConnection;
  private closeFired = false;

  constructor(conn: DataConnection) {
    this.conn = conn;
    console.log(`DEBUG ==> PeerJSTransport created, conn.open=${conn.open}`);

    conn.on("data", (data) => {
      console.log(
        `DEBUG ==> PeerJSTransport received message:`,
        (data as MapMessage).type,
      );
      this.handlers.forEach((h) => h(data as MapMessage));
    });

    conn.on("close", () => {
      console.log(
        `DEBUG ==> PeerJSTransport conn "close" event fired, conn.open=${conn.open}`,
      );
      this.triggerClose();
    });

    conn.on("error", (err) => {
      console.log(`DEBUG ==> PeerJSTransport conn "error" event:`, err);
    });

    // On iOS, WebRTC connections die silently when backgrounded — "close" never
    // fires. ICE "failed" is the reliable signal that the connection is dead.
    conn.on("iceStateChanged", (state) => {
      console.log(`DEBUG ==> PeerJSTransport ICE state changed:`, state);
      if (state === "failed") {
        console.log(`DEBUG ==> PeerJSTransport ICE failed → triggering close`);
        this.triggerClose();
      }
    });
  }

  private triggerClose() {
    if (this.closeFired) return;
    this.closeFired = true;
    this.closeHandlers.forEach((h) => h());
  }

  send(msg: MapMessage) {
    console.log(`DEBUG ==> PeerJSTransport sending message:`, msg.type);
    this.conn.send(msg);
  }

  onMessage(handler: (msg: MapMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onClose(handler: () => void): () => void {
    console.log(`DEBUG ==> PeerJSTransport onClose handler registered`);
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  isConnected(): boolean {
    if (!this.conn.open) return false;
    const ice = this.conn.peerConnection?.iceConnectionState;
    console.log(
      `DEBUG ==> isConnected check: conn.open=${this.conn.open} iceState=${ice}`,
    );
    return ice !== "failed" && ice !== "disconnected" && ice !== "closed";
  }

  close() {
    console.log(`DEBUG ==> PeerJSTransport.close() called`);
    this.conn.close();
    // Intentionally not calling peer.destroy() here:
    // React Strict Mode runs effect cleanup prematurely which would kill the
    // live connection. The peer disconnects naturally when the tab closes.
  }
}
