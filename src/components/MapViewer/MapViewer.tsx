import { RotateCcw, Trash2, Upload, Wifi } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import PeerJSConnector from "./PeerJSConnector";
import { BroadcastChannelTransport } from "./transport";
import type {
  Camera,
  MapMessage,
  MapState,
  MapTransport,
  RevealedZone,
  Token,
} from "./types";

const STORAGE_KEY = "dnd-ct:map-state:v1";
const FOG_DM_OPACITY = 0.4;
const FOG_PLAYER_OPACITY = 1;

const DEFAULT_MAP_STATE: MapState = {
  imageDataUrl: null,
  token: { x: 400, y: 300, radius: 20, color: "#4ade80" },
  revealedZones: [],
};

function loadFromStorage(): MapState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MapState) : null;
  } catch {
    return null;
  }
}

function screenToWorld(
  sx: number,
  sy: number,
  camera: Camera,
): { x: number; y: number } {
  return {
    x: (sx - camera.x) / camera.scale,
    y: (sy - camera.y) / camera.scale,
  };
}

interface Props {
  transport?: MapTransport;
}

export const PLAYER_WINDOW_NAME = "dnd-map-player-view";

export default function MapViewer({ transport: transportProp }: Props) {
  // window.name is set by window.open(url, name) and persists in the opened tab
  const [view, setView] = useState<"dm" | "player">(
    window.name === PLAYER_WINDOW_NAME ? "player" : "dm",
  );
  // PeerJS modal + override transport (replaces BroadcastChannel when connected)
  const [peerModalOpen, setPeerModalOpen] = useState(false);
  const [peerTransport, setPeerTransport] = useState<MapTransport | null>(null);

  const [mapState, setMapState] = useState<MapState>(
    // Player view always starts empty — waits for DM sync
    () =>
      view === "player"
        ? DEFAULT_MAP_STATE
        : (loadFromStorage() ?? DEFAULT_MAP_STATE),
  );
  const [synced, setSynced] = useState(view === "dm"); // player waits for first FULL_STATE_RESPONSE
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 });
  // Undo/redo history — DM only, not persisted or synced
  const [undoStack, setUndoStack] = useState<RevealedZone[][]>([]);
  const [redoStack, setRedoStack] = useState<RevealedZone[][]>([]);
  const [revealRadius, setRevealRadius] = useState(80);
  const revealRadiusRef = useRef(revealRadius);
  revealRadiusRef.current = revealRadius;

  // Refs for RAF loop (avoids stale closures)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogCanvasRef = useRef<OffscreenCanvas | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const mapStateRef = useRef(mapState);
  mapStateRef.current = mapState;
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  // Interaction refs (avoid re-renders on every mouse move)
  const isDraggingTokenRef = useRef(false);
  const draggingTokenPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

  // Transport ref — populated inside the sync effect so it's always a live channel
  const transportRef = useRef<MapTransport | null>(null);

  // Load map image when imageDataUrl changes
  useEffect(() => {
    if (!mapState.imageDataUrl) {
      mapImageRef.current = null;
      return;
    }
    const img = new Image();
    img.src = mapState.imageDataUrl;
    img.onload = () => {
      mapImageRef.current = img;
    };
  }, [mapState.imageDataUrl]);

  // Persist on state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapState));
  }, [mapState]);

  // Sync effect — re-runs when transport changes (BroadcastChannel → PeerJS swap)
  // BroadcastChannelTransport is created here so Strict Mode's double-invoke gets a
  // fresh channel each time. PeerJSTransport is provided externally and must NOT be
  // closed in the cleanup — Strict Mode would kill the live connection prematurely.
  useEffect(() => {
    const isLocalTransport = !peerTransport && !transportProp;
    const transport =
      peerTransport ?? transportProp ?? new BroadcastChannelTransport();
    transportRef.current = transport;

    // Register listener BEFORE sending, to avoid missing a fast response
    const unsub = transport.onMessage((msg: MapMessage) => {
      switch (msg.type) {
        case "REQUEST_FULL_STATE":
          if (view === "dm") {
            transport.send({
              type: "FULL_STATE_RESPONSE",
              state: mapStateRef.current,
            });
          }
          break;
        case "FULL_STATE_RESPONSE":
          if (view === "player") {
            setMapState(msg.state);
            setSynced(true);
          }
          break;
        case "TOKEN_MOVED":
          setMapState((s) => ({ ...s, token: msg.token }));
          break;
        case "FOG_UPDATED":
          setMapState((s) => ({ ...s, revealedZones: msg.revealedZones }));
          break;
        case "MAP_LOADED":
          setMapState((s) => ({ ...s, imageDataUrl: msg.imageDataUrl }));
          break;
      }
    });

    if (view === "player") {
      transport.send({ type: "REQUEST_FULL_STATE" });
    }

    return () => {
      unsub();
      if (isLocalTransport) {
        transport.close();
      }
    };
  }, [view, transportProp, peerTransport]);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sync = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    const observer = new ResizeObserver(sync);
    observer.observe(canvas);
    sync();
    return () => observer.disconnect();
  }, []);

  // RAF rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let rafId: number;

    function render() {
      const w = canvas!.width;
      const h = canvas!.height;
      if (w === 0 || h === 0) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const { x: panX, y: panY, scale } = cameraRef.current;
      const { token, revealedZones } = mapStateRef.current;

      // Use live drag position if currently dragging
      const tokenPos =
        isDraggingTokenRef.current && draggingTokenPosRef.current
          ? draggingTokenPosRef.current
          : token;

      // 1. Clear
      ctx.clearRect(0, 0, w, h);

      // 2. Apply camera + draw map
      ctx.setTransform(scale, 0, 0, scale, panX, panY);
      const img = mapImageRef.current;
      if (img) {
        ctx.drawImage(img, 0, 0);
      } else {
        // Placeholder grid when no map is loaded
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, 2000, 2000);
        ctx.strokeStyle = "#2a2a4e";
        ctx.lineWidth = 1 / scale;
        for (let x = 0; x <= 2000; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 2000);
          ctx.stroke();
        }
        for (let y = 0; y <= 2000; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(2000, y);
          ctx.stroke();
        }
      }

      // 3. Fog layer — draw on offscreen canvas then composite onto main
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (
        !fogCanvasRef.current ||
        fogCanvasRef.current.width !== w ||
        fogCanvasRef.current.height !== h
      ) {
        fogCanvasRef.current = new OffscreenCanvas(w, h);
      }
      const fogCtx = fogCanvasRef.current.getContext("2d")!;
      fogCtx.clearRect(0, 0, w, h);
      fogCtx.fillStyle = "#000";
      fogCtx.fillRect(0, 0, w, h);

      // Add live drag zone so DM sees fog update while dragging
      const zones: RevealedZone[] =
        isDraggingTokenRef.current && draggingTokenPosRef.current
          ? [
              ...revealedZones,
              {
                x: draggingTokenPosRef.current.x,
                y: draggingTokenPosRef.current.y,
                radius: revealRadiusRef.current,
              },
            ]
          : revealedZones;

      if (zones.length > 0) {
        fogCtx.save();
        fogCtx.setTransform(scale, 0, 0, scale, panX, panY);
        fogCtx.globalCompositeOperation = "destination-out";
        for (const zone of zones) {
          const grad = fogCtx.createRadialGradient(
            zone.x,
            zone.y,
            0,
            zone.x,
            zone.y,
            zone.radius,
          );
          grad.addColorStop(0, "rgba(0,0,0,1)");
          grad.addColorStop(0.7, "rgba(0,0,0,0.8)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          fogCtx.fillStyle = grad;
          fogCtx.beginPath();
          fogCtx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
          fogCtx.fill();
        }
        fogCtx.restore();
      }

      ctx.globalAlpha = view === "dm" ? FOG_DM_OPACITY : FOG_PLAYER_OPACITY;
      ctx.drawImage(fogCanvasRef.current, 0, 0);
      ctx.globalAlpha = 1;

      // 4. Token
      ctx.setTransform(scale, 0, 0, scale, panX, panY);
      ctx.beginPath();
      ctx.arc(tokenPos.x, tokenPos.y, token.radius, 0, Math.PI * 2);
      ctx.fillStyle = token.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2 / scale;
      ctx.stroke();

      // 5. Reset transform
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      rafId = requestAnimationFrame(render);
    }

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [view]);

  // --- Interaction handlers ---

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy, cameraRef.current);
      const { token } = mapStateRef.current;

      const dist = Math.hypot(world.x - token.x, world.y - token.y);
      if (view === "dm" && dist <= token.radius * 1.5) {
        isDraggingTokenRef.current = true;
        draggingTokenPosRef.current = { x: token.x, y: token.y };
      } else {
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [view],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDraggingTokenRef.current) {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        // Update ref only — RAF loop reads it directly for smooth rendering
        draggingTokenPosRef.current = screenToWorld(sx, sy, cameraRef.current);
      } else if (isPanningRef.current) {
        const dx = e.clientX - lastPanPosRef.current.x;
        const dy = e.clientY - lastPanPosRef.current.y;
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
        setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
      }
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingTokenRef.current) {
      isDraggingTokenRef.current = false;
      const finalPos = draggingTokenPosRef.current;
      draggingTokenPosRef.current = null;

      if (finalPos) {
        const token: Token = { ...mapStateRef.current.token, ...finalPos };
        const prevZones = mapStateRef.current.revealedZones;
        const revealedZones: RevealedZone[] = [
          ...prevZones,
          { x: finalPos.x, y: finalPos.y, radius: revealRadius },
        ];
        // Update ref immediately so next render frame is correct
        mapStateRef.current = { ...mapStateRef.current, token, revealedZones };
        setMapState(mapStateRef.current);
        setUndoStack((s) => [...s, prevZones]);
        setRedoStack([]);

        transportRef.current?.send({ type: "TOKEN_MOVED", token });
        transportRef.current?.send({ type: "FOG_UPDATED", revealedZones });
      }
    }
    isPanningRef.current = false;
  }, [revealRadius]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const zoomFactor = Math.pow(0.999, e.deltaY);
    const world = screenToWorld(sx, sy, cameraRef.current);
    setCamera((c) => {
      const newScale = Math.min(5, Math.max(0.1, c.scale * zoomFactor));
      return {
        scale: newScale,
        x: sx - world.x * newScale,
        y: sy - world.y * newScale,
      };
    });
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imageDataUrl = ev.target?.result as string;
      const newState: MapState = {
        ...mapStateRef.current,
        imageDataUrl,
        revealedZones: [],
      };
      mapStateRef.current = newState;
      setMapState(newState);
      transportRef.current?.send({ type: "MAP_LOADED", imageDataUrl });
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-imported
    e.target.value = "";
  }, []);

  const openPlayerView = useCallback(() => {
    // Open the same URL with a named window — the name is how MapViewer detects player mode
    window.open(window.location.href, PLAYER_WINDOW_NAME);
  }, []);

  const cursorStyle =
    view === "player"
      ? "grab"
      : isDraggingTokenRef.current
        ? "grabbing"
        : "crosshair";

  return (
    <div className="w-full h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1 flex-wrap">
        {/* Section 1 — navigation & status */}
        <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
          <button
            onClick={() => {
              location.hash = "";
            }}
            className="hover:text-text-primary text-text-muted px-2 py-0.5 rounded text-sm transition"
          >
            ← Back
          </button>
          <span className="w-px h-4 bg-border-primary mx-1" />
          <span
            className={`px-2 py-0.5 rounded text-xs font-bold tracking-wide ${
              view === "dm" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            }`}
          >
            {view === "dm" ? "DM View" : "Player View"}
          </span>
          <span className="text-text-muted text-xs tabular-nums ml-1">
            {Math.round(camera.scale * 100)}%
          </span>
        </div>

        {view === "dm" && (
          <>
            {/* Section 2 — fog controls */}
            <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
              <label className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm cursor-pointer transition flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Import Map
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              <span className="w-px h-4 bg-border-primary mx-0.5" />
              <label className="text-text-primary px-2 py-1 rounded text-sm flex items-center gap-2">
                <span className="whitespace-nowrap text-text-muted text-xs">
                  Visibility
                </span>
                <input
                  type="range"
                  min={20}
                  max={300}
                  value={revealRadius}
                  onChange={(e) => setRevealRadius(Number(e.target.value))}
                  className="w-20 accent-blue-400"
                />
                <span className="tabular-nums w-8 text-right text-text-muted text-xs">
                  {revealRadius}
                </span>
              </label>
              <span className="w-px h-4 bg-border-primary mx-0.5" />
              <button
                onClick={() => {
                  if (undoStack.length === 0) return;
                  const revealedZones = undoStack[undoStack.length - 1];
                  setUndoStack((s) => s.slice(0, -1));
                  setRedoStack((s) => [
                    ...s,
                    mapStateRef.current.revealedZones,
                  ]);
                  const newState = { ...mapStateRef.current, revealedZones };
                  mapStateRef.current = newState;
                  setMapState(newState);
                  transportRef.current?.send({
                    type: "FOG_UPDATED",
                    revealedZones,
                  });
                }}
                disabled={undoStack.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Undo last reveal"
              >
                <RotateCcw className="w-4 h-4" />
                Undo
              </button>
              <button
                onClick={() => {
                  if (redoStack.length === 0) return;
                  const revealedZones = redoStack[redoStack.length - 1];
                  setRedoStack((s) => s.slice(0, -1));
                  setUndoStack((s) => [
                    ...s,
                    mapStateRef.current.revealedZones,
                  ]);
                  const newState = { ...mapStateRef.current, revealedZones };
                  mapStateRef.current = newState;
                  setMapState(newState);
                  transportRef.current?.send({
                    type: "FOG_UPDATED",
                    revealedZones,
                  });
                }}
                disabled={redoStack.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Redo last reveal"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
                Redo
              </button>
              <button
                onClick={() => {
                  const prevZones = mapStateRef.current.revealedZones;
                  if (prevZones.length === 0) return;
                  setUndoStack((s) => [...s, prevZones]);
                  setRedoStack([]);
                  const revealedZones: RevealedZone[] = [];
                  const newState = { ...mapStateRef.current, revealedZones };
                  mapStateRef.current = newState;
                  setMapState(newState);
                  transportRef.current?.send({
                    type: "FOG_UPDATED",
                    revealedZones,
                  });
                }}
                disabled={mapState.revealedZones.length === 0}
                className="hover:bg-panel-secondary disabled:opacity-40 disabled:cursor-not-allowed text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Reset all fog"
              >
                <Trash2 className="w-4 h-4" />
                Reset Fog
              </button>
            </div>

            {/* Section 3 — sync */}
            <div className="flex items-center gap-1 bg-panel-bg/90 border border-border-primary rounded-lg px-2 py-1">
              <span className="text-xs text-text-muted px-1 select-none">
                Local
              </span>
              <button
                onClick={openPlayerView}
                className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition"
              >
                Open Player View
              </button>
              <span className="w-px h-4 bg-border-primary mx-1" />
              <span className="text-xs text-text-muted px-1 select-none">
                Online
              </span>
              <button
                onClick={() => setPeerModalOpen(true)}
                className="hover:bg-panel-secondary text-text-primary px-2 py-1 rounded text-sm transition flex items-center gap-1.5"
                title="Connect online via PeerJS"
              >
                <Wifi className="w-4 h-4" />
                Connect Online
              </button>
            </div>
          </>
        )}
      </div>

      {peerModalOpen && (
        <PeerJSConnector
          onConnected={(transport, role) => {
            setPeerTransport(transport);
            if (role === "player") {
              window.name = PLAYER_WINDOW_NAME;
              setView("player");
              setSynced(false);
            }
            setPeerModalOpen(false);
          }}
          onClose={() => setPeerModalOpen(false)}
        />
      )}

      {/* Waiting for DM overlay (player view, not yet synced) */}
      {view === "player" && !synced && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 z-20">
          <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm">Waiting for DM…</p>
          <p className="text-white/30 text-xs">Make sure the DM tab is open</p>
        </div>
      )}

      {/* Helper text when no map is loaded */}
      {!mapState.imageDataUrl && view === "dm" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/30 text-lg select-none">
            Import a map to get started
          </p>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
