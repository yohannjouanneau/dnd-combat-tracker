import type { DataConnection } from "peerjs";
import type { MapMessage, MapTransport } from "./types";

export class PeerJSTransport implements MapTransport {
  private handlers = new Set<(msg: MapMessage) => void>();
  private closeHandlers = new Set<() => void>();
  private conn: DataConnection;
  private closeFired = false;

  constructor(conn: DataConnection) {
    this.conn = conn;

    conn.on("data", (data) => {
      this.handlers.forEach((h) => h(data as MapMessage));
    });

    conn.on("close", () => {
      this.triggerClose();
    });

    conn.on("error", () => {});

    // On iOS, WebRTC connections die silently when backgrounded — "close" never
    // fires. ICE "failed" is the reliable signal that the connection is dead.
    conn.on("iceStateChanged", (state) => {
      if (state === "failed") {
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
    this.conn.send(msg);
  }

  onMessage(handler: (msg: MapMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  isConnected(): boolean {
    if (!this.conn.open) return false;
    const ice = this.conn.peerConnection?.iceConnectionState;
    return ice !== "failed" && ice !== "disconnected" && ice !== "closed";
  }

  close() {
    this.conn.close();
    // Intentionally not calling peer.destroy() here:
    // React Strict Mode runs effect cleanup prematurely which would kill the
    // live connection. The peer disconnects naturally when the tab closes.
  }
}
