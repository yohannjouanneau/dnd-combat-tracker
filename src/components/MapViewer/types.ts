export interface Token {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface RevealedZone {
  x: number;
  y: number;
  radius: number;
}

export interface Camera {
  x: number;
  y: number;
  scale: number;
}

export interface MapState {
  imageDataUrl: string | null;
  token: Token;
  revealedZones: RevealedZone[];
}

export type MapMessage =
  | { type: "TOKEN_MOVED"; token: Token }
  | { type: "FOG_UPDATED"; revealedZones: RevealedZone[] }
  | { type: "MAP_LOADED"; imageDataUrl: string }
  | { type: "REQUEST_FULL_STATE" }
  | { type: "FULL_STATE_RESPONSE"; state: MapState };

// Transport abstraction — swap BroadcastChannel for WebRTC/PeerJS without touching MapViewer
export interface MapTransport {
  send(msg: MapMessage): void;
  onMessage(handler: (msg: MapMessage) => void): () => void; // returns unsubscribe fn
  close(): void;
}
