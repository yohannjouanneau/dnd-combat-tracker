export interface Token {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  imageDataUrl?: string;
  portraitDataUrl?: string;
  label?: string;
  hidden: boolean;
  revealsFog: boolean;
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
  tokens: Token[];
  revealedZones: RevealedZone[];
}

export type MapMessage =
  | { type: "TOKENS_UPDATED"; tokens: Token[] }
  | { type: "FOG_UPDATED"; revealedZones: RevealedZone[] }
  | { type: "MAP_LOADED"; imageDataUrl: string }
  | { type: "REQUEST_FULL_STATE" }
  | { type: "FULL_STATE_RESPONSE"; state: MapState }
  | { type: "POINTER_PING"; x: number; y: number }
  | { type: "FOCUS_TOKEN"; x: number; y: number };

export interface HistoryEntry {
  tokens: Token[];
  revealedZones: RevealedZone[];
}

export interface PingEntry {
  id: number;
  x: number;
  y: number;
  startedAt: number;
}

// Transport abstraction — swap BroadcastChannel for WebRTC/PeerJS without touching MapViewer
export interface MapTransport {
  send(msg: MapMessage): void;
  onMessage(handler: (msg: MapMessage) => void): () => void; // returns unsubscribe fn
  onClose(handler: () => void): () => void; // returns unsubscribe fn
  isConnected(): boolean;
  close(): void;
}
