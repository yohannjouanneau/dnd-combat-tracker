import type { MapMessage, MapTransport } from "./types";

/**
 * Broadcasts to N connected players. Implements MapTransport so all existing
 * send() / onMessage() / onClose() call-sites need zero changes.
 *
 * - add(transport) — register a new player connection; auto-removes on close
 * - onCountChange(cb) — notified whenever the player count changes
 * - onClose fires only when the last transport disconnects
 */
export class MulticastTransport implements MapTransport {
  private transports: MapTransport[] = [];
  private messageHandlers = new Set<(msg: MapMessage) => void>();
  private closeHandlers = new Set<() => void>();
  private countChangeHandlers = new Set<(count: number) => void>();

  add(transport: MapTransport): void {
    this.transports.push(transport);
    this.notifyCountChange();

    const unsubMessage = transport.onMessage((msg) => {
      this.messageHandlers.forEach((h) => h(msg));
    });

    transport.onClose(() => {
      unsubMessage();
      this.transports = this.transports.filter((t) => t !== transport);
      this.notifyCountChange();
      if (this.transports.length === 0) {
        this.closeHandlers.forEach((h) => h());
      }
    });
  }

  get count(): number {
    return this.transports.length;
  }

  onCountChange(handler: (count: number) => void): () => void {
    this.countChangeHandlers.add(handler);
    return () => this.countChangeHandlers.delete(handler);
  }

  private notifyCountChange(): void {
    this.countChangeHandlers.forEach((h) => h(this.transports.length));
  }

  send(msg: MapMessage): void {
    this.transports.forEach((t) => {
      try {
        t.send(msg);
      } catch {
        // ignore sends to already-closed connections
      }
    });
  }

  onMessage(handler: (msg: MapMessage) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  isConnected(): boolean {
    return this.transports.some((t) => t.isConnected());
  }

  /**
   * Removes transports that are no longer connected and fires count/close
   * notifications if anything changed. Called from the polling loop so that
   * connections that never fired their close event (e.g. abrupt tab close over
   * WebRTC) are still detected within the polling interval.
   */
  pruneDisconnected(): void {
    const before = this.transports.length;
    this.transports = this.transports.filter((t) => t.isConnected());
    if (this.transports.length !== before) {
      this.notifyCountChange();
      if (this.transports.length === 0) {
        this.closeHandlers.forEach((h) => h());
      }
    }
  }

  close(): void {
    this.transports.forEach((t) => t.close());
    this.transports = [];
    this.notifyCountChange();
  }
}
