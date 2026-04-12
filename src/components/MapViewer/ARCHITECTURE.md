# MapViewer — Architecture

MapViewer is a canvas-based fog-of-war map viewer for D&D sessions. It supports two roles: **DM** (Dungeon Master, full control) and **Player** (read-only, fog applied). Both views run in separate browser windows or devices and communicate through a pluggable transport layer.

---

## Files

| File | Role |
|---|---|
| `MapViewer.tsx` | Main component — state, interaction, rendering |
| `types.ts` | Shared types: `Token`, `MapState`, `MapMessage`, `MapTransport`, `Camera`, `RevealedZone` |
| `transport.ts` | `BroadcastChannelTransport` — same-origin local sync |
| `PeerJSTransport.ts` | `PeerJSTransport` — WebRTC peer-to-peer sync |
| `PeerJSConnector.tsx` | UI for establishing a PeerJS connection (room code flow) |

---

## State

### `MapState`

The single source of truth for what is on the map:

```ts
interface MapState {
  imageDataUrl: string | null;   // the background map image (data URL)
  tokens: Token[];               // all tokens (enemies, party, NPCs)
  revealedZones: RevealedZone[]; // permanent fog holes (accumulated on token drop)
}
```

`mapStateRef` is a ref that mirrors `mapState` so the RAF loop and callbacks always read the latest value without re-subscribing.

### `Token`

```ts
interface Token {
  id: string;           // stable ID — "player" for the party token
  x: number; y: number; // world-space position
  radius: number;       // display radius in world pixels
  color: string;        // fill color when no image
  imageDataUrl?: string;// circular portrait (data URL)
  label?: string;       // text shown below the token
  hidden: boolean;      // DM-only until revealed; player view skips hidden tokens
  revealsFog: boolean;  // moving this token clears fog on drop
}
```

### `Camera`

```ts
interface Camera { x: number; y: number; scale: number; }
```

Transforms world coordinates to screen: `screen = world * scale + (x, y)`. `screenToWorld` inverts this.

### Undo / Redo

```ts
type HistoryEntry = { tokens: Token[]; revealedZones: RevealedZone[] };
```

`undoStack` and `redoStack` each hold up to 50 entries. A snapshot is pushed **before** every drag-drop commit. `applyHistory` pops from one stack, pushes to the other, restores `mapStateRef`, and sends `TOKENS_UPDATED` + `FOG_UPDATED` to keep the player in sync.

---

## Canvas Rendering (RAF loop)

A single `requestAnimationFrame` loop runs for the lifetime of the component. It reads refs directly (no state subscriptions) for zero-latency rendering.

### Pipeline per frame

```
1. Clear canvas
2. Draw map image (or placeholder grid) — world transform applied
3. Build fog layer (OffscreenCanvas)
   a. Fill black
   b. For each RevealedZone: radial gradient erase ("destination-out")
   c. If a fog-revealing token is being dragged: live drag position erased too
4. Composite fog over map (DM: 40% opacity, Player: 100% opacity)
5. Draw tokens
   a. Clip circle → drawImage (portrait), or filled arc (color)
   b. Stroke: white for visible, amber dashed for hidden
   c. DM dims hidden tokens to 50% alpha
   d. Label below token (only if token.label is set)
6. Draw pointer pings (ripple rings + center dot, 1.2 s lifetime)
7. Reset transform
```

### Image caching

`tokenImagesRef: Map<string, HTMLImageElement>` is keyed by `imageDataUrl`, not token ID. This means multiple tokens can share one portrait without loading it twice. The cache is pruned whenever a token URL is removed.

---

## Interaction

All pointer/touch events are routed through three canonical helpers:

| Helper | Trigger |
|---|---|
| `startPointerInteraction(sx, sy, clientX, clientY)` | mousedown / touchstart |
| `updatePointerInteraction(sx, sy, clientX, clientY)` | mousemove / touchmove |
| `endInteraction(sx?, sy?)` | mouseup / touchend / mouseleave |

### Token drag (DM only)

On `startPointerInteraction`, the DM view finds the nearest token within `radius × 1.5`. If found, `draggingTokenIdRef` is set to its ID and `draggingTokenPosRef` tracks the live world position.

On `endInteraction`:
- The dragged token's `x/y` is committed to `mapState`.
- If `token.revealsFog`, a new `RevealedZone` at the drop position is appended to `revealedZones`.
- A history snapshot is pushed.
- `TOKENS_UPDATED` (and `FOG_UPDATED` if applicable) are sent to the transport.

### Pan & Pinch zoom

Pan: `isPanningRef` tracks an active pan; each move delta is added to `camera.x/y`.

Pinch (touch): two-finger gesture drives both scale (from distance delta) and pan (from center delta) simultaneously via `setCamera`.

Wheel: `ctrlKey` or non-pixel scroll mode → zoom around cursor; otherwise → pan.

### Pointer ping tool

Toggle button switches `isPointerMode`. In pointer mode, press+release with < 6 px of movement emits a `POINTER_PING` to the transport and adds a local ping entry to `pingsRef`. The RAF loop renders expanding ring animations for 1.2 s.

---

## Transport Abstraction

```ts
interface MapTransport {
  send(msg: MapMessage): void;
  onMessage(handler: (msg: MapMessage) => void): () => void; // returns unsubscribe
  onClose(handler: () => void): () => void;                  // returns unsubscribe
  close(): void;
}
```

Two implementations:

### `BroadcastChannelTransport`

Used for **local** (same origin, different tab) sync. A single `BroadcastChannel("dnd-map-viewer")` instance per tab. `onClose` is a no-op — the channel never drops.

### `PeerJSTransport`

Used for **online** play across devices. Wraps a PeerJS `DataConnection`. `close()` calls `conn.close()` but intentionally does **not** call `peer.destroy()` — React Strict Mode double-invokes effects, so destroy would kill the live connection on the first cleanup. The peer cleans up naturally when the tab closes.

### Message types

```ts
type MapMessage =
  | { type: "TOKENS_UPDATED"; tokens: Token[] }    // full token array after any change
  | { type: "FOG_UPDATED"; revealedZones: RevealedZone[] }
  | { type: "MAP_LOADED"; imageDataUrl: string }
  | { type: "REQUEST_FULL_STATE" }                 // player → DM on connect
  | { type: "FULL_STATE_RESPONSE"; state: MapState } // DM → player
  | { type: "POINTER_PING"; x: number; y: number };
```

`TOKENS_UPDATED` always carries the **full array** rather than a per-token delta. This keeps the protocol simple — token changes are infrequent.

---

## PeerJS Connection Flow

```
DM tab                        PeerJS server                  Player tab
  |  peer.on("open") → id          |                              |
  |  show room code                |                              |
  |                                |   peer.connect(roomCode)     |
  |                                | ←────────────────────────── |
  |  peer.on("connection")         |                              |
  |  conn.on("open") →             |                              |
  |  onConnected(PeerJSTransport)  |  ─────────────────────────→ |
  |                                |            conn.on("open")   |
  |                                |      onConnected(transport)  |
  |  ← REQUEST_FULL_STATE ─────────────────────────────────────  |
  |  FULL_STATE_RESPONSE ──────────────────────────────────────→ |
```

`PeerJSConnector.tsx` handles the UI (room code display, copy, join input). Once connected, it calls `onConnected(transport, role)` and unmounts. If the role is `"player"`, the component sets `window.name = PLAYER_WINDOW_NAME` and switches the view to player mode.

---

## DM vs Player rendering

| Concern | DM | Player |
|---|---|---|
| `synced` initial value | `true` | `false` (shows spinner until first message) |
| Hidden tokens | Rendered at 50% alpha, amber dashed stroke | Filtered out entirely |
| Fog opacity | 40% (can see through) | 100% (fully opaque) |
| Interaction | Full drag + all toolbar controls | Pan / pinch / zoom only |
| Token management modal | Visible | Hidden |

The "Waiting for DM" overlay appears when `view === "player" && !synced`. `synced` is set to `true` on **any** incoming message (not just `FULL_STATE_RESPONSE`) to handle a race where `REQUEST_FULL_STATE` is sent between the DM's effect cleanup and re-subscription.
