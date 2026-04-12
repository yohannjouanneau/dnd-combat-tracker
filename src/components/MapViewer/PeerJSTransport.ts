import type { DataConnection } from "peerjs";
import type { MapMessage, MapTransport } from "./types";

export class PeerJSTransport implements MapTransport {
  private handlers = new Set<(msg: MapMessage) => void>();
  private conn: DataConnection;

  constructor(conn: DataConnection) {
    this.conn = conn;
    conn.on("data", (data) => {
      this.handlers.forEach((h) => h(data as MapMessage));
    });
  }

  send(msg: MapMessage) {
    this.conn.send(msg);
  }

  onMessage(handler: (msg: MapMessage) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onClose(handler: () => void): () => void {
    this.conn.on("close", handler);
    return () => this.conn.off("close", handler);
  }

  close() {
    this.conn.close();
    // Intentionally not calling peer.destroy() here:
    // React Strict Mode runs effect cleanup prematurely which would kill the
    // live connection. The peer disconnects naturally when the tab closes.
  }
}
